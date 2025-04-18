import { NextResponse } from 'next/server';
import { dbService } from '@/lib/database'; // Assuming dbService is exported from here
import { Message } from '@/types/chat'; // Import Message type

// Helper function to interact with Ollama API
async function generateTitleWithOllama(
  input: string | Message[], // Accept either a single message content or full history
): Promise<string | null> {
  const ollamaApiUrl = 'http://localhost:11434/api/chat';
  const ollamaModel = 'gemma3:4b'; // Or your preferred model for title generation

  if (!ollamaApiUrl || !ollamaModel) {
    console.error(
      'OLLAMA_API_URL or OLLAMA_TITLE_MODEL environment variable is not set.',
    );
    return null;
  }

  // Prepare messages array for the /api/chat endpoint
  const preparedMessages: Message[] = [];

  // System message with instructions
  preparedMessages.push({
    role: 'system',
    content:
      'Based on the following conversation history (or user message), generate a very short, concise title (3-5 words maximum) for the conversation. Focus on the main topic. Respond ONLY with a JSON object containing a single key "title" with the generated title as its string value. For example: { "title": "Generated Title" }.',
  });

  if (typeof input === 'string') {
    // Add the single user message
    preparedMessages.push({ role: 'user', content: input });
  } else {
    // Add the existing message history
    // Ensure the messages are in the correct { role, content } format if needed
    // Assuming 'input' (Message[]) is already in the correct format
    preparedMessages.push(...input);
  }

  // Define the expected JSON format
  const format = {
    type: 'object',
    properties: {
      title: {
        type: 'string',
      },
    },
    required: ['title'],
  };

  try {
    const response = await fetch(ollamaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ollamaModel,
        messages: preparedMessages, // Send the messages array
        stream: false, // We expect a single, non-streamed response for the title
        format: format, // Add the format parameter
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Ollama API request failed with status ${response.status}: ${errorBody}`,
      );
      throw new Error(`Ollama API request failed: ${response.statusText}`);
    }

    // Since stream: false, Ollama's /api/chat endpoint returns a single JSON object
    const data = await response.json();

    let generatedTitle = '';
    if (data.message && data.message.content) {
      try {
        // Parse the JSON string within the content field
        const contentJson = JSON.parse(data.message.content);
        if (contentJson.title && typeof contentJson.title === 'string') {
          generatedTitle = contentJson.title.trim();
        } else {
          console.warn(
            'Parsed content JSON does not contain a valid title string:',
            contentJson,
          );
          return 'Chat'; // Fallback
        }
      } catch (parseError) {
        console.error(
          'Error parsing Ollama message content JSON:',
          parseError,
          'Content:',
          data.message.content,
        );
        // Sometimes the model might still return plain text despite the format request
        // Let's try using the raw content as a fallback if it's not JSON
        if (typeof data.message.content === 'string') {
          generatedTitle = data.message.content.trim();
          // Basic cleanup even for fallback
          generatedTitle = generatedTitle.replace(
            /^["{\n\t title:"]+|["}\n\t ]+$/g,
            '',
          );
        } else {
          return 'Chat'; // Fallback if content isn't even a string
        }
      }
    } else {
      console.warn(
        'Ollama response did not contain expected message content:',
        data,
      );
      return 'Chat'; // Fallback
    }

    // Basic validation/cleanup of the generated title from Ollama
    if (!generatedTitle || generatedTitle.length > 100) {
      console.warn('Generated title is invalid or too long:', generatedTitle);
      return 'Chat'; // Fallback title (return string)
    }

    // Remove potential quotation marks often added by models
    generatedTitle = generatedTitle.replace(/^["']|["']$/g, '');

    return generatedTitle; // Return the valid generated title string
  } catch (error) {
    console.error('Error communicating with Ollama API:', error);
    return null; // Indicate failure by returning null
  }
}

export async function POST(request: Request) {
  try {
    // Accept either messageContent or messages array
    const { conversationId, messageContent, messages } = await request.json();

    if (!conversationId || typeof conversationId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 },
      );
    }
    if (
      // Ensure we have either messageContent or a non-empty messages array
      (!messageContent ||
        typeof messageContent !== 'string' ||
        messageContent.trim().length === 0) &&
      (!messages || !Array.isArray(messages) || messages.length === 0)
    ) {
      return NextResponse.json(
        { error: 'Either messageContent or a messages array is required' },
        { status: 400 },
      );
    }

    // Generate title using Ollama
    // Prioritize using the messages array if provided
    const titleInput =
      messages && messages.length > 0 ? messages : messageContent;
    const generatedTitle = await generateTitleWithOllama(titleInput);

    if (!generatedTitle) {
      // If title generation failed, we don't update the DB and return an error
      // The frontend will keep the temporary title "New Chat"
      return NextResponse.json(
        { error: 'Failed to generate title via Ollama' },
        { status: 500 }, // Internal Server Error might be appropriate
      );
    }

    // Update the conversation title in the database
    // Ensure updateConversationTitle handles potential errors gracefully
    try {
      dbService.updateConversationTitle(conversationId, generatedTitle);
    } catch (dbError) {
      console.error('Failed to update conversation title in DB:', dbError);
      // Even if DB update fails, we might still return the generated title to the frontend
      // Or return a specific error. Let's return an error for clarity.
      return NextResponse.json(
        { error: 'Failed to update database with new title' },
        { status: 500 },
      );
    }

    // Return the newly generated title
    return NextResponse.json({ title: generatedTitle });
  } catch (error) {
    console.error('Error in /api/generate-title:', error);
    return NextResponse.json(
      { error: 'Internal server error processing title generation' },
      { status: 500 },
    );
  }
}
