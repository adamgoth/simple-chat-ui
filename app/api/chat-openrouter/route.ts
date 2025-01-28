export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: messages,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from OpenRouter');
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ content: data.choices[0].message.content }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in chat-openrouter route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
