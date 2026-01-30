import pdf from 'pdf-parse-fork';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

/**
 * Extract text from a PDF file
 */
async function extractTextFromPDF(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
}

/**
 * Extract text from a DOCX file
 */
async function extractTextFromDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
}

/**
 * Extract text from a TXT file
 */
async function extractTextFromTXT(filePath) {
    return await fs.readFile(filePath, 'utf-8');
}

/**
 * Process a document and extract text based on file type
 */
export async function processDocument(filePath, filename) {
    const ext = path.extname(filename).toLowerCase();

    let text = '';

    try {
        switch (ext) {
            case '.pdf':
                text = await extractTextFromPDF(filePath);
                break;
            case '.docx':
                text = await extractTextFromDOCX(filePath);
                break;
            case '.txt':
                text = await extractTextFromTXT(filePath);
                break;
            default:
                throw new Error(`Unsupported file type: ${ext}`);
        }

        // Clean up the text
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    } catch (error) {
        console.error(`Error processing document ${filename}:`, error);
        throw error;
    }
}

/**
 * Split text into chunks with overlap
 */
export function chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end);
        chunks.push(chunk);

        // Move start position with overlap
        start = end - overlap;

        // Prevent infinite loop if chunk is too small
        if (start >= text.length - overlap) break;
    }

    return chunks;
}
