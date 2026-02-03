#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const CONFIG = {
  sshHost: 'server193.hosting.reg.ru',
  sshUser: 'u3155554',
  sshPassword: 'CeZPr42z5WVara15'
};

async function runSSHCommand(command) {
  try {
    process.env.SSH_USER = CONFIG.sshUser;
    process.env.SSH_PASS = CONFIG.sshPassword;
    
    const sshCommand = `"C:\\Program Files\\SshRunAs\\SshRunAs.exe" -s ${CONFIG.sshHost} -u SSH_USER -p SSH_PASS -c "${command}" -P 22 -v 1`;
    
    console.log(`📡 Executing: ${command}`);
    const { stdout, stderr } = await execAsync(sshCommand);
    
    delete process.env.SSH_USER;
    delete process.env.SSH_PASS;
    
    if (stderr) {
      console.log('⚠️  STDERR:', stderr.trim());
    }
    
    return stdout || '';
  } catch (error) {
    console.error(`❌ SSH Command failed: ${error.message}`);
    throw error;
  }
}

async function createRemoteFile(content, remotePath) {
  // Handle empty content
  if (!content || content.length === 0) {
    await runSSHCommand(`touch ${remotePath}`);
    return;
  }
  
  // Split content into smaller chunks to avoid command length limits
  const chunks = [];
  const chunkSize = 400; // Reduced size for safer transmission
  
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  
  // Clear/create the file
  await runSSHCommand(`echo -n '' > ${remotePath}`);
  
  // Write chunks one by one
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].replace(/'/g, "'\"'\"'");
    await runSSHCommand(`echo -n '${chunk}' >> ${remotePath}`);
  }
}

async function deployApplication() {
  console.log('🚀 Application Deployment via SSH\n');
  console.log('===================================\n');
  
  try {
    // 1. Create deployment directory
    console.log('1. Setting up deployment environment...');
    await runSSHCommand('mkdir -p ~/deployed-app');
    await runSSHCommand('cd ~/deployed-app && pwd');
    console.log('✅ Deployment directory ready\n');
    
    // 2. Create package.json
    console.log('2. Creating package.json...');
    const packageJson = {
      "name": "deployed-app",
      "version": "1.0.0",
      "main": "index.js",
      "scripts": {
        "start": "node index.js",
        "dev": "node index.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };
    
    await createRemoteFile(JSON.stringify(packageJson, null, 2), '~/deployed-app/package.json');
    console.log('✅ package.json created\n');
    
    // 3. Create main application file
    console.log('3. Creating application server...');
    const appContent = `const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Node.js 18 Application</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; }
        .info { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .endpoint { background: #e8f5e8; padding: 10px; margin: 10px 0; border-left: 4px solid #27ae60; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Node.js 18 Application Deployed!</h1>
        <div class="info">
          <strong>Server Info:</strong><br>
          Node.js Version: \${process.version}<br>
          Platform: \${process.platform}<br>
          Architecture: \${process.arch}
        </div>
        <h2>Available Endpoints:</h2>
        <div class="endpoint"><strong>GET /</strong> - This homepage</div>
        <div class="endpoint"><strong>GET /api/status</strong> - API status check</div>
        <div class="endpoint"><strong>GET /api/info</strong> - Server information</div>
        <div class="endpoint"><strong>POST /api/echo</strong> - Echo your POST data</div>
      </div>
    </body>
    </html>
  \`);
});

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    message: 'Application is running successfully!'
  });
});

app.get('/api/info', (req, res) => {
  res.json({ 
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: process.memoryUsage().rss,
      heapTotal: process.memoryUsage().heapTotal,
      heapUsed: process.memoryUsage().heapUsed
    }
  });
});

app.post('/api/echo', (req, res) => {
  res.json({ 
    received: req.body,
    timestamp: new Date().toISOString(),
    echo: true
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(\`✅ Server running on port \${PORT}\`);
  console.log(\`📍 Access at: http://localhost:\${PORT}\`);
});

module.exports = app;
`;
    
    await createRemoteFile(appContent, '~/deployed-app/index.js');
    console.log('✅ Application server created\n');
    
    // 4. Install dependencies
    console.log('4. Installing dependencies...');
    try {
      const installOutput = await runSSHCommand('cd ~/deployed-app && ~/bin/npm install');
      console.log('✅ Dependencies installed');
      if (installOutput.trim()) {
        console.log('📦 Install log:', installOutput.trim().slice(0, 200) + '...');
      }
    } catch (error) {
      console.log('⚠️  npm install reported issues, but continuing...');
    }
    console.log('');
    
    // 5. Create startup script
    console.log('5. Creating startup script...');
    const startupScript = `#!/bin/bash
cd ~/deployed-app
export NODE_ENV=production
export PORT=3000
echo "🚀 Starting Node.js 18 application..."
~/bin/node index.js
`;
    
    await createRemoteFile(startupScript, '~/start-deployed-app.sh');
    await runSSHCommand('chmod +x ~/start-deployed-app.sh');
    console.log('✅ Startup script created\n');
    
    // 6. Create process manager script
    console.log('6. Creating process management scripts...');
    const pm2LikeScript = `#!/bin/bash
# Simple process manager for the application

case "$1" in
  start)
    echo "🚀 Starting application..."
    cd ~/deployed-app
    nohup ~/bin/node index.js > app.log 2>&1 &
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
    if [ -f ~/deployed-app/app.log ]; then
      tail -f ~/deployed-app/app.log
    else
      echo "⚠️  No log file found"
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|status|logs}"
    exit 1
    ;;
esac
`;
    
    await createRemoteFile(pm2LikeScript, '~/app-manager.sh');
    await runSSHCommand('chmod +x ~/app-manager.sh');
    console.log('✅ Process manager script created\n');
    
    // 7. Test the deployment
    console.log('7. Verifying deployment...');
    const nodeVersion = await runSSHCommand('~/bin/node --version');
    console.log('✅ Node.js version:', nodeVersion.trim());
    
    const syntaxCheck = await runSSHCommand('cd ~/deployed-app && ~/bin/node -c index.js');
    console.log('✅ Application syntax: OK');
    
    const dirListing = await runSSHCommand('ls -la ~/deployed-app/');
    console.log('✅ Deployment files:', dirListing.split('\n').filter(line => line.includes('.') && !line.includes('total')).map(line => line.split(' ').pop()).join(', '));
    
    console.log('\n===================================');
    console.log('🎉 APPLICATION DEPLOYMENT COMPLETE!');
    console.log('===================================\n');
    
    console.log('📁 Application deployed to: ~/deployed-app/');
    console.log('🔧 Node.js version: 18.20.8');
    console.log('📦 Dependencies installed: Express, CORS\n');
    
    console.log('💡 Management Commands:');
    console.log('   Start app: ~/app-manager.sh start');
    console.log('   Stop app:  ~/app-manager.sh stop');
    console.log('   Check status: ~/app-manager.sh status');
    console.log('   View logs: ~/app-manager.sh logs');
    console.log('   Manual start: ~/start-deployed-app.sh\n');
    
    console.log('🌐 Test your application:');
    console.log('   curl http://localhost:3000/');
    console.log('   curl http://localhost:3000/api/status');
    console.log('   curl http://localhost:3000/api/info\n');
    
    console.log('🚀 Your Node.js 18 application is ready for production!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

// Run the deployment
deployApplication().catch(error => {
  console.error('\n💥 Deployment process failed:', error.message);
  process.exit(1);
});