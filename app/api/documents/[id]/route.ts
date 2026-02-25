import { NextRequest } from 'next/server';
import { db } from '@/lib/db/neon';
import { documents } from '@/lib/db/schema';
import { deleteDocumentFromVectorStore } from '@/lib/services/vectorStore';
import { del } from '@vercel/blob';
import { eq, and } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/documents/[id]
 * Delete a specific document
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserId();
        const { id } = await params;

        // Get document metadata and verify ownership
        const [doc] = await db
            .select()
            .from(documents)
            .where(and(eq(documents.id, id), eq(documents.userId, userId)))
            .limit(1);

        if (!doc) {
            return Response.json({ error: 'Document not found or unauthorized' }, { status: 404 });
        }

        // Delete from Vercel Blob (if URL exists)
        if (doc.blobUrl) {
            try {
                await del(doc.blobUrl);
            } catch (blobError) {
                console.warn('Could not delete file from Vercel Blob:', blobError);
            }
        }

        // Delete from vector store (embeddings)
        await deleteDocumentFromVectorStore(userId, id);

        // Delete metadata from database
        await db.delete(documents).where(and(eq(documents.id, id), eq(documents.userId, userId)));

        return Response.json({ success: true, message: 'Document deleted' });
    } catch (error: any) {
        console.error('Delete error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
