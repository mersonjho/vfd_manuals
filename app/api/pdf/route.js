export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');

    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/pdf',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (e) {
    return new Response('Proxy error', { status: 502 });
  }
}
