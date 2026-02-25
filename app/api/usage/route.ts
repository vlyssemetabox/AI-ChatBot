import { NextRequest } from 'next/server';
import { db } from '@/lib/db/neon';
import { usageLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userId = await getUserId();

        const allLogs = await db
            .select({
                tokensIn: usageLogs.tokensIn,
                tokensOut: usageLogs.tokensOut,
                createdAt: usageLogs.createdAt,
            })
            .from(usageLogs)
            .where(eq(usageLogs.userId, userId));

        let lifetimeTokens = 0;
        let lifetimeRequests = 0;
        let todayTokens = 0;
        let todayRequests = 0;

        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        allLogs.forEach((log) => {
            const tokens = (log.tokensIn || 0) + (log.tokensOut || 0);
            lifetimeTokens += tokens;
            lifetimeRequests++;

            if (log.createdAt >= startOfDay) {
                todayTokens += tokens;
                todayRequests++;
            }
        });

        return Response.json({
            today_tokens: todayTokens,
            today_requests: todayRequests,
            total_tokens: lifetimeTokens,
            total_requests: lifetimeRequests,
        });
    } catch (error: any) {
        console.error('Usage API Error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: 'Failed to fetch usage' }, { status: 500 });
    }
}
