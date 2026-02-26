import { db } from '../lib/db/neon';
import { sql } from 'drizzle-orm';

async function run() {
    const result = await db.execute(sql`
        SELECT table_schema, table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE (table_schema='public' AND table_name='org_members' AND column_name='user_id')
           OR (table_schema='neon_auth' AND table_name='user' AND column_name='id')
    `);
    console.table(result.rows);
    process.exit(0);
}
run();
