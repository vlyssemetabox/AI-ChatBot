import { db } from '@/lib/db/neon';
import { organizations, orgMembers, documents, documentEmbeddings, chatbotSettings, usageLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/utils';
import { getUserOrgMembership, generateOrgCode, ROLES } from '@/lib/auth/rbac';
import { del } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations
 * Get the current user's organization details + their role
 */
export async function GET() {
    try {
        const userId = await getUserId();
        const membership = await getUserOrgMembership(userId);

        if (!membership) {
            return Response.json({ organization: null, role: null });
        }

        const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, membership.orgId))
            .limit(1);

        return Response.json({
            organization: org,
            role: membership.role,
        });
    } catch (error: any) {
        console.error('Get org error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/organizations
 * Create a new organization. The creator becomes Super Admin.
 */
export async function POST(req: Request) {
    try {
        const userId = await getUserId();

        // Check if user already belongs to an org
        const existing = await getUserOrgMembership(userId);
        if (existing) {
            return Response.json(
                { error: 'You already belong to an organization' },
                { status: 400 }
            );
        }

        const { name } = await req.json();
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return Response.json(
                { error: 'Organization name must be at least 2 characters' },
                { status: 400 }
            );
        }

        const orgCode = generateOrgCode();

        const [org] = await db
            .insert(organizations)
            .values({
                name: name.trim(),
                orgCode,
                createdBy: userId,
            })
            .returning();

        // Add creator as super_admin
        await db.insert(orgMembers).values({
            orgId: org.id,
            userId,
            role: ROLES.SUPER_ADMIN,
        });

        return Response.json({ organization: org, role: ROLES.SUPER_ADMIN });
    } catch (error: any) {
        console.error('Create org error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/organizations
 * Destroy the organization and all its data. Super Admin only.
 * Cascade: blob files → embeddings → documents → settings → usage → members → org
 */
export async function DELETE() {
    try {
        const userId = await getUserId();
        const membership = await getUserOrgMembership(userId);

        if (!membership) {
            return Response.json({ error: 'Not in an organization' }, { status: 400 });
        }

        if (membership.role !== ROLES.SUPER_ADMIN) {
            return Response.json({ error: 'Only Super Admins can destroy an organization' }, { status: 403 });
        }

        const orgId = membership.orgId;

        // 1. Fetch all org documents to delete their blob files
        const orgDocs = await db
            .select({ id: documents.id, blobUrl: documents.blobUrl })
            .from(documents)
            .where(eq(documents.orgId, orgId));

        // 2. Delete blob files (best-effort, don't fail if blob is missing)
        for (const doc of orgDocs) {
            if (doc.blobUrl) {
                try {
                    await del(doc.blobUrl);
                } catch (e) {
                    console.warn(`Failed to delete blob for doc ${doc.id}:`, e);
                }
            }
        }

        // 3. Delete embeddings
        await db.delete(documentEmbeddings).where(eq(documentEmbeddings.orgId, orgId));

        // 4. Delete documents
        await db.delete(documents).where(eq(documents.orgId, orgId));

        // 5. Delete chatbot settings
        await db.delete(chatbotSettings).where(eq(chatbotSettings.orgId, orgId));

        // 6. Delete usage logs
        await db.delete(usageLogs).where(eq(usageLogs.orgId, orgId));

        // 7. Delete all org members
        await db.delete(orgMembers).where(eq(orgMembers.orgId, orgId));

        // 8. Delete the organization itself
        await db.delete(organizations).where(eq(organizations.id, orgId));

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Destroy org error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
}
