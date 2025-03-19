export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    if (!model) {
      throw new Error('Model parameter is required');
    }

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Ollama');
    }

    const responseText = await response.text();
    const jsonLines = responseText.trim().split('\n');
    let fullContent = '';

    // Process each line of the response
    for (const line of jsonLines) {
      try {
        const data = JSON.parse(line);
        if (data.message?.content) {
          fullContent += data.message.content;
        }
      } catch (error) {
        console.error('Error parsing line:', error);
      }
    }

    return new Response(JSON.stringify({ content: fullContent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-ollama route:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process chat request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
