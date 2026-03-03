import { NextRequest } from 'next/server';
import { db } from '@/lib/db/neon';
import { orgMembers, userDepartmentAccess } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/utils';
import { requireRole, ROLES } from '@/lib/auth/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/organizations/members/access
 * Grant or revoke user access to a department. 
 * Body: { userId, departmentId, action: 'grant' | 'revoke' }
 */
export async function POST(req: NextRequest) {
    try {
        const adminId = await getUserId();
        // Require Admin or Super Admin
        const { orgId } = await requireRole(adminId, ROLES.ADMIN);

        const { userId, departmentId, action } = await req.json();

        if (!userId || !departmentId || !['grant', 'revoke'].includes(action)) {
            return Response.json(
                { error: 'Valid userId, departmentId, and action ("grant" or "revoke") are required' },
                { status: 400 }
            );
        }

        // Verify the target user is in the org
        const [targetMember] = await db
            .select({ id: orgMembers.id })
            .from(orgMembers)
            .where(and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, sql`${orgId}::uuid`)))
            .limit(1);

        if (!targetMember) {
            return Response.json({ error: 'User is not a member of your organization' }, { status: 404 });
        }

        if (action === 'grant') {
            await db.insert(userDepartmentAccess).values({
                userId,
                departmentId
            }).onConflictDoNothing();
        } else if (action === 'revoke') {
            await db.delete(userDepartmentAccess)
                .where(and(
                    eq(userDepartmentAccess.userId, userId),
                    eq(userDepartmentAccess.departmentId, departmentId)
                ));
        }

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Change access error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message.includes('Forbidden')) {
            return Response.json({ error: error.message }, { status: 403 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
}
