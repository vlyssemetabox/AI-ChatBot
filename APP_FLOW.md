# Application Architecture & High-Level Flow (Zoho AI Assistant)

This document outlines how the application works, its tech stack, and the high-level data flows following the Phase 8.5 SaaS transformation.

## 🛠️ Core Technology Stack

- **Frontend & API**: Next.js 15+ (App Router, React server components)
- **Database**: Neon Serverless PostgreSQL with `pgvector`
- **ORM**: Drizzle ORM
- **Authentication**: Neon Auth (Powered by Better Auth)
- **File Storage**: Vercel Blob
- **AI / LLM Inference**: Cerebras API (using fast models like Llama 3.1 8B)
- **Styling**: Tailwind CSS + Shadcn UI

---

## 🔀 High-Level Flows

### 1. Authentication & Middleware Flow
1. User arrives at the public landing page (`/`).
2. They navigate to `/auth/signup` or `/auth/login`.
3. neonauth handles the authentication session, dropping secure cookies.
4. Next.js **Middleware** intercepts requests. If the user tries to access `/dashboard` or `/api/*` (except auth routes) without a valid session cookie, they are redirected back to `/auth/login`.
5. Authenticated users are mapped against the `neon_auth.user` table. 

### 2. Organization Multi-Tenancy Flow (RBAC)
1. Every newly registered user must either **Create** or **Join** an Organization before accessing the chatbot.
2. Organizations have strict `orgId` isolation. All uploaded documents, AI settings, chat history, and vector embeddings belong strictly to an Organization, not an individual.
3. **Roles**:
   - **Super Admin**: The creator. Can destroy the entire organization (cascading delete of all files/embeddings), assign roles, and remove members.
   - **Admin**: Can upload documents, configure AI guardrails/branding, and view members.
   - **User**: Can purely interact with the Chatbot using the Organization's knowledge base.
4. If a user leaves or the org is destroyed, all associated DB records and Vercel Blob files are cleanly swept away.

### 3. Document Ingestion & RAG Flow (Retrieval-Augmented Generation)
1. **Upload**: An Admin uploads a document (PDF, DOCX, TXT, XLSX).
2. **Storage**: The raw file is securely uploaded to **Vercel Blob** storage.
3. **Processing**: The Next.js API route downloads the Blob, extracts the raw text using specialized parsers (`pdf-parse`, `mammoth`, `xlsx`), and splits the text into semantic chunks.
4. **Embedding**: The chunks are converted into mathematical vectors (384 dimensions) and saved to the Postgres `document_embeddings` table utilizing the `pgvector` extension.
5. **Tracking**: The document metadata is saved locally to the `documents` table, permanently linked to the `orgId`.

### 4. Chatbot Inference Flow
1. **Query**: The user types a question in the chat UI.
2. **Retrieval**: The system generates an embedding for the user's question and performs a **Cosine Similarity** search against the `document_embeddings` table to find the most relevant chunks of text belonging to their specific `orgId`.
3. **Guardrails Check**: The system loads the Organization's custom Settings (Competitor blocklists, custom System Prompts, fallback messages).
4. **Generation**: The retrieved context and guardrails are injected into a prompt and sent to the **Cerebras AI API**.
5. **Streaming**: The response is streamed back to the frontend chunk-by-chunk using Server-Sent Events (SSE) for a fast, real-time typing effect.

### 5. Settings, Metering & Branding Flow
- **Settings**: Admins can customize the Assistant on the `/dashboard` (Custom logos, Name, FAQs, Llama model selection, and blocked competitor lists). 
- **Storage**: Logos can be uploaded or imported via URL, stored in Vercel Blob, and saved as a setting in the `chatbot_settings` table.
- **Usage Metering**: Every token processed by the LLM securely logs to the `usage_logs` table, offering a daily overview (Tokens & Requests) to prevent abuse and track API limits.
