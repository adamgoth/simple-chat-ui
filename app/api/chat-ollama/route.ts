export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-r1',
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Ollama');
    }

    const data = await response.json();

    return new Response(JSON.stringify({ content: data.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-ollama route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
