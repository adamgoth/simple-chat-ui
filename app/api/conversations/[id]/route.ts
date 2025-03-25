import { NextResponse } from 'next/server';
import { dbService } from '@/lib/database';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const conversationId = parseInt(params.id);
    const conversation = dbService.getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const conversationId = parseInt(params.id);
    dbService.deleteConversation(conversationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 },
    );
  }
}
