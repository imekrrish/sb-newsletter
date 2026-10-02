// Local zero-dependency server: serves ./public and the RSS proxy from ./api/rss.js.
// On Vercel the same files are served as static output + a serverless function.
const http = require('http');
const fs = require('fs');
const path = require('path');
const rss = require('./api/rss');

const PORT = process.env.PORT || 4400;
const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };

http
  .createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
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
  .listen(PORT, () => console.log(`Newsletter studio: http://localhost:${PORT}`));

