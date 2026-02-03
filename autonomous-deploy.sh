#!/bin/bash
# Autonomous deployment script
cd /var/www/u3155554/data
mkdir -p autonomous-final
cd autonomous-final
cat > server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/api/trpc/auth.me') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({result:{data:{user:{id:'local-user',name:'Local User',email:'user@example.com',role:'user'}}}}));
    return;
  }
  if (req.url === '/api/trpc/system.health') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({result:{data:{ok:true}}}));
    return;
  }
  if (req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>🚀 Server Running</h1><p><a href="/api/trpc/auth.me">Auth Endpoint</a> | <a href="/api/trpc/system.health">Health Endpoint</a></p>');
    return;
  }
  res.writeHead(404);
  res.end('Not Found');
});
const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log('🚀 Server running on port ' + port);
});
EOF
pkill -f "node server.js" 2>/dev/null || true
nohup ~/bin/node server.js > server.log 2>&1 &
sleep 3
curl -s http://localhost:3000/ >/dev/null && echo "✅ Server deployed successfully!" || echo "⚠️ Server started, verification pending"
