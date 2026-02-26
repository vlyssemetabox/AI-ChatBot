import { db } from '../lib/db/neon';
import { users, orgMembers, organizations } from '../lib/db/schema';

async function run() {
    console.log("--- USERS ---");
    const allUsers = await db.select().from(users);
    console.log(allUsers);

    console.log("--- ORG MEMBERS ---");
    const allMembers = await db.select().from(orgMembers);
    console.log(allMembers);

    console.log("--- ORGS ---");
    const allOrgs = await db.select().from(organizations);
    console.log(allOrgs);
    process.exit(0);
}
run().catch(console.error);
