# AI ChatBot Development Context

## Project Overview

**Project Name**: Zoho AI Assistant (formerly AI ChatBot)  
**Type**: RAG (Retrieval-Augmented Generation) Chatbot  
**Tech Stack**: React (Vite) + Express.js + Cerebras AI API  
**Purpose**: Document-based Q&A system with persistent storage and network access

---

## Session Timeline

### Session 1: Document Persistence Implementation
**Date**: 2026-01-30 (Morning)  
**Objective**: Implement persistent storage for uploaded documents and vector embeddings

#### Problem
- Documents and vector embeddings were lost on server restart
- Only in-memory storage was used
- Physical files remained in `./uploads` but metadata and embeddings were lost

#### Solution Implemented
1. **Created data directory**: `./server/data/`
2. **Document metadata persistence**:
   - File: `documentsDB.json`
   - Functions: `saveDocumentsDB()`, `loadDocumentsDB()`
   - Auto-save on upload/delete
   - Auto-load on server startup
3. **Vector store persistence**:
   - File: `vectorStore.json`
   - Functions: `saveVectorStore()`, `loadVectorStore()`
   - Auto-save after add/delete operations
   - Auto-load on initialization

#### Files Modified
- `server/services/vectorStore.js` - Added persistence functions
- `server/routes/documents.js` - Added metadata persistence
- `server/index.js` - Ensured data directory creation

#### Testing Results
- ✅ Documents persist across server restarts
- ✅ Vector embeddings maintained
- ✅ RAG functionality continues working after restart
- ✅ Tested with `test_document.txt` containing secret code "BANANA123"

---

### Session 2: UI Redesign
**Date**: 2026-01-30 (Afternoon)  
**Objective**: Rebrand and redesign UI with professional appearance

#### Requirements
1. Change logo to "Zoho AI Assistant"
2. Implement ChatGPT-style black/white color scheme
3. Replace all emoji icons with professional icons
4. Make Chat the default page and first navigation item

#### Implementation

##### 1. Icon Library
- Installed **Lucide React** (`npm install lucide-react`)
- Professional, consistent icon set
- 1000+ icons available

##### 2. Branding Changes
- Logo: "🤖 AI ChatBot" → "Zoho AI Assistant"
- Updated in `App.jsx`

##### 3. Color Scheme Overhaul
**Before**: Purple/blue gradient theme  
**After**: ChatGPT-style black/white/green

```css
--primary: hsl(142, 71%, 45%);      /* Green accent */
--bg-primary: hsl(0, 0%, 13%);      /* Dark background */
--text-primary: hsl(0, 0%, 95%);    /* White text */
```

- Removed animated gradient backgrounds
- Simplified shadows
- Clean, minimal aesthetic

##### 4. Icon Replacements

| Component | Old Emoji | New Icon |
|-----------|-----------|----------|
| Chat Nav | 💬 | `<MessageSquare />` |
| Documents Nav | 📁 | `<FileText />` |
| AI Assistant | 🤖 | `<Bot />` |
| User Avatar | 👤 | `<User />` |
| Send Button | 📤 | `<Send />` |
| Clear Chat | 🗑️ | `<Trash2 />` |
| Sources | 📚 | `<BookOpen />` |
| Library | 📚 | `<Library />` |
| Upload | 📤 | `<Upload />` |
| Delete | 🗑️ | `<Trash2 />` |
| Error | ⚠️ | `<AlertTriangle />` |
| Loading | (spinner) | `<Loader2 />` |

##### 5. Navigation Changes
- **Default view**: Changed from Documents to Chat
- **Navigation order**: Chat first, Documents second
- Both buttons display professional icons

#### Files Modified
- `src/App.jsx` - Branding, icons, navigation order
- `src/index.css` - Color scheme, removed gradients
- `src/components/ChatInterface.jsx` - Icon replacements
- `src/components/DocumentUpload.jsx` - Icon replacements
- `vite.config.js` - (later for network access)

#### User Modifications
User made additional CSS improvements:
- Added flexbox styling to navigation buttons
- Removed redundant header in ChatInterface

#### Verification
- ✅ "Zoho AI Assistant" displayed in header
- ✅ Chat loads as default page
- ✅ Professional Lucide icons throughout
- ✅ Black/white/green color scheme
- ✅ No emojis remaining

---

