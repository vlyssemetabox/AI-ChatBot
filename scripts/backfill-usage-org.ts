/**
 * Backfill Script: Assign org_id to all usage_logs rows where it is NULL.
 *
 * Logic: For each usage_logs row with org_id IS NULL, look up the user's
 * organization via org_members and set usage_logs.org_id = org_members.org_id.
 *
 * Run with: npx tsx scripts/backfill-usage-org.ts
 */
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function main() {
    const sql = neon(process.env.DATABASE_URL!);

    // 1. Count rows with NULL org_id before backfill
    const before = await sql`SELECT COUNT(*) as count FROM usage_logs WHERE org_id IS NULL`;
    const nullCount = Number(before[0].count);
    console.log(`📊 Found ${nullCount} usage_logs rows with NULL org_id`);

    if (nullCount === 0) {
        console.log('✅ Nothing to backfill — all rows already have org_id.');
        return;
    }

    // 2. Run the backfill UPDATE
    const result = await sql`
        UPDATE usage_logs u
        SET org_id = om.org_id
        FROM org_members om
        WHERE u.user_id = om.user_id
          AND u.org_id IS NULL
    `;

    // 3. Verify
    const after = await sql`SELECT COUNT(*) as count FROM usage_logs WHERE org_id IS NULL`;
    const remainingNull = Number(after[0].count);

    console.log(`✅ Backfill complete.`);
    console.log(`   Rows still NULL: ${remainingNull}`);
    if (remainingNull > 0) {
        console.log(`   ⚠️  ${remainingNull} rows could not be matched (user may not belong to any org).`);
    }

    // 4. Show a sample of updated rows
    const sample = await sql`SELECT id, user_id, org_id, created_at FROM usage_logs WHERE org_id IS NOT NULL ORDER BY created_at DESC LIMIT 5`;
    console.log('\n📋 Sample updated rows:');
    console.table(sample);
}

main().catch((err) => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
});
