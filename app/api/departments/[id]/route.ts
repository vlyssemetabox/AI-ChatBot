import { NextRequest } from 'next/server';
import { db } from '@/lib/db/neon';
import { departments, userDepartmentAccess, documents, documentEmbeddings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserOrgContext } from '@/lib/auth/utils';
import { requireRole, ROLES } from '@/lib/auth/rbac';
import { del } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // In Next.js App Router, params is a Promise
) {
    try {
        const { userId, orgId } = await getUserOrgContext();

        if (!orgId) {
            return Response.json({ error: 'You must belong to an organization' }, { status: 403 });
        }

        // Admins and Super Admins can delete departments
        await requireRole(userId, ROLES.ADMIN);

        // Await the params Promise
        const resolvedParams = await params;
        const departmentId = resolvedParams.id;

        if (!departmentId) {
            return Response.json({ error: 'Department ID is required' }, { status: 400 });
        }

        // Check if department exists and belongs to the org
        const [dept] = await db
            .select({ id: departments.id })
            .from(departments)
            .where(and(eq(departments.id, departmentId), eq(departments.orgId, orgId)))
            .limit(1);

        if (!dept) {
            return Response.json({ error: 'Department not found' }, { status: 404 });
        }

        // 1. Fetch all documents mapped to this department to delete blob files
        const deptDocs = await db
            .select({ id: documents.id, blobUrl: documents.blobUrl })
            .from(documents)
            .where(eq(documents.departmentId, departmentId));

        // 2. Delete blob files best-effort
        for (const doc of deptDocs) {
            if (doc.blobUrl) {
                try {
                    await del(doc.blobUrl);
                } catch (e) {
                    console.warn(`Failed to delete blob for doc ${doc.id}:`, e);
                }
            }
        }

        // 3. Delete from DB (documentEmbeddings and userDepartmentAccess cascade from departments delete theoretically, 
        //   but let's be explicit just in case `onDelete: 'cascade'` isn't fully supported by Neon serverless driver sometimes).
        await db.delete(documentEmbeddings).where(eq(documentEmbeddings.departmentId, departmentId));
        await db.delete(documents).where(eq(documents.departmentId, departmentId));
        await db.delete(userDepartmentAccess).where(eq(userDepartmentAccess.departmentId, departmentId));

        // 4. Finally delete the department
        await db.delete(departments).where(eq(departments.id, departmentId));

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting department:', error);
        if (error.message.includes('Forbidden')) {
            return Response.json({ error: error.message }, { status: 403 });
        }
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await getUserOrgContext();

        if (!orgId) {
            return Response.json({ error: 'You must belong to an organization' }, { status: 403 });
        }

        // Admins and Super Admins can update departments
        await requireRole(userId, ROLES.ADMIN);

        const resolvedParams = await params;
        const departmentId = resolvedParams.id;

        if (!departmentId) {
            return Response.json({ error: 'Department ID is required' }, { status: 400 });
        }

        const { name } = await req.json();

        if (!name || name.trim().length < 2) {
            return Response.json({ error: 'Department name is required (min 2 chars)' }, { status: 400 });
        }

        // Check if department exists and belongs to the org
        const [dept] = await db
            .select({ id: departments.id })
            .from(departments)
            .where(and(eq(departments.id, departmentId), eq(departments.orgId, orgId)))
            .limit(1);

        if (!dept) {
            return Response.json({ error: 'Department not found' }, { status: 404 });
        }

        // Update the department
        await db.update(departments)
            .set({ name: name.trim() })
            .where(eq(departments.id, departmentId));

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Error updating department:', error);
        if (error.message.includes('Forbidden')) {
            return Response.json({ error: error.message }, { status: 403 });
        }
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}

