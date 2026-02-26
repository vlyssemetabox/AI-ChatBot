import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    jsonb,
    vector,
    index,
    varchar,
    uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// Auth tables — managed by Neon Auth (Better Auth)
// These are created automatically by Neon Auth. We define them
// here for Drizzle relations and type-safe queries only.
// Do NOT push these via drizzle-kit — they already exist.
// ============================================================

export const users = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: timestamp('email_verified'),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('session', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable('account', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    expiresAt: timestamp('expires_at'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verifications = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================
// Application tables — managed by us via Drizzle
// ============================================================

// Organizations
export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    orgCode: varchar('org_code', { length: 12 }).notNull().unique(),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization members (junction table with role)
export const orgMembers = pgTable(
    'org_members',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        userId: text('user_id').notNull(),
        role: varchar('role', { length: 20 }).notNull().default('user'), // 'super_admin' | 'admin' | 'user'
        joinedAt: timestamp('joined_at').defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex('idx_org_members_unique').on(table.orgId, table.userId),
        index('idx_org_members_user').on(table.userId),
    ]
);

// Documents uploaded by users
export const documents = pgTable(
    'documents',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: text('user_id').notNull(),
        orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
        filename: text('filename').notNull(),
        blobUrl: text('blob_url'),
        uploadDate: timestamp('upload_date').defaultNow().notNull(),
        size: integer('size').default(0),
        chunks: integer('chunks').default(0),
        textLength: integer('text_length').default(0),
    },
    (table) => [index('idx_documents_org').on(table.orgId)]
);

// Document embeddings for vector search
export const documentEmbeddings = pgTable(
    'document_embeddings',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: text('user_id').notNull(),
        orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
        documentId: uuid('document_id')
            .notNull()
            .references(() => documents.id, { onDelete: 'cascade' }),
        chunkIndex: integer('chunk_index').notNull(),
        content: text('content').notNull(),
        embedding: vector('embedding', { dimensions: 384 }),
        metadata: jsonb('metadata'),
    },
    (table) => [
        index('idx_embeddings_user').on(table.userId),
        index('idx_embeddings_org').on(table.orgId),
        index('idx_embeddings_document').on(table.documentId),
    ]
);

// Per-user chatbot settings
export const chatbotSettings = pgTable(
    'chatbot_settings',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: text('user_id').notNull(),
        orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
        key: varchar('key', { length: 255 }).notNull(),
        value: jsonb('value'),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => [
        index('idx_settings_user_key').on(table.userId, table.key),
        index('idx_settings_org').on(table.orgId),
    ]
);

// Usage logs for metering
export const usageLogs = pgTable(
    'usage_logs',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: text('user_id').notNull(),
        orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
        model: text('model'),
        tokensIn: integer('tokens_in').default(0),
        tokensOut: integer('tokens_out').default(0),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => [
        index('idx_usage_user').on(table.userId),
        index('idx_usage_org').on(table.orgId),
    ]
);

// Chat conversations
export const conversations = pgTable(
    'conversations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: text('user_id').notNull(),
        title: text('title').default('New Chat'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => [index('idx_conversations_user').on(table.userId)]
);

// Messages within conversations
export const messages = pgTable(
    'messages',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        conversationId: uuid('conversation_id')
            .notNull()
            .references(() => conversations.id, { onDelete: 'cascade' }),
        role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
        content: text('content').notNull(),
        sources: jsonb('sources'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => [index('idx_messages_conversation').on(table.conversationId)]
);

// User billing plans (stub for now)
export const userPlans = pgTable('user_plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().unique(),
    plan: varchar('plan', { length: 50 }).default('free').notNull(),
    status: varchar('status', { length: 50 }).default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================
// Relations
// ============================================================

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
    members: many(orgMembers),
    documents: many(documents),
    embeddings: many(documentEmbeddings),
    settings: many(chatbotSettings),
    usageLogs: many(usageLogs),
    creator: one(users, { fields: [organizations.createdBy], references: [users.id] }),
}));

export const orgMembersRelations = relations(orgMembers, ({ one }) => ({
    organization: one(organizations, {
        fields: [orgMembers.orgId],
        references: [organizations.id],
    }),
    user: one(users, {
        fields: [orgMembers.userId],
        references: [users.id],
    }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
    documents: many(documents),
    conversations: many(conversations),
    usageLogs: many(usageLogs),
    settings: many(chatbotSettings),
    plan: one(userPlans),
    orgMemberships: many(orgMembers),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
    user: one(users, { fields: [documents.userId], references: [users.id] }),
    organization: one(organizations, { fields: [documents.orgId], references: [organizations.id] }),
    embeddings: many(documentEmbeddings),
}));

export const documentEmbeddingsRelations = relations(
    documentEmbeddings,
    ({ one }) => ({
        document: one(documents, {
            fields: [documentEmbeddings.documentId],
            references: [documents.id],
        }),
        user: one(users, {
            fields: [documentEmbeddings.userId],
            references: [users.id],
        }),
        organization: one(organizations, {
            fields: [documentEmbeddings.orgId],
            references: [organizations.id],
        }),
    })
);

export const conversationsRelations = relations(
    conversations,
    ({ one, many }) => ({
        user: one(users, {
            fields: [conversations.userId],
            references: [users.id],
        }),
        messages: many(messages),
    })
);

export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
}));

export const userPlansRelations = relations(userPlans, ({ one }) => ({
    user: one(users, { fields: [userPlans.userId], references: [users.id] }),
}));
