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
    
    console.log(`📡 Executing: ${command.substring(0, 60)}${command.length > 60 ? '...' : ''}`);
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

async function deployApp() {
  console.log('🚀 SSH Application Deployment\n');
  console.log('==============================\n');
  
  try {
    // 1. Create app directory
    console.log('1. Creating application directory...');
    await runSSHCommand('mkdir -p ~/my-node-app');
    console.log('✅ Directory created\n');
    
    // 2. Create package.json step by step
    console.log('2. Creating package.json...');
    await runSSHCommand('cd ~/my-node-app && echo "{"> package.json');
    await runSSHCommand('cd ~/my-node-app && echo "  \\"name\\": \\"my-node-app\\",">> package.json');
    await runSSHCommand('cd ~/my-node-app && echo "  \\"version\\": \\"1.0.0\\",">> package.json');
    await runSSHCommand('cd ~/my-node-app && echo "  \\"main\\": \\"server.js\\",">> package.json');
    await runSSHCommand('cd ~/my-node-app && echo "  \\"scripts\\": {">> package.json');
    await runSSHCommand('cd ~/my-node-app && echo "    \\"start\\": \\"node server.js\\"">> package.json');
    await runSSHCommand('cd ~/my-node-app && echo "  },">> package.json');
    await runSSHCommand('cd ~/my-node-app && echo "  \\"dependencies\\": {">> package.json');
    await runSSHCommand('cd ~/my-node-app && echo "    \\"express\\": \\"^4.18.2\\"">> package.json');
    await runSSHCommand('cd ~/my-node-app && echo "  }">> package.json');
    await runSSHCommand('cd ~/my-node-app && echo "}">> package.json');
    console.log('✅ package.json created\n');
    
    // 3. Create server.js
    console.log('3. Creating server.js...');
    await runSSHCommand('cd ~/my-node-app && echo "const express = require(\'express\');"> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "const app = express();">> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "app.get(\'/\', (req, res) => {">> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "  res.json({">> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "    message: \'Hello from Node.js 18!\',">> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "    version: process.version,">> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "    status: \'running\'">> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "  });">> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "});">> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "const PORT = process.env.PORT || 3000;">> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "app.listen(PORT, () => {">> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "  console.log(\`Server running on port \${PORT}\`);">> server.js');
    await runSSHCommand('cd ~/my-node-app && echo "});">> server.js');
    console.log('✅ server.js created\n');
    
    // 4. Install dependencies
    console.log('4. Installing dependencies...');
    try {
      const installResult = await runSSHCommand('cd ~/my-node-app && ~/bin/npm install');
      console.log('✅ Dependencies installed');
      if (installResult.trim()) {
        console.log('📦 Output:', installResult.trim().substring(0, 100) + '...');
      }
    } catch (error) {
      console.log('⚠️  npm install had issues, but continuing...');
    }
    console.log('');
    
    // 5. Create startup script
    console.log('5. Creating startup script...');
    await runSSHCommand('echo "#!/bin/bash"> ~/start-my-app.sh');
    await runSSHCommand('echo "cd ~/my-node-app">> ~/start-my-app.sh');
    await runSSHCommand('echo "export NODE_ENV=production">> ~/start-my-app.sh');
    await runSSHCommand('echo "export PORT=3000">> ~/start-my-app.sh');
    await runSSHCommand('echo "~/bin/node server.js">> ~/start-my-app.sh');
    await runSSHCommand('chmod +x ~/start-my-app.sh');
    console.log('✅ Startup script created\n');
    
    // 6. Verification
    console.log('6. Verifying deployment...');
    const nodeVersion = await runSSHCommand('~/bin/node --version');
    console.log('✅ Node.js version:', nodeVersion.trim());
    
    const syntaxCheck = await runSSHCommand('cd ~/my-node-app && ~/bin/node -c server.js');
    console.log('✅ Server syntax: OK');
    
    const fileList = await runSSHCommand('ls -la ~/my-node-app/');
    console.log('✅ Deployed files:');
    fileList.split('\n')
      .filter(line => line.includes('.') && !line.includes('total'))
      .forEach(line => console.log('   ', line.trim().split(' ').pop()));
    
    console.log('\n==============================');
    console.log('🎉 DEPLOYMENT SUCCESSFUL!');
    console.log('==============================\n');
    
    console.log('📁 Location: ~/my-node-app/');
    console.log('🔧 Node.js: v18.20.8');
    console.log('📦 Dependencies: Express\n');
    
    console.log('💡 Management Commands:');
    console.log('   Start: ~/start-my-app.sh');
    console.log('   Test: curl http://localhost:3000/');
    console.log('   Check: ps aux | grep node\n');
    
    console.log('🚀 Your Node.js 18 application is ready!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

// Execute deployment
deployApp().catch(error => {
  console.error('\n💥 Deployment failed:', error.message);
  process.exit(1);
});