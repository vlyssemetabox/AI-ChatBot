import { NextResponse } from 'next/server';
import { db } from '@/lib/db/neon';
import { usageLogs, orgSubscriptions } from '@/lib/db/schema';
import { getUserOrgContext } from '@/lib/auth/utils';
import { eq, and, gte, sql } from 'drizzle-orm';

export async function GET() {
    try {
        const { orgId } = await getUserOrgContext();
        console.log(`[DEBUG] Billing API called for Org: ${orgId}`);
        if (!orgId) {
            return NextResponse.json({ error: 'Organization context required' }, { status: 400 });
        }

        // 1. Get Subscription info
        let [subscription] = await db
            .select()
            .from(orgSubscriptions)
            .where(sql`CAST(${orgSubscriptions.orgId} AS TEXT) = ${orgId}::TEXT`);

        if (!subscription) {
            [subscription] = await db.insert(orgSubscriptions).values({
                orgId: sql`${orgId}::uuid`,
                plan: 'free',
            }).returning();
        }

        // 2. Get monthly usage
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);

        const usage = await db
            .select({
                totalIn: sql<number>`sum(${usageLogs.tokensIn})`,
                totalOut: sql<number>`sum(${usageLogs.tokensOut})`,
            })
            .from(usageLogs)
            .where(and(
                sql`CAST(${usageLogs.orgId} AS TEXT) = ${orgId}::TEXT`,
                gte(usageLogs.createdAt, startOfMonth)
            ));

        const totalTokens = (Number(usage[0]?.totalIn) || 0) + (Number(usage[0]?.totalOut) || 0);

        return NextResponse.json({
            plan: subscription.plan,
            status: subscription.status,
            usage: {
                total: totalTokens,
                limit: 50000,
                periodStart: startOfMonth.toISOString(),
            }
        });
    } catch (error: any) {
        console.error('Billing GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch billing info' }, { status: 500 });
    }
}