### Session 3: AI Guardrails Implementation
**Date**: 2026-01-30 (Afternoon)  
**Objective**: Prevent AI from providing competitor information

#### Problem
When asked about competitors (e.g., Odoo, Salesforce), the AI was providing general knowledge:

**Example**:
- User: "What is Odoo?"
- AI: "Odoo is an open-source suite of business applications including sales, CRM, project management..." ❌

#### Desired Behavior
- User: "What is Odoo?"
- AI: "I don't have information about that in my knowledge base. However, I'd be happy to help you with questions about Zoho products and services! What would you like to know about Zoho?" ✅

#### Implementation

##### System Prompt Guardrails
Updated `server/routes/chat.js` with strict instructions:

**Absolute Prohibitions**:
1. DO NOT provide ANY information about competitors
2. DO NOT use general knowledge or training data
3. DO NOT create "Alternative Answers"
4. DO NOT discuss competitor features
5. DO NOT list Zoho features when asked about competitors

**Required Redirect Message**:
```
"I don't have information about that in my knowledge base. However, 
I'd be happy to help you with questions about Zoho products and 
services! What would you like to know about Zoho?"
```

**Competitor List**:
- Odoo, Salesforce, HubSpot, Microsoft Dynamics, SAP, Oracle, NetSuite, Freshworks, Monday.com

##### Response Rules
- **Documents have relevant info** → Answer with sources
- **Asked about competitors** → Use EXACT redirect message
- **Asked about non-document topics** → Redirect to Zoho
- **NEVER** use general knowledge

#### Testing
**Before Implementation**:
- ❌ Provided competitor information
- ❌ Used general knowledge

**After Implementation**:
- ✅ Refuses to provide competitor information
- ✅ Redirects to Zoho with friendly message
- ✅ Still answers Zoho questions normally with sources

#### Iterations
1. **First attempt**: AI still provided some Zoho features alongside redirect
2. **Second attempt**: Strengthened prompt with explicit "EXACT message ONLY"
3. **Final version**: Working correctly after server restart

---

### Session 4: Network Access Configuration
**Date**: 2026-01-30 (Evening)  
**Objective**: Make chatbot accessible on local network

#### Requirements
- Allow access from other devices on the same Wi-Fi network
- Keep running on host machine
- No cloud deployment needed

#### Implementation

##### 1. Discovered Local IP
```
IPv4 Address: 192.168.68.60
```

##### 2. Backend Configuration
**File**: `server/index.js`

```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.68.60:${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
});
```

- Changed from `localhost` to `0.0.0.0` (all network interfaces)
- Now accepts connections from any device on network

##### 3. Frontend Configuration
**File**: `vite.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow access from network
    port: 5173,
  }
})
```

##### 4. Environment Variables
**File**: `.env.local`

```
VITE_API_URL=http://192.168.68.60:3001/api
```

Updated components to use environment variable:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

#### Access URLs
- **From host machine**: http://localhost:5173
- **From network devices**: http://192.168.68.60:5173
- **Backend API**: http://192.168.68.60:3001

#### Firewall Configuration
Ports to allow: **5173** (frontend), **3001** (backend)

PowerShell commands:
```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Express API Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

#### Files Modified
- `server/index.js` - Listen on 0.0.0.0
- `vite.config.js` - Network access configuration
- `.env.local` - Network API URL
- `src/components/ChatInterface.jsx` - Environment variable support
- `src/components/DocumentUpload.jsx` - Environment variable support

---

## Project Architecture

### Frontend (React + Vite)
```
src/
├── App.jsx                    # Main app, navigation, branding
├── index.css                  # Global styles, color scheme
├── components/
│   ├── ChatInterface.jsx      # Chat UI, streaming responses
│   ├── ChatInterface.css      # Chat styling
│   ├── DocumentUpload.jsx     # Document upload/management
│   └── DocumentUpload.css     # Upload styling
└── main.jsx                   # Entry point
```

### Backend (Express.js)
```
server/
├── index.js                   # Server setup, CORS, routes
├── routes/
│   ├── chat.js               # Chat endpoint, RAG, guardrails
│   └── documents.js          # Upload, list, delete documents
├── services/
│   ├── cerebrasClient.js     # AI API integration
│   ├── documentProcessor.js  # Text extraction, chunking
│   └── vectorStore.js        # Embeddings, similarity search
└── data/                     # Persistent storage
    ├── documentsDB.json      # Document metadata
    └── vectorStore.json      # Vector embeddings
