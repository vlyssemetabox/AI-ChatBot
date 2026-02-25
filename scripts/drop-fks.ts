import { db } from '../lib/db/neon';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log('Dropping foreign key constraints referencing the user table...');

        await db.execute(sql`ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_user_id_user_id_fk`);
        await db.execute(sql`ALTER TABLE document_embeddings DROP CONSTRAINT IF EXISTS document_embeddings_user_id_user_id_fk`);
        await db.execute(sql`ALTER TABLE chatbot_settings DROP CONSTRAINT IF EXISTS chatbot_settings_user_id_user_id_fk`);
        await db.execute(sql`ALTER TABLE usage_logs DROP CONSTRAINT IF EXISTS usage_logs_user_id_user_id_fk`);
        await db.execute(sql`ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_id_user_id_fk`);
        await db.execute(sql`ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_user_id_user_id_fk`);
        await db.execute(sql`ALTER TABLE user_plans DROP CONSTRAINT IF EXISTS user_plans_user_id_user_id_fk`);

        console.log('Successfully dropped all foreign keys referencing user.id');
    } catch (error) {
        console.error('Failed to execute migration:', error);
    }

    process.exit(0);
}

main();
