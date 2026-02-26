import { NextRequest } from 'next/server';
import { db } from '@/lib/db/neon';
import { orgMembers, users } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/utils';
import { requireRole, isValidRole, ROLES, type Role } from '@/lib/auth/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/members
 * List all members of the current user's organization (Admin+ only)
 */
export async function GET() {
    try {
        const userId = await getUserId();
        const { orgId } = await requireRole(userId, ROLES.ADMIN);

        const members = await db
            .select({
                id: orgMembers.id,
                userId: orgMembers.userId,
                role: orgMembers.role,
                joinedAt: orgMembers.joinedAt,
                name: users.name,
                email: users.email,
                image: users.image,
            })
            .from(orgMembers)
            .innerJoin(users, sql`${orgMembers.userId}::uuid = ${users.id}`)
            .where(eq(orgMembers.orgId, orgId));

        return Response.json({ members });
    } catch (error: any) {
        console.error('List members error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message.includes('Forbidden')) {
            return Response.json({ error: error.message }, { status: 403 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH /api/organizations/members
 * Change a member's role (Super Admin only)
 * Body: { memberId, newRole }
 */
export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserId();
        const { orgId } = await requireRole(userId, ROLES.SUPER_ADMIN);

        const { memberId, newRole } = await req.json();

        if (!memberId || !newRole) {
            return Response.json(
                { error: 'memberId and newRole are required' },
                { status: 400 }
            );
        }

        if (!isValidRole(newRole)) {
            return Response.json(
                { error: `Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}` },
                { status: 400 }
            );
        }

        // Find the target member
        const [target] = await db
            .select()
            .from(orgMembers)
            .where(
                and(
                    eq(orgMembers.id, memberId),
                    eq(orgMembers.orgId, orgId)
                )
            )
            .limit(1);

        if (!target) {
            return Response.json({ error: 'Member not found' }, { status: 404 });
        }

        // Prevent self-demotion
        if (target.userId === userId) {
            return Response.json(
                { error: 'You cannot change your own role' },
                { status: 400 }
            );
        }

        await db
            .update(orgMembers)
            .set({ role: newRole })
            .where(eq(orgMembers.id, memberId));

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Change role error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message.includes('Forbidden')) {
            return Response.json({ error: error.message }, { status: 403 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/organizations/members
 * Remove a member from the organization (Super Admin only)
 * Body: { memberId }
 */
export async function DELETE(req: NextRequest) {
    try {
        const userId = await getUserId();
        const { orgId } = await requireRole(userId, ROLES.SUPER_ADMIN);

        const { memberId } = await req.json();

        if (!memberId) {
            return Response.json({ error: 'memberId is required' }, { status: 400 });
        }

        // Find the target member
        const [target] = await db
            .select()
            .from(orgMembers)
            .where(
                and(
                    eq(orgMembers.id, memberId),
                    eq(orgMembers.orgId, orgId)
                )
            )
            .limit(1);

        if (!target) {
            return Response.json({ error: 'Member not found' }, { status: 404 });
        }

        // Prevent self-removal
        if (target.userId === userId) {
            return Response.json(
                { error: 'You cannot remove yourself from the organization' },
                { status: 400 }
            );
        }

        await db
            .delete(orgMembers)
            .where(eq(orgMembers.id, memberId));

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Remove member error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message.includes('Forbidden')) {
            return Response.json({ error: error.message }, { status: 403 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
}
