import { NextResponse } from 'next/server';
import { db } from '@/lib/db/neon';
import { conversations, messages } from '@/lib/db/schema';
import { getUserId } from '@/lib/auth/utils';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getUserId();
        const { id } = await params;

        // Verify ownership
        const [conversation] = await db
            .select()
            .from(conversations)
            .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Fetch messages for this conversation
        const conversationMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, id))
            .orderBy(asc(messages.createdAt));

        return NextResponse.json(conversationMessages);
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        if (error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
