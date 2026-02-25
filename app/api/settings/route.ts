import { NextRequest } from 'next/server';
import { db } from '@/lib/db/neon';
import { chatbotSettings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userId = await getUserId();

        const rows = await db
            .select({ key: chatbotSettings.key, value: chatbotSettings.value })
            .from(chatbotSettings)
            .where(eq(chatbotSettings.userId, userId));

        const settings = rows.reduce((acc: any, row) => {
            if (row.key === 'guardrails') {
                return { ...acc, ...(row.value as object) };
            }
            if (row.key === 'model_config') {
                return { ...acc, model_config: row.value };
            }
            return acc;
        }, {});

        return Response.json(settings);
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserId();
        const body = await req.json();
        const { model_config, ...guardrails } = body;

        // Upsert guardrails
        const existingGuardrails = await db
            .select()
            .from(chatbotSettings)
            .where(
                and(
                    eq(chatbotSettings.userId, userId),
                    eq(chatbotSettings.key, 'guardrails')
                )
            )
            .limit(1);

        if (existingGuardrails.length > 0) {
            await db
                .update(chatbotSettings)
                .set({ value: guardrails, updatedAt: new Date() })
                .where(
                    and(
                        eq(chatbotSettings.userId, userId),
                        eq(chatbotSettings.key, 'guardrails')
                    )
                );
        } else {
            await db.insert(chatbotSettings).values({
                userId: userId,
                key: 'guardrails',
                value: guardrails,
            });
        }

        // Upsert model_config if present
        if (model_config) {
            const existingConfig = await db
                .select()
                .from(chatbotSettings)
                .where(
                    and(
                        eq(chatbotSettings.userId, userId),
                        eq(chatbotSettings.key, 'model_config')
                    )
                )
                .limit(1);

            if (existingConfig.length > 0) {
                await db
                    .update(chatbotSettings)
                    .set({ value: model_config, updatedAt: new Date() })
                    .where(
                        and(
                            eq(chatbotSettings.userId, userId),
                            eq(chatbotSettings.key, 'model_config')
                        )
                    );
            } else {
                await db.insert(chatbotSettings).values({
                    userId: userId,
                    key: 'model_config',
                    value: model_config,
                });
            }
        }

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Error saving settings:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
