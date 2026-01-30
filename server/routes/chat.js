import express from 'express';
import { searchSimilarDocuments } from '../services/vectorStore.js';
import { generateStreamingCompletion } from '../services/cerebrasClient.js';

const router = express.Router();

/**
 * POST /api/chat
 * Handle chat queries with RAG
 */
router.post('/', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`💬 Query: ${message}`);

        // Search for relevant documents (increased from 3 to 10 for better coverage)
        const relevantDocs = await searchSimilarDocuments(message, 10);

        // Build context from retrieved documents
        let context = '';
        if (relevantDocs.length > 0) {
            context = 'Here is relevant information from the documents:\n\n';
            relevantDocs.forEach((doc, idx) => {
                context += `[Source ${idx + 1}]: ${doc.content}\n\n`;
            });
        }

        // Build messages for LLM
        const systemMessage = {
            role: 'system',
            content: `You are Zoho AI Assistant. You MUST follow these rules STRICTLY:

🚫 ABSOLUTE PROHIBITIONS - NEVER VIOLATE THESE:
1. DO NOT provide ANY information about competitors (Odoo, Salesforce, HubSpot, Microsoft Dynamics, SAP, Oracle, NetSuite, Freshworks, Monday.com, etc.)
2. DO NOT use general knowledge or training data - ONLY use the provided documents
3. DO NOT create "Alternative Answers" or provide general information when documents don't have the answer
4. DO NOT discuss, compare, or mention competitor features, pricing, or capabilities
5. DO NOT list Zoho features when asked about competitors - ONLY use the redirect message below

✅ REQUIRED BEHAVIOR FOR COMPETITOR QUESTIONS:
When asked about competitors (Odoo, Salesforce, etc.), you MUST respond with EXACTLY this and NOTHING else:

"I don't have information about that in my knowledge base. However, I'd be happy to help you with questions about Zoho products and services! What would you like to know about Zoho?"

DO NOT add Zoho features. DO NOT add notes. DO NOT add sources. JUST the redirect message above.

✅ REQUIRED BEHAVIOR FOR NON-DOCUMENT QUESTIONS:
When asked about topics NOT in the documents (but not competitors), respond with:

"I don't have that information in the uploaded documents. However, I'd be happy to help you with questions about Zoho! What would you like to know?"

📋 RESPONSE RULES:
- Documents have relevant info → Answer using ONLY that information + cite sources
- Asked about competitors → Use EXACT redirect message (no features, no notes)
- Asked about non-document topics → Say you don't have it + redirect to Zoho
- NEVER make up information
- NEVER use training data or general knowledge
- ALWAYS stay focused on Zoho

📝 FORMATTING (when answering from documents):
- Use ## for headings
- Use bullet points (-) for lists
- Use **bold** for key terms
- Cite sources as [Source N]
- Keep paragraphs short (2-3 sentences)
- Add blank lines between sections

Remember: Competitor questions = EXACT redirect message ONLY. Document questions = Answer with sources. Everything else = Redirect to Zoho.`
        };

        const messages = [
            systemMessage,
            ...conversationHistory,
            {
                role: 'user',
                content: context ? `${context}\n\nQuestion: ${message}` : message
            }
        ];

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Get streaming response from Cerebras
        const stream = await generateStreamingCompletion(messages);

        // Stream the response
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        // Send sources at the end
        if (relevantDocs.length > 0) {
            const sources = relevantDocs.map((doc, idx) => ({
                index: idx + 1,
                filename: doc.metadata?.filename || 'Unknown',
                chunkIndex: doc.metadata?.chunkIndex
            }));

            res.write(`data: ${JSON.stringify({ sources })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Chat error:', error);

        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }
});

export default router;
