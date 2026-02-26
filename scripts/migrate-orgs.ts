import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { organizations, orgMembers, documents, documentEmbeddings, chatbotSettings, usageLogs, users } from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { generateOrgCode } from '../lib/auth/rbac';

/**
 * Migration Script: Create organizations for existing users with documents.
 * 
 * This script is IDEMPOTENT — it will skip users who already belong to an org.
 * 
 * Steps:
 * 1. Find all users who have uploaded documents
 * 2. For each, create an organization
 * 3. Add them as super_admin
 * 4. Link their documents + embeddings + settings + usage to the new org
 */
async function migrate() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required');
    }

    const sqlClient = neon(process.env.DATABASE_URL);
    const db = drizzle(sqlClient);

    console.log('🔄 Starting organization migration...\n');

    // Find distinct users who have documents
    const usersWithDocs = await db.execute(sql`
        SELECT DISTINCT d.user_id, u.name, u.email
        FROM documents d
        LEFT JOIN "user" u ON d.user_id = u.id
    `);

    const rows = usersWithDocs.rows as any[];
    console.log(`📋 Found ${rows.length} user(s) with documents\n`);

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
        const userId = row.user_id;
        const userName = row.name || row.email?.split('@')[0] || 'User';

        // Check if user already belongs to an org
        const existingMembership = await db
            .select()
            .from(orgMembers)
            .where(eq(orgMembers.userId, userId))
            .limit(1);

        if (existingMembership.length > 0) {
            console.log(`⏭️  Skipping ${userName} — already in an org`);
            skipped++;
            continue;
        }

        // Create org
        const orgCode = generateOrgCode();
        const orgName = `${userName}'s Organization`;

        const [org] = await db
            .insert(organizations)
            .values({
                name: orgName,
                orgCode,
                createdBy: userId,
            })
            .returning();

        // Add as super_admin
        await db.insert(orgMembers).values({
            orgId: org.id,
            userId,
            role: 'super_admin',
        });

        // Link documents
        await db.execute(sql`
            UPDATE documents SET org_id = ${org.id}::uuid WHERE user_id = ${userId}
        `);

        // Link embeddings
        await db.execute(sql`
            UPDATE document_embeddings SET org_id = ${org.id}::uuid WHERE user_id = ${userId}
        `);

        // Link settings
        await db.execute(sql`
            UPDATE chatbot_settings SET org_id = ${org.id}::uuid WHERE user_id = ${userId}
        `);

        // Link usage logs
        await db.execute(sql`
            UPDATE usage_logs SET org_id = ${org.id}::uuid WHERE user_id = ${userId}
        `);

        console.log(`✅ Created org "${orgName}" (code: ${orgCode}) for ${userName}`);
        created++;
    }

    console.log(`\n🎉 Migration complete! Created: ${created}, Skipped: ${skipped}`);
}

migrate().catch(console.error);