```

### Data Flow

#### Document Upload
1. User uploads file → `DocumentUpload.jsx`
2. POST to `/api/documents/upload` → `documents.js`
3. Extract text → `documentProcessor.js`
4. Chunk text (500 chars, 50 overlap)
5. Generate embeddings → `vectorStore.js`
6. Save metadata → `documentsDB.json`
7. Save embeddings → `vectorStore.json`

#### Chat Query
1. User sends message → `ChatInterface.jsx`
2. POST to `/api/chat` → `chat.js`
3. Generate query embedding → `vectorStore.js`
4. Search similar documents (cosine similarity)
5. Build context from top 10 results
6. Send to Cerebras AI with system prompt (guardrails)
7. Stream response back to frontend
8. Display with markdown formatting + sources

---

## Key Features

### 1. RAG (Retrieval-Augmented Generation)
- Vector similarity search
- Top-10 document retrieval
- Source citation
- Cosine similarity scoring

### 2. Document Persistence
- JSON-based storage
- Auto-save on changes
- Auto-load on startup
- Survives server restarts

### 3. AI Guardrails
- Competitor information blocking
- Document-only responses
- Friendly redirects to Zoho
- No general knowledge usage

### 4. Network Access
- Local network availability
- Multi-device support
- Firewall configuration
- Environment-based URLs

### 5. Professional UI
- ChatGPT-style design
- Lucide React icons
- Black/white/green theme
- Responsive layout

---

## Environment Variables

### Backend (.env)
```
PORT=3001
UPLOAD_DIR=./uploads
CEREBRAS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here  # Fallback
```

### Frontend (.env.local)
```
VITE_API_URL=http://192.168.68.60:3001/api
```

---

## API Endpoints

### Documents
- `GET /api/documents` - List all documents
- `POST /api/documents/upload` - Upload document
- `DELETE /api/documents/:id` - Delete document

### Chat
- `POST /api/chat` - Send message, get streaming response
  - Body: `{ message: string, conversationHistory: array }`
  - Response: Server-Sent Events (SSE) stream

### Health
- `GET /api/health` - Server health check

---

## Dependencies

### Frontend
- `react` - UI framework
- `react-markdown` - Markdown rendering
- `lucide-react` - Icon library
- `vite` - Build tool

### Backend
- `express` - Web framework
- `cors` - Cross-origin support
- `multer` - File upload handling
- `pdf-parse` - PDF text extraction
- `mammoth` - DOCX text extraction
- `dotenv` - Environment variables
- `uuid` - Unique ID generation

### AI/ML
- Cerebras API (primary)
- OpenAI API (fallback)
- Custom vector store (in-memory + JSON persistence)

---

## Known Issues & Limitations

### 1. API Key Authentication
- Current: Using Cerebras API key as fallback
- Issue: `AuthenticationError: 401 Incorrect API key provided`
- Workaround: Random embeddings for testing
- Solution: Obtain valid API key for production

### 2. Vector Store
- Current: In-memory with JSON persistence
- Limitation: Not scalable for large datasets
- Recommendation: Use Pinecone, Weaviate, or Supabase Vector for production

### 3. File Storage
- Current: Local filesystem
- Limitation: Won't work on serverless platforms (Vercel)
- Recommendation: Use cloud storage (S3, Cloudinary, Vercel Blob) for deployment

### 4. Security
- ⚠️ No authentication
- ⚠️ No HTTPS
- ⚠️ No rate limiting
- ⚠️ Anyone on network can access
- Recommendation: Add auth, SSL, and access controls for production

### 5. Guardrails
- Current: Prompt-based only
- Limitation: LLM may occasionally bypass
- Recommendation: Add server-side filtering as backup

---

## Testing History

### Persistence Testing
- ✅ Upload document
- ✅ Verify in UI
- ✅ Check JSON files created
- ✅ Restart server
- ✅ Verify document still listed
- ✅ Verify RAG still works
- ✅ Retrieved "BANANA123" from persisted document

### UI Testing
- ✅ Verified "Zoho AI Assistant" branding
- ✅ Confirmed Chat as default page
- ✅ Checked all icons are Lucide (no emojis)
- ✅ Verified black/white/green color scheme
- ✅ Tested navigation switching
- ✅ Confirmed responsive design

### Guardrails Testing
- ✅ Asked "What is Odoo?" - Got redirect ✅
- ✅ Asked "Tell me about Salesforce" - Got redirect ✅
- ✅ Asked "What is Zoho Books?" - Got answer with sources ✅
- ✅ Verified no competitor information provided

### Network Access Testing
- ⏳ Pending user testing from other devices
- Configuration completed, awaiting firewall setup

---

## Deployment Considerations

### Current Setup (Development)
- Running on `localhost` and `192.168.68.60`
- Suitable for local network use
- No cloud hosting

### For Production Deployment

#### Option 1: Split Deployment
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Backend**: Railway, Render, Fly.io, or AWS
- **Storage**: AWS S3 or Cloudinary
- **Database**: MongoDB Atlas or Supabase
- **Vector DB**: Pinecone or Weaviate

#### Option 2: Full Stack Platform
- **Railway**: Easiest, supports file storage
- **Render**: Free tier available
- **DigitalOcean**: More control
- **AWS/GCP**: Enterprise-grade

#### Required Changes for Cloud
1. Replace JSON files with database
2. Replace local uploads with cloud storage
3. Replace in-memory vectors with vector database
4. Add authentication
5. Add HTTPS/SSL
6. Add rate limiting
7. Environment variable management

---

## Future Enhancements

### Suggested Improvements
1. **Authentication**: User login system
2. **Multi-tenancy**: Separate document spaces per user
3. **Advanced RAG**: Hybrid search, reranking
4. **Document types**: Support more formats (Excel, PowerPoint)
5. **Chat history**: Persist conversations
6. **Export**: Download chat transcripts
7. **Analytics**: Usage tracking, popular queries
8. **Admin panel**: Manage users, documents, settings
9. **API rate limiting**: Prevent abuse
10. **Caching**: Reduce API calls

### Performance Optimizations
1. Implement caching for embeddings
2. Add pagination for document lists
3. Optimize chunk size and overlap
4. Implement lazy loading for chat history
5. Add compression for API responses

---

## Artifacts Created

1. **task.md** - Task checklist for UI redesign
2. **implementation_plan.md** - UI redesign implementation plan
3. **walkthrough.md** - Documentation of completed work
4. **network_access_guide.md** - Network configuration guide
5. **context.md** - This file (conversation summary)

---

## Commands Reference

### Development
```bash
# Install dependencies
npm install

