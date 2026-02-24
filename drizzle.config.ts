import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './lib/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    // Only manage application tables — auth tables are managed by Neon Auth
    tablesFilter: [
        'documents',
        'document_embeddings',
        'chatbot_settings',
        'usage_logs',
        'conversations',
        'messages',
        'user_plans',
    ],
});
