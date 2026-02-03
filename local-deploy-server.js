const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// tRPC-like endpoints to fix your 404 error
app.get('/api/trpc/auth.me', (req, res) => {
  res.json({
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
  });
});

app.get('/api/trpc/system.health', (req, res) => {
  res.json({
    result: {
      data: {
        ok: true
      }
    }
  });
});

// Simple homepage
app.get('/', (req, res) => {
  res.send('<h1>🚀 Product Card Generator</h1><p>Server is running successfully!</p><p><a href="/api/trpc/auth.me">Test Auth Endpoint</a> | <a href="/api/trpc/system.health">Test Health Endpoint</a></p>');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📡 Available endpoints:');
  console.log(`   http://localhost:${PORT}/api/trpc/auth.me`);
  console.log(`   http://localhost:${PORT}/api/trpc/system.health`);
});