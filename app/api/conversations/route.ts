import { NextResponse } from 'next/server';
import { db } from '@/lib/db/neon';
import { conversations, messages } from '@/lib/db/schema';
import { getUserId } from '@/lib/auth/utils';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
    try {
        const userId = await getUserId();

        const userConversations = await db
            .select()
            .from(conversations)
            .where(eq(conversations.userId, userId))
            .orderBy(desc(conversations.updatedAt));

        return NextResponse.json(userConversations);
    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        if (error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const title = body.title || 'New Chat';

        const [newConversation] = await db
            .insert(conversations)
            .values({
                userId,
                title,
            })
            .returning();

        return NextResponse.json(newConversation);
    } catch (error: any) {
        console.error('Error creating conversation:', error);
        if (error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
}
