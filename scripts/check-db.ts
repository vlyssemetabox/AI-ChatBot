import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

async function check() {
    const sqlClient = neon(process.env.DATABASE_URL!);
    const db = drizzle(sqlClient);

    // List all tables
    const tables = await db.execute(sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    `);
    console.log('Tables:', tables.rows.map((r: any) => r.table_name));

    // Check if org tables have data
    const orgCount = await db.execute(sql`SELECT COUNT(*) as cnt FROM organizations`);
    console.log('Organizations:', orgCount.rows[0]);

    const memberCount = await db.execute(sql`SELECT COUNT(*) as cnt FROM org_members`);
    console.log('Org members:', memberCount.rows[0]);

    // Check documents
    const docCount = await db.execute(sql`SELECT COUNT(*) as cnt FROM documents`);
    console.log('Documents:', docCount.rows[0]);
}

check().catch(console.error);
