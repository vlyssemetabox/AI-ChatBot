import { NextRequest } from 'next/server';
import { searchSimilarDocuments } from '@/lib/services/vectorStore';
import { generateStreamingCompletion, Message } from '@/lib/services/cerebrasClient';
import { db } from '@/lib/db/neon';
import { chatbotSettings, usageLogs, conversations, messages } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { getUserOrgContext } from '@/lib/auth/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat
 * Handle chat queries with RAG
 */
export async function POST(req: NextRequest) {
    try {
        const { userId, orgId } = await getUserOrgContext();
        let { message, conversationHistory = [], conversationId } = await req.json();

        if (!message) {
            return Response.json({ error: 'Message is required' }, { status: 400 });
        }

        console.log(`💬 Query: ${message}`);

        // Create or update conversation
        if (!conversationId) {
            const title = message.length > 40 ? message.substring(0, 40) + '...' : message;
            const [newConv] = await db.insert(conversations).values({
                userId,
                title,
            }).returning();
            conversationId = newConv.id;
        } else {
            await db.update(conversations)
                .set({ updatedAt: new Date() })
                .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
        }

        // Insert user message
        await db.insert(messages).values({
            conversationId,
            role: 'user',
            content: message,
        });

        // 1. Fetch settings from Neon via Drizzle (FAILSAFE)
        let settings: any = {};
        try {
            // Fetch org-level settings if user has an org
            const settingsFilter = orgId
                ? eq(chatbotSettings.orgId, orgId)
                : eq(chatbotSettings.userId, userId);

            const rows = await db
                .select({ key: chatbotSettings.key, value: chatbotSettings.value })
                .from(chatbotSettings)
                .where(
                    and(
                        settingsFilter,
                        inArray(chatbotSettings.key, ['guardrails', 'model_config'])
                    )
                );

            if (rows.length > 0) {
                settings = rows.reduce(
                    (acc, row) => ({
                        ...acc,
                        ...(row.value as object),
                        [row.key]: row.value,
                    }),
                    {}
                );
            }
        } catch (err) {
            console.error('Settings fetch error, using defaults:', err);
        }

        const defaultSettings = {
            system_prompt:
                'You are a helpful AI Assistant. You answer questions based on the provided documents.',
            competitors: [],
            messages: {
                competitor_response: 'I cannot answer questions about competitors.',
                fallback_response: "I don't have that information.",
            },
            faqs: [
                'Summarize the key points from the documents',
                'What are the main risks mentioned?',
                'Can you help me find specific details?',
            ],
        };

        settings = { ...defaultSettings, ...settings };

        // 2. Search for relevant documents (org-scoped if user has an org)
        const searchScope = orgId || userId;
        const searchQuery = message.toLowerCase().includes('zoho')
            ? message
            : `${message} Zoho Books`;

        const relevantDocs = await searchSimilarDocuments(searchScope, searchQuery, 10);

        // 3. Build context from retrieved documents
        let context = '';
        if (relevantDocs.length > 0) {
            context = 'Here is relevant information from the documents:\n\n';
            relevantDocs.forEach((doc, idx) => {
                context += `[Source ${idx + 1}]: ${doc.content}\n\n`;
            });
        }

        // 4. Construct System Prompt
        const competitorsList = settings.competitors?.join(', ') || '';
        const systemPromptTemplate =
            settings.system_prompt || 'You are a helpful AI Assistant.';

        const finalSystemPrompt = systemPromptTemplate
            .replace(/{competitors}/g, competitorsList)
            .replace(
                /{competitor_response}/g,
                settings.messages?.competitor_response || 'I cannot answer questions about competitors.'
            )
            .replace(
                /{fallback_response}/g,
                settings.messages?.fallback_response || "I don't have that information."
            );

        const systemMessage: Message = {
            role: 'system',
            content: finalSystemPrompt,
        };

        const chatMessages: Message[] = [
            systemMessage,
            ...conversationHistory,
            {
                role: 'user',
                content: context ? `${context}\n\nQuestion: ${message}` : message,
            },
        ];

        // Create a readable stream for the response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                let tokensOut = 0;
                const tokensIn = Math.ceil(JSON.stringify(chatMessages).length / 4);

                try {
                    let model =
                        (settings.model_config as any)?.model || 'llama3.1-8b';

                    // Auto-upgrade deprecated model IDs
                    if (model === 'llama-3.3-70b' || model === 'llama3.1-70b') {
                        model = 'llama3.1-8b';
                    }

                    console.log(`🤖 Model: ${model}`);

                    const aiStream = await generateStreamingCompletion(chatMessages, model);

                    let isThinking = false;
                    let internalBuffer = '';
                    let fullAssistantResponse = '';
                    const THINK_START = '<think>';
                    const THINK_END = '</think>';

                    // Send conversation ID to frontend right away
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId })}\n\n`));

                    for await (const chunk of aiStream) {
                        const content = chunk.choices[0]?.delta?.content || '';

                        if (content) {
                            tokensOut += Math.ceil(content.length / 4);
                            internalBuffer += content;

                            while (true) {
                                if (isThinking) {
                                    const endIdx = internalBuffer.indexOf(THINK_END);
                                    if (endIdx !== -1) {
                                        isThinking = false;
                                        internalBuffer = internalBuffer.substring(
                                            endIdx + THINK_END.length
                                        );
                                        continue;
                                    } else {
                                        if (internalBuffer.length > THINK_END.length) {
                                            internalBuffer = internalBuffer.slice(
                                                -THINK_END.length
                                            );
                                        }
                                        break;
                                    }
                                } else {
                                    const startIdx = internalBuffer.indexOf(THINK_START);
                                    if (startIdx !== -1) {
                                        if (startIdx > 0) {
                                            const validContent = internalBuffer.substring(
                                                0,
                                                startIdx
                                            );
                                            fullAssistantResponse += validContent;
                                            const data = JSON.stringify({
                                                content: validContent,
                                            });
                                            controller.enqueue(
                                                encoder.encode(`data: ${data}\n\n`)
                                            );
                                        }
                                        isThinking = true;
                                        internalBuffer = internalBuffer.substring(
                                            startIdx + THINK_START.length
                                        );
                                        continue;
                                    } else {
                                        const keepLen = THINK_START.length;
                                        if (internalBuffer.length > keepLen) {
                                            const emitLen =
                                                internalBuffer.length - keepLen;
                                            const validContent =
                                                internalBuffer.substring(0, emitLen);
                                            fullAssistantResponse += validContent;
                                            const data = JSON.stringify({
                                                content: validContent,
                                            });
                                            controller.enqueue(
                                                encoder.encode(`data: ${data}\n\n`)
                                            );
                                            internalBuffer =
                                                internalBuffer.substring(emitLen);
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    // Flush remaining buffer
                    if (internalBuffer && !isThinking) {
                        fullAssistantResponse += internalBuffer;
                        const data = JSON.stringify({ content: internalBuffer });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }

                    // Log usage to Neon via Drizzle
                    try {
                        await db.insert(usageLogs).values({
                            userId: userId,
                            model,
                            tokensIn,
                            tokensOut,
                        });
                    } catch (logError) {
                        console.error('Failed to log usage:', logError);
                    }

                    // Send sources
                    let sourcesArray: any[] = [];
                    if (relevantDocs.length > 0) {
                        sourcesArray = relevantDocs.map((doc, idx) => ({
                            index: idx + 1,
                            filename: doc.metadata?.filename || 'Unknown',
                            chunkIndex: doc.metadata?.chunkIndex,
                        }));
                        const sourcesData = JSON.stringify({ sources: sourcesArray });
                        controller.enqueue(
                            encoder.encode(`data: ${sourcesData}\n\n`)
                        );
                    }

                    // Persist assistant message
                    try {
                        await db.insert(messages).values({
                            conversationId,
                            role: 'assistant',
                            content: fullAssistantResponse,
                            sources: sourcesArray.length > 0 ? sourcesArray : null,
                        });
                    } catch (msgErr) {
                        console.error('Failed to log assistant message:', msgErr);
                    }

                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    console.error('Streaming error:', error);
                    const errorData = JSON.stringify({
                        error: (error as Error).message,
                    });
                    controller.enqueue(
                        encoder.encode(`data: ${errorData}\n\n`)
                    );
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('Chat error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
