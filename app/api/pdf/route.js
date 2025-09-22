export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });

  try {
    // Forward Range requests so pdf.js can perform byte-range loading (saves bandwidth)
    const range = req.headers.get('range') || req.headers.get('Range');
    const forwardHeaders = {};
    if (range) forwardHeaders['Range'] = range;

    const upstream = await fetch(url, { headers: forwardHeaders, redirect: 'follow' });
    if (!upstream.ok && upstream.status !== 206) throw new Error('Failed to fetch');

    const headers = new Headers();
    const copy = (name) => {
      const v = upstream.headers.get(name);
      if (v) headers.set(name, v);
    };
    // Preserve key headers for range/streaming
    copy('content-type');
    copy('content-length');
    copy('content-range');
    copy('accept-ranges');
    copy('cache-control');
    copy('etag');
    copy('last-modified');
    copy('content-encoding');
    // Ensure sensible defaults
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/pdf');
    if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'public, max-age=60');
    headers.set('Vary', 'Range');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch (e) {
    return new Response('Proxy error', { status: 502 });
  }
}
