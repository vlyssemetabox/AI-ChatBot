import { NextResponse } from 'next/server';
import { db } from '@/lib/db/neon';
import { orgSubscriptions } from '@/lib/db/schema';
import { getUserOrgContext } from '@/lib/auth/utils';
import { sql } from 'drizzle-orm';
import { requireRole, ROLES } from '@/lib/auth/rbac';

export async function POST() {
    try {
        const { userId, orgId } = await getUserOrgContext();
        if (!orgId) {
            return NextResponse.json({ error: 'Organization context required' }, { status: 400 });
        }

        // Only Super Admin can upgrade the org
        await requireRole(userId, ROLES.SUPER_ADMIN);

        // MOCK CHECKOUT SUCCESS
        // Transition organization to PRO plan
        const [updated] = await db
            .update(orgSubscriptions)
            .set({
                plan: 'pro',
                updatedAt: new Date(),
            })
            .where(sql`CAST(${orgSubscriptions.orgId} AS TEXT) = ${orgId}::TEXT`)
            .returning();

        return NextResponse.json({
            success: true,
            plan: updated.plan,
            message: 'Successfully upgraded to Pro (Mocked Checkout)'
        });
    } catch (error: any) {
        console.error('Billing Checkout Error:', error);
        if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
            return NextResponse.json({ error: 'Permission denied. Only Super Admins can manage billing.' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 });
    }
}
