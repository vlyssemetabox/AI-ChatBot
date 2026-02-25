# Sherlock SaaS Transformation Memory

> **Goal**: Migrate the legacy Express/Vite/Supabase boilerplate to a modern Next.js 16 SaaS architecture with per-user tenancy, Neon DB, Drizzle ORM, Neon Auth, and Vercel Blob.

## Phase 1 & 2: Architectural Planning
- Defined the target features: Landing Page, Authentication, Per-User Tenancy, Chat History, Billing, Usage Metering.
- Mapped out the data model in `lib/db/schema.ts` to include 11 tables representing the entire SaaS state.
- Decided on replacing Supabase (completely) with Neon Serverless Postgres + pgvector for embeddings and Vercel Blob for storage.

## Phase 3: Database & Storage Provisioning
- Established `sherlock` database in Neon (AWS US East 2).
- Enabled `pgvector` extension.
- Successfully pushed the Drizzle schema.

## Phase 4: Foundational Migration (Completed)
1. **Legacy Cleanup**:
   - Deleted the Express `server/` and Vite `src/` directories.
   - Removed all `supabase-js` legacy scripts and clients.
2. **Authentication Interface**:
   - Initialized Neon Auth server/client singletons.
   - Implemented `neonAuthMiddleware` for route protection.
   - Built modern `/auth/login` and `/auth/signup` pages.
3. **API Modernization**:
   - **`/api/settings`**: Rewritten to Drizzle.
   - **`/api/usage`**: Rewritten to Drizzle.
   - **`/api/documents`**: Rewritten to Drizzle (metadata) + `@vercel/blob` (storage).
   - **`vectorStore.ts`**: Rewritten to Drizzle (pgvector queries).
4. **UI Refactoring**:
   - Created public Landing Page (`/`).
   - Moved internal Chat UI to `/dashboard`.
5. **Deployment**:
   - Verified the unified Next.js 16 build (`npm run build`).
   - Fixed route handler type mismatch for Neon Auth catch-all route (`[...path]`).
   - Pushed environment variables and deployed live to Vercel at `sherlock-app-virid.vercel.app`.
   - Linked to Vercel Blob storage (`sherlock-store`).

## Next: Phase 5 - Per-User Tenancy
The immediate next phase is to inject the actual authenticated `user.id` into all API routes and services.
Currently, Drizzle queries use a `TEMP_USER_ID` ('anonymous') placeholder because we migrated the routes before the frontend auth was fully verified.
Now that users can sign up and log in, we need to enforce that every database read/write is strictly scoped to the logged-in user to prevent data leaks.
