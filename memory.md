# Sherlock SaaS Transformation Memory

> **Goal**: Migrate the legacy Express/Vite/Supabase boilerplate to a modern Next.js 16 SaaS architecture with organization multi-tenancy, RBAC, Neon DB, Drizzle ORM, Neon Auth, and Vercel Blob.

## Phase 1 & 2: Architectural Planning
- Defined the target features: Landing Page, Authentication, Per-User Tenancy, Chat History, Billing, Usage Metering.
- Mapped out the data model in `lib/db/schema.ts` to include 11 tables representing the entire SaaS state.
- Decided on replacing Supabase (completely) with Neon Serverless Postgres + pgvector for embeddings and Vercel Blob for storage.

## Phase 3: Database & Storage Provisioning
- Established `sherlock` database in Neon (AWS US East 2).
- Enabled `pgvector` extension.
- Successfully pushed the Drizzle schema.

## Phase 4: Foundational Migration (Completed)
1. **Legacy Cleanup**: Deleted Express `server/` and Vite `src/` directories. Removed all `supabase-js` legacy scripts.
2. **Authentication**: Initialized Neon Auth server/client singletons. Built `/auth/login` and `/auth/signup` pages.
3. **API Modernization**: Rewrote `/api/settings`, `/api/usage`, `/api/documents` to Drizzle. Rewrote `vectorStore.ts` to pgvector.
4. **UI**: Created public Landing Page (`/`). Moved Chat UI to `/dashboard`.
5. **Deployment**: Verified build. Deployed to Vercel at `sherlock-app-virid.vercel.app`.

## Phase 5: Per-User Tenancy (Completed)
- Injected `getUserId()` into all API routes. Scoped all DB reads/writes to logged-in user.
- Verified middleware protects private routes. Replaced `TEMP_USER_ID` with dynamic authenticated IDs.

## Phase 6: Chat History & RAG Verification (Completed)
1. **Conversation Persistence**: `conversations` and `messages` tables + REST API + `ConversationSidebar`.
2. **Intelligence Stability**: Resolved Cerebras model deprecations → `llama3.1-8b` default. Auto-upgrade mapper for legacy IDs.
3. **Verified**: Full RAG pipeline (upload → vectorize → search → answer with citations). Live at `sherlock-app-virid.vercel.app`.

## Phase 7: Billing Stub & Context Metering (Planned)
- Not yet implemented.

## Phase 8: Organization Multi-Tenancy (Completed)

### 8.1 Database Schema
- **New tables**: `organizations` (name, org_code, created_by) and `org_members` (org_id, user_id, role, unique constraint)
- **Altered tables**: `org_id` FK added to `documents`, `document_embeddings`, `chatbot_settings`, `usage_logs`
- `conversations`/`messages` remain user-scoped

### 8.2 RBAC
- `lib/auth/rbac.ts`: Roles (`super_admin`, `admin`, `user`), hierarchy, membership lookup, org-code generator
- `lib/auth/utils.ts`: `getUserOrgContext()` → `{ userId, orgId, role }`

### 8.3 Organization API Routes
| Route | Methods | Access |
|-------|---------|--------|
| `/api/organizations` | GET / POST / DELETE | Any / Any / Super Admin |
| `/api/organizations/join` | POST | Any user |
| `/api/organizations/leave` | POST | Normal User / Admin |
| `/api/organizations/members` | GET / PATCH / DELETE | Admin+ / Super Admin / Super Admin |

### 8.4 Migrated Existing Routes
| Route | Change |
|-------|--------|
| `/api/documents` (GET/POST) | Scoped by `orgId`; POST requires Admin+ |
| `/api/documents/[id]` (DELETE) | Requires Admin+, verifies org ownership |
| `/api/settings` (GET/POST) | GET reads org-level; POST requires Super Admin |
| `/api/usage` (GET) | Aggregates by `orgId`; Admin+ sees per-user breakdown |
| `/api/chat` (POST) | RAG search by `orgId`; conversations stay user-scoped |

### 8.5 vectorStore Service
- `addDocumentToVectorStore`, `searchSimilarDocuments`, `deleteDocumentFromVectorStore` accept `scopeId` (orgId or userId)

### 8.6 Data Migration
- `scripts/migrate-orgs.ts`: Idempotent. Created 1 org (code: `33Q2Y2VX`), linked all existing data.

### 8.7 Frontend UI
- `OrgSetup.tsx`: Create/join org flow with org-code copy
- `OrgMembersView.tsx`: Member table, role dropdowns, remove buttons, **Leave Organization** (Normal/Admin), **Destroy Organization** danger zone (Super Admin with typed name confirmation)
- `DocumentsView.tsx`: `canManage` prop — Normal Users see read-only list
- `dashboard/page.tsx`: OrgSetup gate, role-gated tabs (Chat=all, Docs=all, Settings=SuperAdmin, Team=Admin+)
- `page.tsx` (landing): Updated with Team Organizations, Role-Based Access, Team Management features

### 8.8 Org Destroy (Cascade)
- `DELETE /api/organizations`: Deletes Vercel Blob files → embeddings → documents → settings → usage logs → members → org

### 8.9 Middleware Fix
- Updated `middleware.ts` matcher to only protect `/dashboard/:path*` and `/api/((?!auth).*)`. Landing page `/` and `/auth/*` are now public for unauthenticated users.

### 8.10 Password Reset Fix
- `forgot-password/page.tsx`: Changed `authClient.forgetPassword()` (wrong — OTP namespace) to `authClient.requestPasswordReset({ email, redirectTo })`
- `reset-password/page.tsx`: Now passes `token` from callback URL to `authClient.resetPassword({ newPassword, token })`

### 8.11 Build Verification
- `npm run build`: ✅ 0 errors, 15 API routes, 10 pages

---

## Environment Variables
- `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `CEREBRAS_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `VERCEL_OIDC_TOKEN`

## Current Database Tables (13)
`user`, `session`, `account`, `verification`, `user_plans`, `organizations`, `org_members`, `documents`, `document_embeddings`, `chatbot_settings`, `usage_logs`, `conversations`, `messages`

## Next Steps
1. Deploy latest to Vercel
2. E2E testing of all org flows
3. Phase 7: Billing Stub & Context Metering
