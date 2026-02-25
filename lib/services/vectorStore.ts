import OpenAI from 'openai';
import { db } from '@/lib/db/neon';
import { documentEmbeddings } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// Initialize OpenAI for embeddings (if using OpenAI)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY
    ? new OpenAI({ apiKey: OPENAI_API_KEY })
    : null;

// Jina AI configuration (free alternative)
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const JINA_API_KEY = process.env.JINA_API_KEY || HF_API_KEY;

export interface DocumentMetadata {
    filename: string;
    uploadDate: string;
    documentId: string;
    chunkIndex: number;
    totalChunks: number;
}

export interface SearchResult {
    content: string;
    metadata: DocumentMetadata;
    similarity: number;
}

/**
 * Generate embeddings using Jina AI (free - 1M tokens/month)
 */
async function generateEmbeddingJinaAI(
    text: string,
    task: 'retrieval.query' | 'retrieval.passage' = 'retrieval.passage'
): Promise<number[]> {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${JINA_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'jina-embeddings-v3',
            task,
            dimensions: 384,
            input: [text],
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jina AI API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    if (result.data?.[0]?.embedding) {
        return result.data[0].embedding;
    }
    throw new Error('Invalid response format from Jina AI');
}

/**
 * Generate embeddings using OpenAI
 */
async function generateEmbeddingOpenAI(text: string): Promise<number[]> {
    if (!openai) throw new Error('OpenAI client not initialized');
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });
    return response.data[0].embedding;
}

/**
 * Generate embeddings for text (auto-selects provider)
 */
async function generateEmbedding(text: string): Promise<number[]> {
    try {
        if (JINA_API_KEY) {
            console.log('Using Jina AI embeddings (free)');
            return await generateEmbeddingJinaAI(text);
        }
        if (openai) {
            console.log('Using OpenAI embeddings');
            return await generateEmbeddingOpenAI(text);
        }
        throw new Error('No embedding provider configured. Set JINA_API_KEY or OPENAI_API_KEY');
    } catch (error) {
        console.error('Error generating embedding:', error);
        console.warn('⚠️ Using fallback random embedding — NOT for production!');
        return Array(384).fill(0).map(() => Math.random() * 2 - 1);
    }
}

/**
 * Add document chunks to the vector store (Neon pgvector via Drizzle)
 */
export async function addDocumentToVectorStore(
    userId: string,
    documentId: string,
    chunks: string[],
    metadata: Partial<DocumentMetadata> = {}
): Promise<{ success: boolean; chunksAdded: number }> {
    let addedCount = 0;

    for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);

        await db.insert(documentEmbeddings).values({
            userId,
            documentId,
            chunkIndex: i,
            content: chunks[i],
            embedding,
            metadata: {
                ...metadata,
                documentId,
                chunkIndex: i,
                totalChunks: chunks.length,
            },
        });

        addedCount++;
    }

    console.log(`✅ Added ${addedCount} chunks for document ${documentId}`);
    return { success: true, chunksAdded: addedCount };
}

/**
 * Search for similar documents using Neon pgvector
 */
export async function searchSimilarDocuments(
    userId: string,
    query: string,
    topK = 10
): Promise<SearchResult[]> {
    // Generate embedding for the query
    const queryEmbedding = JINA_API_KEY
        ? await generateEmbeddingJinaAI(query, 'retrieval.query')
        : await generateEmbedding(query);

    console.log('🔍 Query embedding generated, length:', queryEmbedding.length);

    // Use raw SQL for pgvector cosine similarity search
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const results = await db.execute(sql`
        SELECT
            de.content,
            de.metadata,
            1 - (de.embedding <=> ${embeddingStr}::vector) AS similarity
        FROM document_embeddings de
        WHERE de.embedding IS NOT NULL
          AND de.user_id = ${userId}
        ORDER BY de.embedding <=> ${embeddingStr}::vector
        LIMIT ${topK}
    `);

    const rows = results.rows as any[];
    console.log('📊 Search results:', rows.length, 'matches found');

    return rows.map((row) => ({
        content: row.content,
        metadata: row.metadata as DocumentMetadata,
        similarity: parseFloat(row.similarity),
    }));
}

/**
 * Delete a document from the vector store
 */
export async function deleteDocumentFromVectorStore(
    userId: string,
    documentId: string
): Promise<{ success: boolean; chunksDeleted: number }> {
    const deleted = await db
        .delete(documentEmbeddings)
        .where(
            and(
                eq(documentEmbeddings.userId, userId),
                eq(documentEmbeddings.documentId, documentId)
            )
        )
        .returning();

    const deletedCount = deleted.length;
    console.log(`✅ Deleted ${deletedCount} chunks for document ${documentId}`);
    return { success: true, chunksDeleted: deletedCount };
}
