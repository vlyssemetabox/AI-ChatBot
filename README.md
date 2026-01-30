# 🤖 AI ChatBot with RAG

A powerful AI chatbot with Retrieval Augmented Generation (RAG) capabilities, featuring document ingestion and intelligent question-answering powered by Cerebras API.

## ✨ Features

- 📁 **Document Upload**: Drag-and-drop support for PDF, TXT, and DOCX files
- 🔍 **RAG Pipeline**: Intelligent document retrieval using ChromaDB vector store
- 💬 **Streaming Chat**: Real-time responses from Cerebras LLM (ultra-fast inference)
- 📚 **Source Citations**: Automatic citation of document sources in responses
- 🎨 **Premium UI**: Modern glassmorphism design with dark mode
- ⚡ **Fast Processing**: Document chunking and embedding generation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Cerebras API key (free tier available at [cerebras.ai](https://cerebras.ai))
- Optional: OpenAI API key for embeddings (can use Cerebras key as fallback)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd "c:\dev\AI ChatBot"
   ```

2. **Install dependencies** (already done if you followed setup)
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Edit the `.env` file and add your API keys:
   ```env
   CEREBRAS_API_KEY=your_cerebras_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here  # Optional, for embeddings
   PORT=3001
   UPLOAD_DIR=./uploads
   CHROMA_PATH=./chroma_db
   ```

### Running the Application

**Start both frontend and backend:**
```bash
npm run dev:all
```

This will start:
- Frontend (Vite): http://localhost:5173
- Backend (Express): http://localhost:3001

**Or run separately:**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

## 📖 Usage

1. **Upload Documents**
   - Navigate to the "Documents" tab
   - Drag and drop files or click to browse
   - Supported formats: PDF, TXT, DOCX (max 10MB)
   - Documents are automatically processed and indexed

2. **Chat with AI**
   - Switch to the "Chat" tab
   - Ask questions about your uploaded documents
   - The AI will retrieve relevant information and cite sources
   - Responses stream in real-time

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
Backend API (Express)
    ↓
├── Document Processor (PDF/DOCX/TXT extraction)
├── Vector Store (ChromaDB + OpenAI embeddings)
└── LLM Client (Cerebras API)
```

### Tech Stack

- **Frontend**: React, Vite, CSS (Glassmorphism)
- **Backend**: Node.js, Express
- **Vector DB**: ChromaDB (local)
- **LLM**: Cerebras API (Llama 3.3 70B)
- **Embeddings**: OpenAI text-embedding-3-small
- **Document Processing**: pdf-parse, mammoth

## 📁 Project Structure

```
AI ChatBot/
├── src/                      # Frontend source
│   ├── components/
│   │   ├── DocumentUpload.jsx
│   │   ├── DocumentUpload.css
│   │   ├── ChatInterface.jsx
│   │   └── ChatInterface.css
│   ├── App.jsx
│   └── index.css
├── server/                   # Backend source
│   ├── routes/
│   │   ├── documents.js      # Upload/delete endpoints
│   │   └── chat.js           # Chat endpoint
│   ├── services/
│   │   ├── cerebrasClient.js # LLM integration
│   │   ├── vectorStore.js    # ChromaDB integration
│   │   └── documentProcessor.js
│   └── index.js              # Express server
├── uploads/                  # Uploaded documents
├── chroma_db/               # Vector database
├── .env                     # Environment variables
└── package.json
```

## 🔑 API Endpoints

### Documents
- `POST /api/documents/upload` - Upload a document
- `GET /api/documents` - List all documents
- `DELETE /api/documents/:id` - Delete a document

### Chat
- `POST /api/chat` - Send a chat message (streaming response)

## 🎨 UI Features

- **Glassmorphism Design**: Modern frosted glass effect
- **Dark Mode**: Eye-friendly dark theme
- **Smooth Animations**: Micro-interactions and transitions
- **Responsive Layout**: Works on desktop and mobile
- **Drag & Drop**: Intuitive file upload
- **Real-time Streaming**: See responses as they're generated

## 🔧 Configuration

### Embedding Model
By default, the app uses OpenAI's `text-embedding-3-small` model. To use a different embedding provider, modify `server/services/vectorStore.js`.

### LLM Model
The app uses Cerebras' `llama-3.3-70b` model. To change models, edit `server/services/cerebrasClient.js`.

### Chunk Size
Document chunking is set to 1000 characters with 200 character overlap. Adjust in `server/services/documentProcessor.js`.

## 🐛 Troubleshooting

**ChromaDB Connection Issues:**
- Ensure ChromaDB is properly installed: `npm install chromadb`
- Check that the `CHROMA_PATH` directory is writable

**API Key Errors:**
- Verify your Cerebras API key is correct in `.env`
- Check that the `.env` file is in the project root

**File Upload Fails:**
- Check file size (max 10MB)
- Ensure file format is supported (PDF, TXT, DOCX)
- Verify the `UPLOAD_DIR` exists and is writable

## 📝 License

MIT License - feel free to use this project for your own purposes!

## 🙏 Acknowledgments

- Cerebras for ultra-fast LLM inference
- ChromaDB for vector storage
- OpenAI for embedding models
