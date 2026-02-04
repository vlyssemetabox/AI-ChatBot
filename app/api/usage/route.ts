import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Query ALL logs with created_at to calculate totals and daily stats
        const { data: allLogs, error: logsError } = await supabase
            .from('usage_logs')
            .select('tokens_in, tokens_out, created_at');

        if (logsError) throw logsError;

        if (logsError) throw logsError;

        let lifetimeTokens = 0;
        let lifetimeRequests = 0;
        let todayTokens = 0;
        let todayRequests = 0;

        const now = new Date();
        // Reset to start of day in local time? Or UTC?
        // Usually API quotas are UTC or specific TZ. Cerebras is likely UTC. 
        // Let's treat today as UTC start of day.
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        allLogs.forEach(log => {
            const tokens = (log.tokens_in || 0) + (log.tokens_out || 0);
            lifetimeTokens += tokens;
            lifetimeRequests++;

            const logDate = new Date(log.created_at);
            if (logDate >= startOfDay) {
                todayTokens += tokens;
                todayRequests++;
            }
        });

        return Response.json({
            today_tokens: todayTokens,
            today_requests: todayRequests,
            total_tokens: lifetimeTokens,
            total_requests: lifetimeRequests
        });

    } catch (error) {
        console.error('Usage API Error:', error);
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }
}
