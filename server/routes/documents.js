import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { processDocument, chunkText } from '../services/documentProcessor.js';
import { addDocumentToVectorStore, deleteDocumentFromVectorStore } from '../services/vectorStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}_${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.txt', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${ext} not supported. Allowed: ${allowedTypes.join(', ')}`));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Store document metadata in memory (in production, use a database)
const documentsDB = new Map();

// Path to persistent storage
const DOCUMENTS_DB_PATH = path.join(__dirname, '..', 'data', 'documentsDB.json');

/**
 * Save documents metadata to disk
 */
async function saveDocumentsDB() {
    try {
        const data = Object.fromEntries(documentsDB);
        await fs.writeFile(DOCUMENTS_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
        console.log('💾 Documents metadata saved to disk');
    } catch (error) {
        console.error('Error saving documents metadata:', error);
    }
}

/**
 * Load documents metadata from disk
 */
async function loadDocumentsDB() {
    try {
        const data = await fs.readFile(DOCUMENTS_DB_PATH, 'utf-8');
        const loaded = JSON.parse(data);

        for (const [key, value] of Object.entries(loaded)) {
            documentsDB.set(key, value);
        }

        console.log(`✅ Loaded ${documentsDB.size} documents from disk`);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📝 No existing documents metadata found, starting fresh');
        } else {
            console.error('Error loading documents metadata:', error);
        }
        return false;
    }
}

// Load existing documents on startup
loadDocumentsDB().catch(console.error);

/**
 * POST /api/documents/upload
 * Upload and process a document
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const documentId = uuidv4();
        const filePath = req.file.path;
        const filename = req.file.originalname;

        console.log(`📄 Processing document: ${filename}`);

        // Extract text from document
        const text = await processDocument(filePath, filename);

        if (!text || text.length < 10) {
            return res.status(400).json({ error: 'Could not extract text from document' });
        }

        // Chunk the text
        const chunks = chunkText(text);

        // Add to vector store
        await addDocumentToVectorStore(documentId, chunks, {
            filename,
            uploadDate: new Date().toISOString()
        });

        // Store metadata
        documentsDB.set(documentId, {
            id: documentId,
            filename,
            filePath,
            uploadDate: new Date().toISOString(),
            size: req.file.size,
            chunks: chunks.length,
            textLength: text.length
        });

        // Save metadata to disk
        await saveDocumentsDB();

        res.json({
            success: true,
            document: {
                id: documentId,
                filename,
                chunks: chunks.length,
                textLength: text.length
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/documents
 * List all uploaded documents
 */
router.get('/', (req, res) => {
    const documents = Array.from(documentsDB.values()).map(doc => ({
        id: doc.id,
        filename: doc.filename,
        uploadDate: doc.uploadDate,
        chunks: doc.chunks,
        textLength: doc.textLength
    }));

    res.json({ documents });
});

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const doc = documentsDB.get(id);

        if (!doc) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete from vector store
        await deleteDocumentFromVectorStore(id);

        // Delete file
        try {
            await fs.unlink(doc.filePath);
        } catch (err) {
            console.warn('Could not delete file:', err);
        }

        // Remove from metadata
        documentsDB.delete(id);

        // Save metadata to disk
        await saveDocumentsDB();

        res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
