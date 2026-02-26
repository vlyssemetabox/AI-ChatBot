import { NextRequest } from 'next/server';
import { db } from '@/lib/db/neon';
import { chatbotSettings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserOrgContext } from '@/lib/auth/utils';
import { requireRole, ROLES } from '@/lib/auth/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/settings
 * Read org-level settings (any org member can read)
 */
export async function GET() {
    try {
        const { userId, orgId } = await getUserOrgContext();

        if (!orgId) {
            return Response.json({});
        }

        const rows = await db
            .select({ key: chatbotSettings.key, value: chatbotSettings.value })
            .from(chatbotSettings)
            .where(eq(chatbotSettings.orgId, orgId));

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

/**
 * POST /api/settings
 * Write org-level settings (Super Admin only)
 */
export async function POST(req: NextRequest) {
    try {
        const { userId, orgId } = await getUserOrgContext();

        if (!orgId) {
            return Response.json({ error: 'No organization found' }, { status: 403 });
        }

        // Require Super Admin to change settings
        await requireRole(userId, ROLES.SUPER_ADMIN);

        const body = await req.json();
        const { model_config, ...guardrails } = body;

        // Upsert guardrails (org-scoped)
        const existingGuardrails = await db
            .select()
            .from(chatbotSettings)
            .where(
                and(
                    eq(chatbotSettings.orgId, orgId),
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
                        eq(chatbotSettings.orgId, orgId),
                        eq(chatbotSettings.key, 'guardrails')
                    )
                );
        } else {
            await db.insert(chatbotSettings).values({
                userId: userId,
                orgId: orgId,
                key: 'guardrails',
                value: guardrails,
            });
        }

        // Upsert model_config if present (org-scoped)
        if (model_config) {
            const existingConfig = await db
                .select()
                .from(chatbotSettings)
                .where(
                    and(
                        eq(chatbotSettings.orgId, orgId),
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
                            eq(chatbotSettings.orgId, orgId),
                            eq(chatbotSettings.key, 'model_config')
                        )
                    );
            } else {
                await db.insert(chatbotSettings).values({
                    userId: userId,
                    orgId: orgId,
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
        if (error.message.includes('Forbidden')) {
            return Response.json({ error: error.message }, { status: 403 });
        }
        return Response.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
