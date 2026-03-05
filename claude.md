# Claude Memory & Full Project Context

## Document Overview
This document contains the entire memory of the AI-ChatBot project (also known as Zoho AI Assistant). It explains the codebase architecture, the historical context, the database schema, and the most recent changes made in the current session. Another AI can read this file to perfectly recover the context of the workflow.

---

## 🏗️ Codebase Explanation & Architecture
The project is a multi-tenant, department-isolated B2B SaaS application. It functions as a Retrieval-Augmented Generation (RAG) AI Chatbot that interacts securely with documents uploaded to compartmentalized org workspaces.

**Core Tech Stack:**
- **Framework**: Next.js 15+ (App Router, React Server Components)
- **Database**: Neon Serverless PostgreSQL with `pgvector`
- **ORM**: Drizzle ORM (`lib/db/schema.ts`)
- **Authentication**: Neon Auth powered by Better Auth (`middleware.ts`)
- **Storage**: Vercel Blob (for raw document uploads like PDF, DOCX, TXT, XLSX)
- **AI Inference**: Cerebras API (using fast LLM models like Llama 3.1 8B)
- **Analytics & Errors**: PostHog (telemetry) & Sentry (error tracking) - *added in this session*
- **Styling**: Tailwind CSS & Shadcn UI

**High-Level Flows:**
1. **Authentication**: Handled via Neon Auth. Next.js middleware rigidly protects `/dashboard` and `/api/*` routes.
2. **Multi-Department Tenancy (Strict Data Isolation)**:
   - Users belong to an `Organization`.
   - Organizations have `Departments`.
   - Users are explicitly mapped to specific departments via `user_department_access`.
   - Vector searches are strictly scoped using `inArray(documentEmbeddings.departmentId, authorizedDepartmentIds)` to ensure RAG context never leaks across unpermitted departments or orgs.
3. **Usage Metering & Billing**: Org-centric billing via `orgSubscriptions`. Free orgs are capped at 50,000 text tokens (metered via `usageLogs`).
4. **Document RAG Pipeline**: Uploaded docs are stored in Vercel Blob, parsed, text chunked, and vectorized (384 dimensions) into the `document_embeddings` Postgres table. When a user asks a query, the backend executes a Cosine Similarity search, applying guardrails and injecting context into a Cerebras LLM prompt. Results stream back to the UI via Server-Sent Events (SSE).

---

## 🗄️ Database Schema Insights (`lib/db/schema.ts`)
The entire schema architecture is governed by Drizzle. Key tables include:
- **Auth**: `users`, `sessions`, `accounts` (Managed internally by Neon Auth).
- **Tenancy**: `organizations`, `org_members` (Users can be Super Admin, Admin, or User).
- **Access Control**: `departments`, `user_department_access` (Junction tables mapping subsets of users to document vaults).
- **RAG Corpus**: `documents`, `document_embeddings` (Stores files and their respective pgvector embeddings tied to orgs and departments).
- **Settings & Metering**: `chatbot_settings` (Custom branding, blocklists), `usageLogs` (Token tracking), `orgSubscriptions` (Billing plans).
- **Chat History**: `conversations`, `messages` (Retains the historical chat dialogue).

---

## 📜 Full Historical Context & Phased Evolution
1. **Phases 1-4**: Started as a local Express/Vite app using JSON files. Added UI branding (Lucide icons), local network configurations, and implemented prompt guardrails (strictly blocking AI info on competitors like Salesforce or HubSpot).
2. **Phase 5**: Major SaaS Transformation. Ripped out Express/Vite for Next.js 16 (App Router). Migrated JSON to Neon Postgres + Drizzle ORM.
3. **Phase 9**: Transitioned from a flat 1-to-1 org structure to Multi-Department Tenancy. Built a UI for OrgMembers to map users to compartments, enforcing explicitly scoped vector queries.
4. **Phase 10**: Added Org Billing, Free vs Pro limits, fixed dark mode UI bugs, and resolved UUID type casting errors in Drizzle.

---

## 🚀 The Current Session: Sentry & PostHog Integration
In the most recent discussion session, we focused on adding world-class telemetry and error reporting to the SaaS platform.

We successfully completed the following:
1. **Installed Dependencies**: Extracted an obsolete setup and successfully `npm install @sentry/nextjs posthog-js`.
2. **Sentry Error Tracking (v10)**:
   - Configured `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`.
   - Updated `next.config.ts` using `withSentryConfig` to facilitate sourcemap uploads and automatic Vercel cron monitoring.
   - Cleared up v10 deprecation warnings (removed legacy attributes like `hideSourceMaps` which failed the initial build).
3. **PostHog Analytics**:
   - Created `components/posthog-provider.tsx` to initialize PostHog globally.
   - Tied `PostHogProvider` into the root Next.js `app/layout.tsx` file for universal client telemetry.
4. **Environment Variables Configured**: added the required blanks to both `.env.example` and `.env`:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
   - `NEXT_PUBLIC_POSTHOG_KEY`
   - `NEXT_PUBLIC_POSTHOG_HOST`
5. **Verified & Pushed**: We ran `npm run build` which passed without errors or type faults. We committed the code with `"feat: add PostHog and Sentry integration"` and pushed it to `origin/master`.

---

## 🤖 Instructions for the Next AI Context 
If you are picking up work from here, keep the following rules intact:
1. **Never Break Data Isolation**: All API calls fetching settings, performing AI RAG vectors, or generating chat texts MUST query against `orgId`. Department checks must utilize `user_department_access` arrays to ensure users don't see privileged docs.
2. **Styling Standards**: Rely entirely on Tailwind CSS tokens and Shadcn variables (using `oklch`). Do not introduce external styling libraries.
3. **Next Steps**: The user simply needs to paste their API credentials into their local `.env.local` to light up PostHog and Sentry. You may be asked to start adding AI chat history or additional SaaS routing features. Continue using `drizzle-kit` strictly for schema migrations.
