import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const cols = await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'usage_logs' ORDER BY ordinal_position`;
console.log(JSON.stringify(cols, null, 2));
