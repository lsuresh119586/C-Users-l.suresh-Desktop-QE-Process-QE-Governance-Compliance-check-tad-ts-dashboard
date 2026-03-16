import http from 'http';

const PORT = 3000;

console.log('1. Creating server...');
const server = http.createServer((req, res) => {
  console.log('Request received:', req.url);
  res.writeHead(200);
  res.end('OK');
});

console.log('2. Before listen call');
const listener = server.listen(PORT, '127.0.0.1', () => {
  console.log('3. Inside listen callback');
});

console.log('4. After listen call (this runs before callback!)');

// Add error handlers
server.on('error', (err) => {
  console.error('Server error:', err);
});

listener.on('listening', () => {
  console.log('5. Listening event fired');
});

listener.on('close', () => {
  console.log('5. Close event fired');
});

// Keep alive
setTimeout(() => {
  console.log('10 seconds have passed, server still running');
}, 10000);