# Run development (both frontend and backend)
npm run dev:all

# Run frontend only
npm run dev

# Run backend only
npm run server
```

### Network Access
```bash
# Find local IP
ipconfig | findstr /i "IPv4"

# Configure firewall (PowerShell as Admin)
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Express API Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### Production (with PM2)
```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start npm --name "zoho-ai-assistant" -- run dev:all

# View logs
pm2 logs

# Stop app
pm2 stop zoho-ai-assistant
```

---

## Conversation Summary

This context document captures the complete development journey of the Zoho AI Assistant, from implementing document persistence to configuring network access. The project evolved through four main phases:

1. **Persistence** - Ensuring data survives server restarts
2. **UI Redesign** - Professional branding and modern design
3. **Guardrails** - Preventing competitor information leakage
4. **Network Access** - Enabling multi-device access on local network

The chatbot is now a fully functional, professionally designed RAG system with persistent storage, strict content guardrails, and network accessibility, ready for use within a trusted local network environment.

---

**Last Updated**: 2026-01-30 21:45:00 +04:00  
**Status**: Development Complete, Ready for Network Testing  
**Next Steps**: Restart server, configure firewall, test from network devices

---

## Phase 5 Update: Full SaaS Transformation (Next.js, Neon, Vercel)
**Date**: 2026-02-25  
**Objective**: Transform the local AI Chatbot (Vite/Express) into a production-ready Next.js SaaS app with proper security, authentication, and database.

### 1. New Technology Stack
- **Frontend/Backend**: Next.js 16 (App Router) replacing Vite and Express
- **Database**: Neon PostgreSQL serverless database (replacing local JSON)
- **ORM**: Drizzle ORM replacing raw SQL and queries
- **Authentication**: Neon Auth (Powered by Better Auth)
- **Storage**: Vercel Blob (replacing local filesystem for Document uploads)
- **Styling**: Tailwind CSS + Shadcn/ui

