import { db } from '../lib/db/neon';
import { sql } from 'drizzle-orm';

async function run() {
    console.log("--- SCHEMAS & TABLES ---");
    const result = await db.execute(sql`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    `);
    console.table(result.rows);
    process.exit(0);
}
run().catch(console.error);
