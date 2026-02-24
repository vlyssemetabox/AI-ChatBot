# Sherlock — Phase 4.1–4.3 Checkpoint

**Date**: 2026-02-24
**Commit**: Phase 4 Foundation — Legacy cleanup, Neon DB, Neon Auth, Drizzle ORM

---

## What Changed

### 4.1 Legacy Cleanup — Removed
| File / Directory | Reason |
|---|---|
| `server/` | Express backend replaced by Next.js API routes |
| `src/` | Vite React app replaced by Next.js App Router |
| `index.html` | Vite entry point, no longer needed |
| `vite.config.js` | Vite config, no longer needed |
| `supabase-schema*.sql` | Replaced by Drizzle ORM schema |
| `lib/db/supabase.ts` | Replaced by `lib/db/neon.ts` |

### 4.2 New Dependencies
| Package | Purpose |
|---|---|
| `@neondatabase/serverless` | Neon PostgreSQL driver (serverless/edge) |
| `@neondatabase/auth` | Neon Auth (Better Auth) — auth provider |
| `drizzle-orm` | Type-safe ORM for PostgreSQL |
| `zod` | Schema validation |
| `drizzle-kit` (dev) | DB migration & introspection tool |

### 4.3 New Files Created
| File | Purpose |
|---|---|
| `lib/db/neon.ts` | Neon serverless client + Drizzle instance |
| `lib/db/schema.ts` | Full Drizzle schema — 11 tables (4 auth + 7 app) |
| `lib/auth/server.ts` | Neon Auth server instance |
| `lib/auth/client.ts` | Neon Auth client instance |
| `app/api/auth/[...all]/route.ts` | Auth API handler |
| `drizzle.config.ts` | Drizzle Kit config |
| `.env.example` | Updated env template |

### Database Tables (Neon)
- **Auth (Neon Auth managed)**: `user`, `session`, `account`, `verification`
- **App (Drizzle managed)**: `documents`, `document_embeddings` (pgvector), `chatbot_settings`, `usage_logs`, `conversations`, `messages`, `user_plans`

### Infrastructure
- Neon project: `sherlock` (ID: `late-smoke-56809746`, region: `aws-us-east-2`)
- pgvector extension: enabled
- Drizzle schema: pushed to Neon

---

## Remaining for Phase 4
- [ ] Enable Neon Auth in dashboard → get `NEON_AUTH_BASE_URL`
- [ ] Create Vercel Blob store `sherlock-storage` → get `BLOB_READ_WRITE_TOKEN`
- [ ] Auth pages (login, signup)
- [ ] Landing page + dashboard migration
- [ ] Route protection middleware
