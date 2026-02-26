import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

async function createTables() {
    const sqlClient = neon(process.env.DATABASE_URL!);
    const db = drizzle(sqlClient);

    console.log('Creating organizations table...');
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS organizations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            org_code VARCHAR(12) NOT NULL UNIQUE,
            created_by TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
    `);
    console.log('✅ organizations table created');

    console.log('Creating org_members table...');
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS org_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            joined_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
    `);
    console.log('✅ org_members table created');

    // Create unique index
    await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_unique ON org_members(org_id, user_id)
    `);
    await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id)
    `);
    console.log('✅ indexes created');

    // Add org_id columns to existing tables if not present
    console.log('Adding org_id columns...');

    try {
        await db.execute(sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
        console.log('✅ documents.org_id added');
    } catch (e: any) { console.log('  documents.org_id already exists or error:', e.message); }

    try {
        await db.execute(sql`ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
        console.log('✅ document_embeddings.org_id added');
    } catch (e: any) { console.log('  document_embeddings.org_id already exists or error:', e.message); }

    try {
        await db.execute(sql`ALTER TABLE chatbot_settings ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
        console.log('✅ chatbot_settings.org_id added');
    } catch (e: any) { console.log('  chatbot_settings.org_id already exists or error:', e.message); }

    try {
        await db.execute(sql`ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
        console.log('✅ usage_logs.org_id added');
    } catch (e: any) { console.log('  usage_logs.org_id already exists or error:', e.message); }

    // Create indexes on org_id
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(org_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_embeddings_org ON document_embeddings(org_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_settings_org ON chatbot_settings(org_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_usage_org ON usage_logs(org_id)`);
    console.log('✅ org_id indexes created');

    // Verify
    const tables = await db.execute(sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    `);
    console.log('\nAll tables:', tables.rows.map((r: any) => r.table_name));
    console.log('\n🎉 Schema setup complete!');
}

createTables().catch(console.error);
