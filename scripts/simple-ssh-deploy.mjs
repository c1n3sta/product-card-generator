#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

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
    
    console.log(`Executing: ${command}`);
    const { stdout, stderr } = await execAsync(sshCommand);
    
    delete process.env.SSH_USER;
    delete process.env.SSH_PASS;
    
    if (stderr) {
      console.log('STDERR:', stderr);
    }
    
    return stdout || '';
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    throw error;
  }
}

async function simpleSShDeploy() {
  console.log('🚀 Simple SSH Deployment with Node.js 18\n');
  console.log('==========================================\n');
  
  try {
    // 1. Create app directory
    console.log('1. Creating app directory...');
    await runSSHCommand('mkdir -p ~/myapp');
    console.log('✅ Directory created\n');
    
    // 2. Create a simple package.json
    console.log('2. Creating package.json...');
    const packageJson = `{
  "name": "myapp",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}`;
    
    await runSSHCommand(`echo '${packageJson}' > ~/myapp/package.json`);
    console.log('✅ package.json created\n');
    
    // 3. Install dependencies using Node.js 18
    console.log('3. Installing dependencies...');
    try {
      await runSSHCommand('cd ~/myapp && ~/bin/npm install');
      console.log('✅ Dependencies installed\n');
    } catch (error) {
      console.log('⚠️  npm install had issues, continuing...\n');
    }
    
    // 4. Create a simple server
    console.log('4. Creating server.js...');
    const serverJs = `const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Node.js 18!',
    nodeVersion: process.version,
    status: 'success'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', nodeVersion: process.version });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;
    
    // Split the server code into chunks to avoid command length limits
    const serverChunks = [];
    const chunkSize = 500;
    for (let i = 0; i < serverJs.length; i += chunkSize) {
      serverChunks.push(serverJs.slice(i, i + chunkSize));
    }
    
    // Clear the file first
    await runSSHCommand('echo "" > ~/myapp/server.js');
    
    // Write chunks
    for (let i = 0; i < serverChunks.length; i++) {
      const chunk = serverChunks[i].replace(/'/g, "'\"'\"'");
      await runSSHCommand(`echo -n '${chunk}' >> ~/myapp/server.js`);
    }
    
    await runSSHCommand('chmod +x ~/myapp/server.js');
    console.log('✅ server.js created\n');
    
    // 5. Create startup script
    console.log('5. Creating startup script...');
    const startupScript = `#!/bin/bash
cd ~/myapp
export NODE_ENV=production
export PORT=3000
~/bin/node server.js
`;
    
    await runSSHCommand(`echo '${startupScript}' > ~/start-myapp.sh`);
    await runSSHCommand('chmod +x ~/start-myapp.sh');
    console.log('✅ Startup script created\n');
    
    // 6. Test Node.js 18
    console.log('6. Testing Node.js 18...');
    const testResult = await runSSHCommand('~/bin/node --version');
    console.log('   Node.js version:', testResult.trim());
    
    // Test the server code syntax
    await runSSHCommand('cd ~/myapp && ~/bin/node -c server.js');
    console.log('   Server code syntax: OK\n');
    
    console.log('==========================================');
    console.log('🎉 SIMPLE SSH DEPLOYMENT COMPLETED!');
    console.log('==========================================\n');
    
    console.log('✅ App directory created');
    console.log('✅ package.json created');
    console.log('✅ Dependencies processed');
    console.log('✅ server.js created');
    console.log('✅ Startup script ready\n');
    
    console.log('💡 To start your application:');
    console.log('   ~/start-myapp.sh\n');
    
    console.log('💡 To check if it\'s running:');
    console.log('   ps aux | grep node\n');
    
    console.log('💡 To test the API:');
    console.log('   curl http://localhost:3000/');
    console.log('   curl http://localhost:3000/health\n');
    
    console.log('🎉 Your Node.js 18 application is ready!');
    
  } catch (error) {
    console.error('❌ Simple SSH deployment failed:', error.message);
  }
}

simpleSShDeploy();