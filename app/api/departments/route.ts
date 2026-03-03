import { NextRequest } from 'next/server';
import { db } from '@/lib/db/neon';
import { departments, userDepartmentAccess } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getUserOrgContext } from '@/lib/auth/utils';
import { requireRole, ROLES, getUserAuthorizedDepartments } from '@/lib/auth/rbac';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/departments
 * List all departments in the organization.
 */
export async function GET(req: NextRequest) {
    try {
        const { userId, orgId } = await getUserOrgContext();

        if (!orgId) {
            return Response.json({ departments: [] });
        }

        const searchParams = req.nextUrl.searchParams;
        const mineOnly = searchParams.get('mine') === 'true';

        let data;
        if (mineOnly) {
            const authorizedDepts = await getUserAuthorizedDepartments(userId, orgId);
            if (authorizedDepts.length === 0) {
                return Response.json({ departments: [] });
            }
            data = await db
                .select()
                .from(departments)
                .where(and(
                    eq(departments.orgId, orgId),
                    inArray(departments.id, authorizedDepts)
                ));
        } else {
            data = await db
                .select()
                .from(departments)
                .where(eq(departments.orgId, orgId));
        }

        return Response.json({ departments: data });
    } catch (error: any) {
        console.error('Error listing departments:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}

/**
 * POST /api/departments
 * Create a new department (Super Admin only).
 */
export async function POST(req: NextRequest) {
    try {
        const { userId, orgId } = await getUserOrgContext();

        if (!orgId) {
            return Response.json({ error: 'You must belong to an organization' }, { status: 403 });
        }

        // Admins and Super Admins can create departments
        await requireRole(userId, ROLES.ADMIN);

        const { name, icon } = await req.json();

        if (!name || name.trim().length < 2) {
            return Response.json({ error: 'Department name is required (min 2 chars)' }, { status: 400 });
        }

        const newDeptId = uuidv4();

        // Check if name exists
        const existing = await db
            .select({ id: departments.id })
            .from(departments)
            .where(and(eq(departments.orgId, orgId), eq(departments.name, name.trim())))
            .limit(1);

        if (existing.length > 0) {
            return Response.json({ error: 'A department with this name already exists' }, { status: 400 });
        }

        const [newDept] = await db.insert(departments).values({
            id: newDeptId,
            orgId,
            name: name.trim(),
            icon: icon || 'folder',
        }).returning();

        // Also explicitly grant the Super Admin access in the junction table?
        // Super Admins technically bypass the mapping via getUserAuthorizedDepartments logic,
        // but for robustness or if they get demoted, it's safer to map them.
        await db.insert(userDepartmentAccess).values({
            userId,
            departmentId: newDept.id,
        }).onConflictDoNothing();

        return Response.json({ success: true, department: newDept });
    } catch (error: any) {
        console.error('Error creating department:', error);
        if (error.message.includes('Forbidden')) {
            return Response.json({ error: error.message }, { status: 403 });
        }
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
