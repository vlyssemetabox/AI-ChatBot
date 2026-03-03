# Department Document Classifications — Phased Implementation Plan

## Architecture Pivot Summary
The current system utilizes a flat **Organization → Member** hierarchy and restricts RAG filtering by `org_id` exclusively. 
This plan outlines an architectural pivot toward **Many-to-Many Department Document Classifications**. 

**Core Rules:**
* Departments act as logical silos for uploaded documents.
* A User can have access to 1-to-N Departments via a junction table.
* A Super Admin has total access; Admins can grant/revoke Document Access for users.
* All Vector `searchSimilarDocuments` queries are fortified securely with `inArray()` filters scoped solely to the specific User's authorized departments.

---

## Breaking Changes

> [!CAUTION]
> The following breaking changes will occur across the codebase due to the shift to a many-to-many relationship:

| Area | Impact |
|---|---|
| **Data Model** | Introduction of `departments` and a junction table `user_department_access`. Replaces the idea of a simple 1-to-1 `department_id` on `org_members`. |
| **`documents` & `document_embeddings`** | New `department_id` column on each. Existing documents and embeddings must be backfilled to a default department. |
| **[vectorStore.ts]** | `searchSimilarDocuments()` must accept an array of `department_ids` and use an `inArray` query instead of matching a single `org_id`. |
| **[rbac.ts]** | New utilities needed to fetch an array of authorized `departmentIds` for the current user. |
| **Org / Member Joins** | The onboarding flow MUST auto-assign a user to a default Department to ensure they have access to at least some document scope right away. |
| **Middleware & API routes** | API routes dealing with documents or chats must validate that the User's requested `departmentId` exists within their allowed `user_department_access` mapping. |

---

## Phase 1 — Schema & Relationships

**Goal:** Introduce the `departments` table, the `user_department_access` junction table, modify document tables to belong to departments, and run migrations.

### Tasks
1. **Create `departments` table** in `schema.ts`:
   - Columns: `id` (uuid PK), `org_id` (FK → organizations), `name` (text), `icon` (text), `created_at`, `updated_at`.
   - Unique index on `(org_id, name)` to prevent duplicate names within an org.
2. **Create `user_department_access` table** in `schema.ts` (Junction Table):
   - Columns: `id` (uuid PK), `user_id` (FK → neon_auth.user.id), `department_id` (FK → departments).
   - Unique constraint on `(user_id, department_id)`.
3. **Add `department_id` column** to `documents` and `document_embeddings` tables:
   - FK linking strictly to `departments.id`.
4. **Define Drizzle relations** for the new tables and mapping in `schema.ts`.
5. **Run `drizzle-kit push`** to apply schema changes to Neon.

---

## Phase 2 — RBAC Matrix & Access Helpers

**Goal:** Update the RBAC engine to fetch and enforce the array of authorized departments for any given user session.

### Tasks
1. **Create `getUserAuthorizedDepartments(userId, orgId)`** in `rbac.ts`:
   - If `Super Admin`, return all `department_id`s in the organization.
   - If `Admin` or `User`, select `department_id` from `user_department_access` where `user_id = userId`.
   - Returns a string array `[deptId1, deptId2, ...]`.
2. **Create `requireDepartmentAccess(userId, targetDeptId)` guard**:
   - Ensures the requested `targetDeptId` exists inside the `getUserAuthorizedDepartments` result.
   - Throws `403 Forbidden` if access is denied.
3. **Refactor Route Middleware/Guards**:
   - Apply guards onto server API handlers dealing with document uploads or chat contexts so that Users/Admins cannot query classifications they are locked out of.

---

## Phase 3 — RAG Pipeline & Scoped Retrieval

**Goal:** Modify document ingestion to forcefully assign departments, and update the vector search logic to use the new `IN` clause filtering format.

### Tasks
1. **Refactor `POST /api/documents`**:
   - Must require a `departmentId` in the request body.
   - Validates that the Caller uploading the document has explicit access to that `departmentId`.
   - Inserts the `departmentId` into both the `documents` and `document_embeddings` records.
2. **Update `lib/services/vectorStore.ts`**:
   - Modify `searchSimilarDocuments(query, orgId, allowedDepartmentIds[])`.
   - Apply a dynamic `inArray(document_embeddings.departmentId, allowedDepartmentIds)` clause instead of just `eq(orgId)`.
3. **Refactor `POST /api/chat`**:
   - Request body accepts an optional `departmentId` (or array of ids).
   - If User selects "Global / All Authorized", query the array returned by `getUserAuthorizedDepartments`.
   - If User selects a specific subset in the UI, validate those subset IDs against their authorized targets, then pass ONLY those to the vector search.

---

## Phase 4 — UI: Super Admin Setup & Access Dashboards

**Goal:** Build out the Admin / Super Admin UI capabilities for configuring Departments, and allocating members to them securely.

### Tasks
1. **Update `OrgSetup.tsx` (First Department Flow)**:
   - Super Admin flow: After Org creation, prompt them to create the "First Department" (name & icon). This acts as the Organization's default onboarding scope.
2. **Update Onboarding Defaults (`/api/organizations/join`)**:
   - When a new user joins, query the oldest/first Department in that Org, and automatically insert a row in `user_department_access` so they aren't completely blank upon joining.
3. **New API `POST/GET/DELETE /api/departments`**:
   - Super Admin and Admin: Full CRUD for Organization departments.
4. **New API `POST /api/members/access`**:
   - Admins/Super Admins can toggle access mappings in `user_department_access` for any given User.
5. **New UI Component: Access Management Dashboard**:
   - Build a specialized tab allowing Admins to see a list of Users and toggle switches for which Departments they are allowed to read/query.

---

## Phase 5 — UI: End-User Classifications & Chat UI

**Goal:** Expose the Department Classification filter to end-users so they can pick which knowledge bases to query against contextually.

### Tasks
1. **Add Department Context Dropdown in `ChatView.tsx`**:
   - Fetch the active user's authorized departments via API.
   - Add a dropdown at the top of the chat area: "Target Scope: [All Authorized] | [Dept A] | [Dept B]".
   - Pass this state variable payload explicitly into the `POST /api/chat` endpoint logic dynamically.
2. **Department Filter in `DocumentsView.tsx`**:
   - Build a dropdown allowing Admins to sort viewed documents strictly by the department they are assigned to.
3. **End-to-End Verification**:
   - Run rigorous tests: User A has access to HR. User B has access to Engineering. User A's vector search MUST NOT ever return chunks belonging to Engineering. 
   - Ensure the Super Admin toggle flow propagates to the database `user_department_access` efficiently.
