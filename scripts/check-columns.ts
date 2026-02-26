import { db } from '../lib/db/neon';
import { sql } from 'drizzle-orm';

async function run() {
    console.log("--- NEON AUTH USER COLUMNS ---");
    const result = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema='neon_auth' AND table_name='user'
    `);
    console.table(result.rows);
    process.exit(0);
}
run().catch(console.error);
