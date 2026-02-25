import { NextRequest } from 'next/server';
import { db } from '@/lib/db/neon';
import { documents } from '@/lib/db/schema';
import { processDocument, chunkText } from '@/lib/services/documentProcessor';
import { addDocumentToVectorStore } from '@/lib/services/vectorStore';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { desc, eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/documents
 * List all uploaded documents for the user
 */
export async function GET() {
    try {
        const userId = await getUserId();

        const data = await db
            .select()
            .from(documents)
            .where(eq(documents.userId, userId))
            .orderBy(desc(documents.uploadDate));

        return Response.json({ documents: data });
    } catch (error: any) {
        console.error('Error listing documents:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}

/**
 * POST /api/documents
 * Upload and process a document
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserId();
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return Response.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['.pdf', '.txt', '.docx'];
        const ext = '.' + file.name.toLowerCase().split('.').pop();
        if (!allowedTypes.includes(ext)) {
            return Response.json(
                { error: `File type ${ext} not supported. Allowed: ${allowedTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            return Response.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
        }

        const documentId = uuidv4();
        const filename = file.name;

        console.log(`📄 Processing document: ${filename}`);

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Vercel Blob
        let blobUrl = '';
        try {
            const blob = await put(`documents/${documentId}/${filename}`, buffer, {
                access: 'public',
                contentType: file.type,
            });
            blobUrl = blob.url;
        } catch (blobError) {
            console.warn('Vercel Blob upload failed (BLOB_READ_WRITE_TOKEN may not be set):', blobError);
            // Continue without blob storage — document processing still works
        }

        // Extract text from document
        const text = await processDocument(buffer, filename);

        if (!text || text.length < 10) {
            return Response.json({ error: 'Could not extract text from document' }, { status: 400 });
        }

        // Chunk the text
        const chunks = chunkText(text);

        // Store metadata in Neon via Drizzle
        await db.insert(documents).values({
            id: documentId,
            userId: userId,
            filename,
            blobUrl: blobUrl || null,
            uploadDate: new Date(),
            size: file.size,
            chunks: chunks.length,
            textLength: text.length,
        });

        // Add to vector store (embeddings)
        await addDocumentToVectorStore(userId, documentId, chunks, {
            filename,
            uploadDate: new Date().toISOString(),
            documentId,
            chunkIndex: 0,
            totalChunks: chunks.length,
        });

        return Response.json({
            success: true,
            document: {
                id: documentId,
                filename,
                chunks: chunks.length,
                textLength: text.length,
            },
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
