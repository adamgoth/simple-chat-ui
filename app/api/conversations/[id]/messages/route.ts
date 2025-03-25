import { NextResponse } from 'next/server';
import { dbService } from '@/lib/database';
import { Message } from '@/types/chat';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const conversationId = parseInt(params.id);
    const message: Message = await request.json();

    const messageId = dbService.saveMessage(conversationId, message);
    const conversation = dbService.getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 },
    );
  }
}
