import { db } from './lib/db/neon';
import { usageLogs } from './lib/db/schema';
import { desc } from 'drizzle-orm';

async function checkLogs() {
    try {
        const logs = await db.select().from(usageLogs).orderBy(desc(usageLogs.createdAt)).limit(10);
        console.log('Recent Usage Logs:');
        logs.forEach(log => {
            console.log(`- Model: ${log.model}, Date: ${log.createdAt}`);
        });
    } catch (err) {
        console.error('Failed to fetch logs:', err);
    }
}

checkLogs();
