import crypto from 'crypto';

const VALID_TOKEN = '4902d6a1ccbbf9484e4b8b85eff57631f85a00bd67cc4a3db7f8d0777d697b73';

export async function GET(req) {
  // Auth check
  const authCookie = req.cookies?.get?.('vfd_auth');
  const token = authCookie?.value;
  if (token !== VALID_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

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
    // Allow embedding in iframe/object — critical for PDF viewer
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('Content-Security-Policy', "frame-ancestors 'self'");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch (e) {
    return new Response('Proxy error', { status: 502 });
  }
}
