// Tiny zero-dependency server: serves ./public and proxies RSS URLs (avoids browser CORS).
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4400;
const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };

async function proxyRss(req, res, target) {
  let url;
  try {
    url = new URL(target);
    if (!/^https?:$/.test(url.protocol)) throw new Error();
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Invalid RSS URL');
  }
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (SOLARbytes Newsletter Generator)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(20000),
    });
    const body = await r.text();
    res.writeHead(r.ok ? 200 : 502, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(r.ok ? body : `Upstream responded ${r.status}`);
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Could not fetch RSS: ' + err.message);
  }
}

http
  .createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    if (u.pathname === '/api/rss') return proxyRss(req, res, u.searchParams.get('url') || '');

    const file = path.normalize(path.join(PUBLIC, decodeURIComponent(u.pathname === '/' ? 'index.html' : u.pathname)));
    if (!file.startsWith(PUBLIC)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not found');
      }
      res.writeHead(200, { 'Content-Type': (TYPES[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`SOLARbytes newsletter generator: http://localhost:${PORT}`));
