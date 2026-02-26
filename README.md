# Sherlock - AI ChatBot with RAG (SaaS Edition)

A production-ready AI chatbot with Retrieval Augmented Generation (RAG) capabilities, featuring persistent chat history, multi-tenancy, and intelligent question-answering powered by Cerebras Inference.

## ✨ Features

- 📁 **Document Upload**: Powered by Vercel Blob storage with support for PDF, TXT, and DOCX.
- 💬 **Persistent Chat History**: Full conversation threads saved to Neon PostgreSQL.
- 🔍 **RAG Pipeline**: Semantic search using `pgvector` for context-aware answers.
- ⚡ **Ultra-Fast Inference**: Real-time streaming responses from Cerebras Llama 3.1 70B.
- 🔒 **Secure Auth**: Multi-tenant isolation using Neon Auth (Better Auth).
- 🎨 **Modern UI**: Built with Next.js 15, Tailwind CSS, and Shadcn/ui.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **AI Model**: [Cerebras Llama 3.1 8B](https://cerebras.ai/)
- **Database**: [Neon PostgreSQL](https://neon.tech/) (Serverless)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Auth**: [Neon Auth](https://neon.tech/docs/auth/introduction)
- **Storage**: [Vercel Blob](https://vercel.com/storage/blob)
- **Styling**: Tailwind CSS + Shadcn UI

## 🛠️ Configuration

Edit your `.env` file with the following keys:

```env
# Cerebras AI
CEREBRAS_API_KEY=your_key_here

# Neon Database & Auth
DATABASE_URL=your_neon_url_here
BETTER_AUTH_SECRET=your_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_token_here
```

## 🏗️ Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run migrations**:
   ```bash
   npx drizzle-kit push
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## 📖 Usage

1. **Sign Up / Login**: Access the dashboard via the secure auth flow.
2. **Knowledge Base**: Upload documents in the Settings tab to index them for RAG.
3. **Chat**: Start new conversations or resume historical ones via the sidebar.

## 🔑 AI Model Info
The application currently uses `llama3.1-8b` as the primary model. If you have legacy settings pointing to `llama-3.3-70b` or `llama3.1-70b` (now deprecated), the system will automatically upgrade them to the stable `llama3.1-8b` version.

---
Built with ❤️ using Cerebras and Neon.
