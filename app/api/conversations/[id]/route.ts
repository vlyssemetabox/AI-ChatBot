import { NextResponse } from 'next/server';
import { db } from '@/lib/db/neon';
import { conversations, messages } from '@/lib/db/schema';
import { getUserId } from '@/lib/auth/utils';
import { eq, and } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getUserId();
        const { id } = await params;

        const [conversation] = await db
            .select()
            .from(conversations)
            .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        return NextResponse.json(conversation);
    } catch (error: any) {
        console.error('Error fetching conversation:', error);
        if (error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        // Delete conversation (messages cascade)
        await db.delete(conversations).where(eq(conversations.id, id));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting conversation:', error);
        if (error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getUserId();
        const { id } = await params;
        const body = await req.json();

        if (!body.title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Verify ownership
        const [conversation] = await db
            .select()
            .from(conversations)
            .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const [updatedConversation] = await db
            .update(conversations)
            .set({ title: body.title, updatedAt: new Date() })
            .where(eq(conversations.id, id))
            .returning();

        return NextResponse.json(updatedConversation);
    } catch (error: any) {
        console.error('Error updating conversation:', error);
        if (error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }
}