### 2. Authentication & Data Isolation Implementation
- Integrated **Neon Auth** with `/auth/login`, `/auth/signup`, `/auth/forgot-password`, and `/auth/reset-password` routes.
- Implemented **custom error mapping** for `INVALID_EMAIL_OR_PASSWORD` and duplicate emails in the registration flow.
- Configured **Next.js Middleware** for protecting private routes like `/dashboard`.
- Implemented **Data Isolation/Tenancy**: 
  - All DB tables strictly require a `user_id`.
  - Fetch queries in `/api/documents`, `/api/chat`, `/api/settings`, and `/api/usage` use `getUserId()` to enforce data boundaries.
  - Vercel Blob uploads persist the URL into the Neon Drizzle schema with the correct user ID.

### 3. Architecture Adjustments
- Fixed Drizzle ORM foreign key limitations against Neon Auth's internal `.users` table by selectively dropping strict hard constraints using a custom `.env` initialized script (`drop-fks.ts`).
- Added robust error handling and UI fallback rendering (e.g. mapping `null` or `undefined` text_length metrics to 0 in Document View).
- Completely removed legacy Express server backend directory and routing logic.

---

## Phase 9 Update: Multi-Department Tenancy & Strict Data Isolation
**Date**: 2026-03-03
**Objective**: Re-architecture from a 1-to-1 organization structure to a multi-department model where a user strictly interacts only with documents explicitly assigned to them via department classifications.

### 1. Data Models & Access Schema
- Added new `departments` table referencing an `orgId`.
- Added a `user_department_access` junction table to map `userId`s securely to zero, one, or multiple `departmentId`s.
- `documents` and `document_embeddings` now contain `departmentId` to forcibly partition the text corpus strictly by department space.

### 2. UI Updates
- **Documents Dashboard**: Now groups all loaded documents into a nested "Tabs" interface based individually on their departments. 
- **Upload Dialogue**: Dragging files or manually uploading now directly pulls up a modal asking the specific user which `Department` namespace they are directly assigning the document and vector mappings to.
- **OrgMembers Dashboard**: Now lists explicit department associations per user and grants Super Admins explicit dropdown menus to map/unmap users to compartments. A separate "Departments" tab allows Admins + Super Admins to perform Create, Read, Update, Delete on compartments.

### 3. Vector Isolation (Scoped RAG)
- `lib/services/vectorStore.ts` now wraps search pipelines in `inArray(documentEmbeddings.departmentId, authorizedDepartmentIds)` checks dynamically querying out of bounds data to guarantee zero namespace overlaps for chatbot prompts.
- User chats explicitly evaluate against subset collections.

### 4. Remaining Tasks
- **Phase 6**: Chat History & Conversation UI (saving the actual dialogue messages to the Drizzle database schemas).
---

## Session 10: Billing, Metering & UI Stability
**Date**: 2026-03-03 (Afternoon)
**Objective**: Implement organization-centric billing, quota enforcement, and resolve critical UUID type mismatches.

#### 1. Billing & Metering
- **Schema**: Introduced `orgSubscriptions` to track plans at the organization level.
- **Enforcement**: Implemented real-time token tracking in `/api/chat`. Free organizations are capped at 50,000 monthly tokens.
- **UI**: Built a premium Billing dashboard in `SettingsView.tsx` with HSL-based progress bars and a mock checkout flow.

#### 2. Type Safety & Compatibility
- **Problem**: Encountered `operator does not exist: text = uuid` errors in the Usage and Billing APIs due to Drizzle/Postgres type inference issues.
- **Fix**: Standardized all GUID comparisons using explicit `CAST(col AS TEXT)` to guarantee compatibility across varied database environments.

#### 3. Dark Mode Refinement
- **Fix**: Resolved an issue where `--input-background` was not redefined for dark mode, causing white inputs with white text in the auth forms.
- **Implementation**: Standardized on CSS variables using `oklch` tokens in `globals.css`.

#### Files Modified
- `app/api/billing/route.ts` - Usage aggregation
- `app/api/billing/checkout/route.ts` - Plan upgrades
- `app/api/usage/route.ts` - Per-user telemetry
- `app/api/chat/route.ts` - Quota enforcement
- `app/globals.css` - Dark mode tokens
- `components/ui/input.tsx` - Component standardization

#### Verification
- ✅ `npm run build` passed (12+ static routes, 20+ dynamic APIs).
- ✅ Mock upgrade flow verified with state persistence.
- ✅ Dark mode inputs now have high-contrast visibility.
- ✅ UUID errors eliminated via explicit casting.
