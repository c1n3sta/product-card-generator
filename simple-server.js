const http = require("http");

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  if (req.url.startsWith("/api/trpc/auth.me")) {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify({
      "result": {
        "data": {
          "user": {
            "id": "test-user",
            "name": "Test User",
            "email": "test@example.com",
            "role": "user"
          }
        }
      }
    }));
  } else if (req.url.startsWith("/api/trpc/system.health")) {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify({
      "result": {
        "data": {
          "ok": true
        }
      }
    }));
  } else {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.end("Endpoint not found");
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Simple tRPC test server running on port ${port}`);
  console.log(`📡 Test endpoint: http://localhost:${port}/api/trpc/auth.me`);
});