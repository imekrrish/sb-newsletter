// GET /api/rss?url=<feed URL>
// Fetches an RSS feed server-side so the browser avoids CORS.
// Runs as a Vercel serverless function and is reused by the local server.js.
// Only RSS/XML responses are passed through, so it can't serve as a general web proxy.

const MAX_BYTES = 5 * 1024 * 1024;

function send(res, status, body, type) {
  res.statusCode = status;
  res.setHeader('Content-Type', type || 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', status === 200 ? 's-maxage=300, stale-while-revalidate=600' : 'no-store');
  res.end(body);
}

module.exports = async function handler(req, res) {
  const target = new URL(req.url, 'http://localhost').searchParams.get('url') || '';
  let url;
  try {
    url = new URL(target);
    if (!/^https?:$/.test(url.protocol)) throw new Error();
  } catch {
    return send(res, 400, 'Invalid RSS URL');
  }

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (SOLARbytes Newsletter Generator)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return send(res, 502, `Upstream responded ${r.status}`);

    const body = await r.text();
    if (body.length > MAX_BYTES) return send(res, 502, 'Feed is too large');
    if (!/<rss[\s>]|<feed[\s>]|<\?xml/i.test(body.slice(0, 2000))) {
      return send(res, 502, 'That URL did not return an RSS feed');
    }
    return send(res, 200, body, 'application/xml; charset=utf-8');
  } catch (err) {
    return send(res, 502, 'Could not fetch RSS: ' + err.message);
  }
};
