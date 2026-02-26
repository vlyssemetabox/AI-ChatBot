# Checkpoint: Phase 8.5 Complete — Org Lifecycle & Public Landing Page

Sherlock is a fully functional multi-tenant SaaS with organization lifecycle management, RBAC, and a public landing page.

### Build Status
- ✅ `npm run build` — **0 errors**, 15 API routes, 10 pages
- ✅ Phases 1–6 and 8 complete
- ✅ Phase 8.5: Org quit/destroy + middleware fix + password reset fix

### What Was Built in Phase 8.5

**Middleware Fix**
- Updated `middleware.ts` matcher: only `/dashboard/:path*` and `/api/((?!auth).*)` are protected
- Landing page `/` and `/auth/*` are now publicly accessible without login

**Org Leave** — `POST /api/organizations/leave`
- Normal Users and Admins can leave their organization
- Super Admins blocked (must use destroy instead)
- UI: "Leave Organization" button in Team tab with confirmation dialog

**Org Destroy** — `DELETE /api/organizations`
- Super Admin only — cascade deletes all org data:
  1. Vercel Blob files for each document
  2. `document_embeddings` → `documents` → `chatbot_settings` → `usage_logs` → `org_members` → `organizations`
- UI: Red "Danger Zone" card requiring typed org name to confirm

**Password Reset Fix**
- `forgot-password`: Changed from `authClient.forgetPassword()` → `authClient.requestPasswordReset()`
- `reset-password`: Now passes URL `token` to `authClient.resetPassword({ newPassword, token })`

### Access Control Matrix
| Feature | Normal User | Admin | Super Admin |
|---------|-------------|-------|-------------|
| Chat | ✅ | ✅ | ✅ |
| View documents | ✅ | ✅ | ✅ |
| Upload/delete docs | ❌ | ✅ | ✅ |
| View team members | ❌ | ✅ | ✅ |
| Change roles | ❌ | ❌ | ✅ |
| Remove members | ❌ | ❌ | ✅ |
| Edit settings | ❌ | ❌ | ✅ |
| Leave org | ✅ | ✅ | ❌ |
| Destroy org | ❌ | ❌ | ✅ |

### API Routes (15)
```
/api/auth/[...path]        — Neon Auth handler
/api/chat                  — RAG chat (orgId-scoped search)
/api/conversations         — List/create conversations
/api/conversations/[id]    — Get/delete conversation
/api/conversations/[id]/messages — Get messages
/api/documents             — GET (org-scoped) / POST (Admin+)
/api/documents/[id]        — DELETE (Admin+)
/api/organizations         — GET/POST/DELETE (create/get/destroy)
/api/organizations/join    — POST (join via code)
/api/organizations/leave   — POST (quit org)
/api/organizations/members — GET/PATCH/DELETE (manage members)
/api/settings              — GET (all) / POST (Super Admin)
/api/usage                 — GET (org-scoped stats)
/api/utils/fetch-image     — Image proxy for branding
```

### Key File Structure
```
middleware.ts               — Route protection (dashboard + API only)
lib/auth/rbac.ts            — RBAC roles, hierarchy, membership lookup
lib/auth/utils.ts           — getUserId(), getUserOrgContext()
lib/db/schema.ts            — Drizzle ORM schema (13 tables)
lib/services/vectorStore.ts — RAG embeddings (org-scoped)
components/OrgSetup.tsx     — Create/join organization
components/OrgMembersView.tsx — Members + Leave + Destroy
components/DocumentsView.tsx — Document library (canManage prop)
app/page.tsx                — Public landing page
app/dashboard/page.tsx      — Role-gated dashboard
```

### Next Steps
1. Deploy to Vercel
2. E2E test all org flows
3. Phase 7: Billing Stub & Context Metering
