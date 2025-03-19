export async function GET() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');

    if (!response.ok) {
      throw new Error('Failed to fetch models from Ollama');
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return Response.json(
      { error: 'Failed to fetch Ollama models' },
      { status: 500 },
    );
  }
}
