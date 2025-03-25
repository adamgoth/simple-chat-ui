import { NextResponse } from 'next/server';
import { dbService } from '@/lib/database';

export async function GET(request: Request) {
  try {
    // For now, we'll use a default user ID. In a real app, this would come from authentication
    const userId = 'default-user';
    const conversations = dbService.getUserConversations(userId);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, model, llm } = await request.json();
    const userId = 'default-user'; // In a real app, this would come from authentication

    const conversationId = dbService.createConversation(
      userId,
      title,
      model,
      llm,
    );
    const conversation = dbService.getConversation(conversationId);

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 },
    );
  }
}
