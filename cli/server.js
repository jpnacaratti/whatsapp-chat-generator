'use strict';
// Servidor estático mínimo para web/ (a página faz fetch de JSON/assets, então file:// não funciona).
// Arquivos extras (fotos do JSON que estão fora de web/) são registrados com addFile() e servidos em /__f/<n>/<nome>.
const http = require('http');
const fs = require('fs');
const path = require('path');

const WEB_ROOT = path.join(__dirname, '..', 'web');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
};

function startServer(port = 0) {
  const files = new Map();
  const server = http.createServer((req, res) => {
    let file = null;
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const extra = /^\/__f\/(\d+)\//.exec(pathname);
      if (extra) file = files.get(+extra[1]);
      else {
        const p = path.join(WEB_ROOT, pathname === '/' ? 'index.html' : pathname);
        if (p.startsWith(WEB_ROOT + path.sep)) file = p;
      }
    } catch { /* URL inválida */ }
    fs.readFile(file || '', (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({
      url: `http://127.0.0.1:${server.address().port}/`,
      addFile(file) { files.set(files.size, file); return `/__f/${files.size - 1}/${encodeURIComponent(path.basename(file))}`; },
      close: () => new Promise(r => server.close(r)),
    }));
  });
}

module.exports = { startServer, WEB_ROOT };
