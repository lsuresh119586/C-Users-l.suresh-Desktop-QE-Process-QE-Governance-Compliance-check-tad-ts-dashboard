import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5173;

const server = http.createServer((req, res) => {
  console.log(`📨 ${req.method} ${req.url}`);
  
  // Route to tadts-dashboard.html for TAD/TS requests
  let filePath = req.url;
  
  if (req.url === '/' || req.url === '/index.html') {
    filePath = '/index.html';
  } else if (req.url === '/tadts' || req.url === '/tadts-dashboard' || req.url === '/tadts-dashboard.html') {
    filePath = '/tadts-dashboard.html';
  }
  
  // Remove query params
  filePath = filePath.split('?')[0];
  filePath = path.join(__dirname, filePath);

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.css':
      contentType = 'text/css';
      break;
    case '.js':
      contentType = 'application/javascript';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🌐 Frontend running on http://localhost:${PORT}`);
});
