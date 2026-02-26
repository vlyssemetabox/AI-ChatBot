import { db } from '@/lib/db/neon';
import { usageLogs, orgMembers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserOrgContext } from '@/lib/auth/utils';
import { requireRole, ROLES } from '@/lib/auth/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/usage
 * Get usage stats for the org (Admin+ sees per-user breakdown)
 */
export async function GET() {
    try {
        const { userId, orgId, role } = await getUserOrgContext();

        if (!orgId) {
            return Response.json({
                today_tokens: 0,
                today_requests: 0,
                total_tokens: 0,
                total_requests: 0,
            });
        }

        const allLogs = await db
            .select({
                userId: usageLogs.userId,
                tokensIn: usageLogs.tokensIn,
                tokensOut: usageLogs.tokensOut,
                createdAt: usageLogs.createdAt,
            })
            .from(usageLogs)
            .where(eq(usageLogs.orgId, orgId));

        let lifetimeTokens = 0;
        let lifetimeRequests = 0;
        let todayTokens = 0;
        let todayRequests = 0;

        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        // Per-user breakdown for admins
        const perUser: Record<string, { tokens: number; requests: number }> = {};

        allLogs.forEach((log) => {
            const tokens = (log.tokensIn || 0) + (log.tokensOut || 0);
            lifetimeTokens += tokens;
            lifetimeRequests++;

            if (log.createdAt >= startOfDay) {
                todayTokens += tokens;
                todayRequests++;
            }

            // Track per-user
            if (!perUser[log.userId]) {
                perUser[log.userId] = { tokens: 0, requests: 0 };
            }
            perUser[log.userId].tokens += tokens;
            perUser[log.userId].requests++;
        });

        const result: any = {
            today_tokens: todayTokens,
            today_requests: todayRequests,
            total_tokens: lifetimeTokens,
            total_requests: lifetimeRequests,
        };

        // Admin+ can see per-user breakdown
        if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
            // Enrich with user names
            const members = await db
                .select({
                    userId: orgMembers.userId,
                    name: users.name,
                    email: users.email,
                })
                .from(orgMembers)
                .innerJoin(users, eq(orgMembers.userId, users.id))
                .where(eq(orgMembers.orgId, orgId));

            const nameMap = Object.fromEntries(
                members.map((m) => [m.userId, { name: m.name, email: m.email }])
            );

            result.per_user = Object.entries(perUser).map(([uid, stats]) => ({
                userId: uid,
                name: nameMap[uid]?.name || 'Unknown',
                email: nameMap[uid]?.email || '',
                ...stats,
            }));
        }

        return Response.json(result);
    } catch (error: any) {
        console.error('Usage API Error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: 'Failed to fetch usage' }, { status: 500 });
    }
}
