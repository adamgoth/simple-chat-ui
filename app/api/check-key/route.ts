export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return Response.json(
      { error: 'Key parameter is required' },
      { status: 400 },
    );
  }

  const hasKey = !!process.env[key];
  return Response.json({ hasKey });
}
