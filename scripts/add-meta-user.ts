import { db } from '../lib/db/neon';
import { orgMembers, users } from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        console.log("Finding info@metabox.mu...");
        const targetUserQuery = await db.execute(sql`SELECT id FROM neon_auth."user" WHERE email = 'info@metabox.mu' LIMIT 1`);
        if (targetUserQuery.rows.length === 0) {
            console.error("Could not find info@metabox.mu in neon_auth.user");
            process.exit(1);
        }
        const targetUserId = targetUserQuery.rows[0].id;
        console.log(`targetUserId: ${targetUserId}`);

        console.log("Finding ulyssetadahy@gmail.com...");
        const ownerQuery = await db.execute(sql`SELECT id FROM neon_auth."user" WHERE email = 'ulyssetadahy@gmail.com' LIMIT 1`);
        if (ownerQuery.rows.length === 0) {
            console.error("Could not find ulyssetadahy@gmail.com in neon_auth.user");
            process.exit(1);
        }
        const ownerId = ownerQuery.rows[0].id;
        console.log(`ownerId: ${ownerId}`);

        console.log("Finding org for owner...");
        const orgQuery = await db.execute(sql`SELECT "org_id" FROM "org_members" WHERE "user_id" = ${ownerId} AND "role" = 'super_admin' LIMIT 1`);
        if (orgQuery.rows.length === 0) {
            console.error("Could not find org where owner is super admin");
            process.exit(1);
        }
        const orgId = orgQuery.rows[0].org_id;
        console.log(`orgId: ${orgId}`);

        console.log("Adding info@metabox.mu to org...");
        // Check if already in org
        const existing = await db.execute(sql`SELECT id FROM "org_members" WHERE "user_id" = ${targetUserId} AND "org_id" = ${orgId}`);
        if (existing.rows.length > 0) {
            console.log("User is already in this org.");
        } else {
            await db.execute(sql`INSERT INTO "org_members" ("org_id", "user_id", "role") VALUES (${orgId}, ${targetUserId}, 'user')`);
            console.log("Successfully added user to org.");
        }

    } catch (e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
}
run();
