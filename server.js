const http = require('http');

const server = http.createServer((req, res) => {
  // Handle tRPC auth endpoint - fixes your 404 error
  if (req.url === '/api/trpc/auth.me') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      result: {
        data: {
          user: {
            id: 'local-user',
            name: 'Local User',
            email: 'user@example.com',
            role: 'user'
          }
        }
      }
    }));
    return;
  }
  
  // Handle health check endpoint
  if (req.url === '/api/trpc/system.health') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      result: {
        data: {
          ok: true
        }
      }
    }));
    return;
  }
  
  // Simple homepage
  if (req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`
      <h1>🚀 Product Card Generator Server</h1>
      <p>Server is running successfully!</p>
      <ul>
        <li><a href="/api/trpc/auth.me">Auth Endpoint</a></li>
        <li><a href="/api/trpc/system.health">Health Endpoint</a></li>
      </ul>
    `);
    return;
  }
  
  // 404 for everything else
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.end('Endpoint not found');
});

// Use environment port or default to 3000
const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log('🚀 Product Card Generator Server running on port ' + port);
  console.log('📡 Available at: http://print-lab-spb.ru:' + port);
});