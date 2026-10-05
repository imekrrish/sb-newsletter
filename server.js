// Zero-dependency production/local server: serves ./public and the RSS proxy from ./api/rss.js.
// On Vercel the same files are served as static output + a serverless function.
const http = require('http');
const fs = require('fs');
const path = require('path');
const rss = require('./api/rss');

const PORT = Number(process.env.PORT || 4400);
if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) throw new Error('PORT must be an integer between 0 and 65535');
const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpeg':'image/jpeg', '.jpg':'image/jpeg' };

const server = http
  .createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    if (u.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok' }));
    }
    if (u.pathname === '/api/rss') return rss(req, res);

    let pathname;
    try { pathname = decodeURIComponent(u.pathname); } catch { res.writeHead(400); return res.end('Invalid path'); }
    const file = path.resolve(PUBLIC, '.' + (pathname.endsWith('/') ? pathname+'index.html' : pathname));
    if (!file.startsWith(PUBLIC + path.sep)) {
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
  .listen(PORT, '0.0.0.0', () => console.log(`Newsletter studio listening on 0.0.0.0:${server.address().port}`));

// Drain in-flight requests when Railway replaces or stops a deployment.
let stopping = false;
function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`${signal}: shutting down`);
  const deadline = setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 25000);
  deadline.unref();
  server.close(() => { clearTimeout(deadline); process.exit(0); });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

