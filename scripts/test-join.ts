import { db } from '../lib/db/neon';
import { orgMembers, users } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        const result = await db
            .select({
                id: orgMembers.id,
                userId: orgMembers.userId,
                role: orgMembers.role,
                name: users.name,
                email: users.email,
            })
            .from(orgMembers)
            .innerJoin(users, sql`${orgMembers.userId}::uuid = ${users.id}`);

        console.log("JOIN RESULT:");
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
}
run();
