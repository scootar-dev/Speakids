const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  let decodedPath;
  try { decodedPath = decodeURIComponent(req.url.split('?')[0]); }
  catch (_) { res.writeHead(400); res.end('URL tidak valid'); return; }
  if (decodedPath === '/' || decodedPath === '') {
    res.writeHead(302, { Location: '/assets/app/index.html' });
    res.end();
    return;
  }

  const filePath = path.normalize(path.join(ROOT, decodedPath));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    res.end('Akses ditolak');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Berkas tidak ditemukan: ' + decodedPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const range = req.headers.range;
    if (range && ext === '.mp3') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end >= stats.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` });
        res.end();
        return;
      }
      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      file.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}/assets/app/index.html`;
  console.log(`\n==============================================`);
  console.log(`SpeaKids server berjalan di: ${url}`);
  console.log(`Tekan Ctrl + C untuk menghentikan server.`);
  console.log(`==============================================\n`);

  if (process.platform === 'win32') {
    exec(`start "" "${url}"`);
  }
});
