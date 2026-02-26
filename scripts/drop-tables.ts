import { db } from '../lib/db/neon';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        console.log("Dropping overlapping public auth tables...");
        await db.execute(sql`DROP TABLE IF EXISTS "public"."user" CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS "public"."session" CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS "public"."account" CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS "public"."verification" CASCADE`);
        console.log("Successfully dropped public auth tables.");

        console.log("Dropping unused neon_auth organization tables...");
        await db.execute(sql`DROP TABLE IF EXISTS "neon_auth"."organization" CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS "neon_auth"."member" CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS "neon_auth"."invitation" CASCADE`);
        console.log("Successfully dropped neon_auth organization tables.");
    } catch (e) {
        console.error("ERROR dropping tables:", e);
    }
    process.exit(0);
}
run();
