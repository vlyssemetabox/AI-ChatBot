import { db } from '@/lib/db/neon';
import { orgMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/utils';
import { getUserOrgMembership, ROLES } from '@/lib/auth/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/organizations/leave
 * Leave the current organization.
 * Normal Users and Admins can leave. Super Admins must destroy the org instead.
 */
export async function POST() {
    try {
        const userId = await getUserId();
        const membership = await getUserOrgMembership(userId);

        if (!membership) {
            return Response.json({ error: 'You are not in any organization' }, { status: 400 });
        }

        if (membership.role === ROLES.SUPER_ADMIN) {
            return Response.json(
                { error: 'Super Admins cannot leave. Use "Destroy Organization" instead.' },
                { status: 403 }
            );
        }

        await db
            .delete(orgMembers)
            .where(and(
                eq(orgMembers.orgId, membership.orgId),
                eq(orgMembers.userId, userId)
            ));

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Leave org error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
}
