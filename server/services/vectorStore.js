import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI for embeddings
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.CEREBRAS_API_KEY
});

// In-memory vector store
const vectorStore = {
    documents: [],
    embeddings: [],
    metadatas: []
};

// Path to persistent storage
const VECTOR_STORE_PATH = path.join(__dirname, '..', 'data', 'vectorStore.json');

/**
 * Save vector store to disk
 */
async function saveVectorStore() {
    try {
        const data = JSON.stringify(vectorStore, null, 2);
        await fs.writeFile(VECTOR_STORE_PATH, data, 'utf-8');
        console.log('💾 Vector store saved to disk');
    } catch (error) {
        console.error('Error saving vector store:', error);
    }
}

/**
 * Load vector store from disk
 */
async function loadVectorStore() {
    try {
        const data = await fs.readFile(VECTOR_STORE_PATH, 'utf-8');
        const loaded = JSON.parse(data);

        vectorStore.documents = loaded.documents || [];
        vectorStore.embeddings = loaded.embeddings || [];
        vectorStore.metadatas = loaded.metadatas || [];

        console.log(`✅ Loaded ${vectorStore.documents.length} document chunks from disk`);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📝 No existing vector store found, starting fresh');
        } else {
            console.error('Error loading vector store:', error);
        }
        return false;
    }
}

/**
 * Initialize the vector store
 */
export async function initializeVectorStore() {
    await loadVectorStore();
    console.log('✅ Vector store initialized');
    return true;
}

/**
 * Generate embeddings for text using OpenAI
 */
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        // Fallback: return a random embedding for testing
        console.warn('Using fallback random embedding');
        return Array(1536).fill(0).map(() => Math.random());
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Add document chunks to the vector store
 */
export async function addDocumentToVectorStore(documentId, chunks, metadata = {}) {
    try {
        let addedCount = 0;

        // Generate embeddings for each chunk
        for (let i = 0; i < chunks.length; i++) {
            const chunkId = `${documentId}_chunk_${i}`;
            const embedding = await generateEmbedding(chunks[i]);

            vectorStore.documents.push({
                id: chunkId,
                content: chunks[i]
            });

            vectorStore.embeddings.push(embedding);

            vectorStore.metadatas.push({
                ...metadata,
                documentId,
                chunkIndex: i,
                totalChunks: chunks.length
            });

            addedCount++;
        }

        console.log(`✅ Added ${addedCount} chunks for document ${documentId}`);

        // Save to disk
        await saveVectorStore();

        return { success: true, chunksAdded: addedCount };
    } catch (error) {
        console.error('Error adding document to vector store:', error);
        throw error;
    }
}

/**
 * Search for similar documents
 */
export async function searchSimilarDocuments(query, topK = 3) {
    try {
        if (vectorStore.documents.length === 0) {
            return [];
        }

        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query);

        // Calculate similarities
        const similarities = vectorStore.embeddings.map((embedding, index) => ({
            index,
            similarity: cosineSimilarity(queryEmbedding, embedding)
        }));

        // Sort by similarity (descending)
        similarities.sort((a, b) => b.similarity - a.similarity);

        // Get top K results
        const topResults = similarities.slice(0, topK);

        // Format results
        const formattedResults = topResults.map(result => ({
            content: vectorStore.documents[result.index].content,
            metadata: vectorStore.metadatas[result.index],
            distance: 1 - result.similarity // Convert similarity to distance
        }));

        return formattedResults;
    } catch (error) {
        console.error('Error searching documents:', error);
        throw error;
    }
}

/**
 * Delete a document from the vector store
 */
export async function deleteDocumentFromVectorStore(documentId) {
    try {
        let deletedCount = 0;

        // Find and remove all chunks for this document
        for (let i = vectorStore.documents.length - 1; i >= 0; i--) {
            if (vectorStore.metadatas[i].documentId === documentId) {
                vectorStore.documents.splice(i, 1);
                vectorStore.embeddings.splice(i, 1);
                vectorStore.metadatas.splice(i, 1);
                deletedCount++;
            }
        }

        console.log(`✅ Deleted ${deletedCount} chunks for document ${documentId}`);

        // Save to disk
        await saveVectorStore();

        return { success: true, chunksDeleted: deletedCount };
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
}

// Initialize on module load
initializeVectorStore().catch(console.error);
