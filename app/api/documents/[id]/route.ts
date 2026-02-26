import { NextRequest } from 'next/server';
import { db } from '@/lib/db/neon';
import { documents } from '@/lib/db/schema';
import { deleteDocumentFromVectorStore } from '@/lib/services/vectorStore';
import { del } from '@vercel/blob';
import { eq, and } from 'drizzle-orm';
import { getUserOrgContext } from '@/lib/auth/utils';
import { requireRole, ROLES } from '@/lib/auth/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/documents/[id]
 * Delete a specific document (Admin+ only, org-scoped)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await getUserOrgContext();
        const { id } = await params;

        if (!orgId) {
            return Response.json({ error: 'No organization found' }, { status: 403 });
        }

        // Require Admin+ role for deletions
        await requireRole(userId, ROLES.ADMIN);

        // Get document metadata and verify org ownership
        const [doc] = await db
            .select()
            .from(documents)
            .where(and(eq(documents.id, id), eq(documents.orgId, orgId)))
            .limit(1);

        if (!doc) {
            return Response.json({ error: 'Document not found' }, { status: 404 });
        }

        // Delete from Vercel Blob (if URL exists)
        if (doc.blobUrl) {
            try {
                await del(doc.blobUrl);
            } catch (blobError) {
                console.warn('Could not delete file from Vercel Blob:', blobError);
            }
        }

        // Delete from vector store (embeddings) — now org-scoped
        await deleteDocumentFromVectorStore(orgId, id);

        // Delete metadata from database
        await db.delete(documents).where(and(eq(documents.id, id), eq(documents.orgId, orgId)));

        return Response.json({ success: true, message: 'Document deleted' });
    } catch (error: any) {
        console.error('Delete error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message.includes('Forbidden')) {
            return Response.json({ error: error.message }, { status: 403 });
        }
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
