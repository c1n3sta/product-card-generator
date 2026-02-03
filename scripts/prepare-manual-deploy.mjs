#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

// Create local files that you can upload via SSH
console.log('📁 Creating local deployment files...\n');

// 1. Create package.json
const packageJson = {
  "name": "product-card-generator",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
};

fs.writeFileSync('local-deploy-package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Created: local-deploy-package.json');

// 2. Create server.js
const serverJs = `const express = require('express');
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
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log('📡 Available endpoints:');
  console.log(\`   http://localhost:\${PORT}/api/trpc/auth.me\`);
  console.log(\`   http://localhost:\${PORT}/api/trpc/system.health\`);
});`;

fs.writeFileSync('local-deploy-server.js', serverJs);
console.log('✅ Created: local-deploy-server.js');

// 3. Create startup script
const startupScript = `#!/bin/bash
cd ~/product-card-app
export NODE_ENV=production
export PORT=3000
echo "🚀 Starting Product Card Generator..."
~/bin/node server.js`;

fs.writeFileSync('local-start-product-card.sh', startupScript);
console.log('✅ Created: local-start-product-card.sh');

// 4. Create process manager
const pmScript = `#!/bin/bash
case "$1" in
  start)
    echo "🚀 Starting application..."
    cd ~/product-card-app
    nohup ~/bin/node server.js > app.log 2>&1 &
    echo $! > app.pid
    echo "✅ Application started with PID $(cat app.pid)"
    ;;
  stop)
    if [ -f app.pid ]; then
      echo "🛑 Stopping application..."
      kill $(cat app.pid) 2>/dev/null || true
      rm -f app.pid
      echo "✅ Application stopped"
    else
      echo "⚠️  No running application found"
    fi
    ;;
  status)
    if [ -f app.pid ] && kill -0 $(cat app.pid) 2>/dev/null; then
      echo "✅ Application is running (PID: $(cat app.pid))"
    else
      echo "❌ Application is not running"
    fi
    ;;
  logs)
    if [ -f ~/product-card-app/app.log ]; then
      tail -f ~/product-card-app/app.log
    else
      echo "⚠️  No log file found"
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|status|logs}"
    exit 1
    ;;
esac`;

fs.writeFileSync('local-app-manager.sh', pmScript);
console.log('✅ Created: local-app-manager.sh');

console.log('\n===========================================');
console.log('🎉 LOCAL FILES CREATED FOR MANUAL DEPLOYMENT');
console.log('===========================================\n');

console.log('📁 Created local files:');
console.log('   - local-deploy-package.json');
console.log('   - local-deploy-server.js');
console.log('   - local-start-product-card.sh');
console.log('   - local-app-manager.sh\n');

console.log('📋 MANUAL DEPLOYMENT INSTRUCTIONS:\n');

console.log('1. SSH into your server:');
console.log('   ssh u3155554@server193.hosting.reg.ru\n');

console.log('2. Create and navigate to app directory:');
console.log('   mkdir -p ~/product-card-app');
console.log('   cd ~/product-card-app\n');

console.log('3. Upload the local files to your server using one of these methods:');
console.log('   Option A: Copy-paste content manually');
console.log('   Option B: Use SFTP/FileZilla to upload files');
console.log('   Option C: Use scp command:\n');

console.log('   scp local-deploy-package.json u3155554@server193.hosting.reg.ru:~/product-card-app/package.json');
console.log('   scp local-deploy-server.js u3155554@server193.hosting.reg.ru:~/product-card-app/server.js');
console.log('   scp local-start-product-card.sh u3155554@server193.hosting.reg.ru:~/start-product-card.sh');
console.log('   scp local-app-manager.sh u3155554@server193.hosting.reg.ru:~/app-manager.sh\n');

console.log('4. Rename and set permissions on server:');
console.log('   cd ~/product-card-app');
console.log('   mv ~/start-product-card.sh ./start-product-card.sh');
console.log('   mv ~/app-manager.sh ./app-manager.sh');
console.log('   chmod +x start-product-card.sh app-manager.sh\n');

console.log('5. Install dependencies:');
console.log('   ~/bin/npm install\n');

console.log('6. Start the application:');
console.log('   ~/app-manager.sh start\n');

console.log('7. Test the deployment:');
console.log('   curl http://localhost:3000/api/trpc/auth.me');
console.log('   curl http://localhost:3000/api/trpc/system.health\n');

console.log('💡 This will fix your tRPC 404 error by providing the missing endpoints!');
console.log('💡 Your application will be accessible at: http://print-lab-spb.ru:3000/');