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

async function uploadFile(localPath, remotePath) {
  try {
    const content = fs.readFileSync(localPath, 'utf8');
    const escapedContent = content.replace(/'/g, "'\"'\"'");
    
    // Split into chunks to avoid command length limits
    const chunkSize = 500;
    const chunks = [];
    for (let i = 0; i < escapedContent.length; i += chunkSize) {
      chunks.push(escapedContent.slice(i, i + chunkSize));
    }
    
    // Create/clear the remote file
    await runSSHCommand(`echo -n '' > ${remotePath}`);
    
    // Upload chunks
    for (let i = 0; i < chunks.length; i++) {
      await runSSHCommand(`echo -n '${chunks[i]}' >> ${remotePath}`);
    }
    
    console.log(`✅ Uploaded: ${localPath} -> ${remotePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to upload ${localPath}:`, error.message);
    return false;
  }
}

async function deployProductionApp() {
  console.log('🚀 Production Deployment of Product Card Generator\n');
  console.log('=====================================================\n');
  
  try {
    // 1. Verify build files exist
    console.log('1. Verifying build files...');
    const requiredFiles = [
      'dist/index.js',
      'dist/public/index.html',
      'dist/public/assets/index-B9g_J8cL.js',
      'dist/public/assets/index-CmS40OxR.css'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Missing required file: ${file}`);
      }
      console.log(`✅ Found: ${file}`);
    }
    console.log('');
    
    // 2. Create deployment directory structure
    console.log('2. Creating deployment directory structure...');
    await runSSHCommand('mkdir -p ~/product-card-app/{dist,dist/public,dist/public/assets}');
    console.log('✅ Directory structure created\n');
    
    // 3. Upload server files
    console.log('3. Uploading server files...');
    await uploadFile('dist/index.js', '~/product-card-app/dist/index.js');
    await uploadFile('dist/package.json', '~/product-card-app/dist/package.json');
    console.log('');
    
    // 4. Upload frontend files
    console.log('4. Uploading frontend files...');
    await uploadFile('dist/public/index.html', '~/product-card-app/dist/public/index.html');
    
    // Check if asset files exist and upload them
    const assetDir = 'dist/public/assets';
    if (fs.existsSync(assetDir)) {
      const assets = fs.readdirSync(assetDir);
      for (const asset of assets) {
        if (asset.endsWith('.js') || asset.endsWith('.css')) {
          await uploadFile(path.join(assetDir, asset), `~/product-card-app/dist/public/assets/${asset}`);
        }
      }
    }
    console.log('');
    
    // 5. Create production package.json
    console.log('5. Creating production package.json...');
    const prodPackageJson = {
      "name": "product-card-generator",
      "version": "1.0.0",
      "main": "dist/index.js",
      "scripts": {
        "start": "node dist/index.js",
        "serve": "node dist/index.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "dotenv": "^16.0.3"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };
    
    await runSSHCommand(`echo '${JSON.stringify(prodPackageJson, null, 2)}' > ~/product-card-app/package.json`);
    console.log('✅ Production package.json created\n');
    
    // 6. Install dependencies
    console.log('6. Installing production dependencies...');
    try {
      const installCmd = 'cd ~/product-card-app && ~/.nvm/versions/node/v18.20.8/bin/node ~/.nvm/versions/node/v18.20.8/lib/node_modules/npm/bin/npm-cli.js install --production';
      const installOutput = await runSSHCommand(installCmd);
      console.log('✅ Dependencies installed');
      if (installOutput.trim()) {
        console.log('📦 Output:', installOutput.trim().substring(0, 100) + '...');
      }
    } catch (error) {
      console.log('⚠️  Dependency installation reported issues, but continuing...');
    }
    console.log('');
    
    // 7. Create startup script
    console.log('7. Creating startup scripts...');
    const startupScript = `#!/bin/bash
cd ~/product-card-app
export NODE_ENV=production
export PORT=3000
echo "🚀 Starting Product Card Generator..."
~/bin/node dist/index.js
`;
    
    await runSSHCommand(`echo '${startupScript}' > ~/start-product-card.sh`);
    await runSSHCommand('chmod +x ~/start-product-card.sh');
    
    // Create process manager script
    const pmScript = `#!/bin/bash
case "$1" in
  start)
    echo "🚀 Starting application..."
    cd ~/product-card-app
    nohup ~/bin/node dist/index.js > app.log 2>&1 &
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
esac
`;
    
    await runSSHCommand(`echo '${pmScript}' > ~/app-manager.sh`);
    await runSSHCommand('chmod +x ~/app-manager.sh');
    console.log('✅ Startup and management scripts created\n');
    
    // 8. Test the deployment
    console.log('8. Testing deployment...');
    const nodeVersion = await runSSHCommand('~/bin/node --version');
    console.log('✅ Node.js version:', nodeVersion.trim());
    
    const syntaxCheck = await runSSHCommand('cd ~/product-card-app && ~/bin/node -c dist/index.js');
    console.log('✅ Server code syntax: OK');
    
    const fileList = await runSSHCommand('ls -la ~/product-card-app/');
    console.log('✅ Deployment structure:');
    fileList.split('\n')
      .filter(line => line.includes('.') && !line.includes('total'))
      .forEach(line => console.log('   ', line.trim()));
    
    console.log('\n=====================================================');
    console.log('🎉 PRODUCTION DEPLOYMENT COMPLETE!');
    console.log('=====================================================\n');
    
    console.log('📁 Application deployed to: ~/product-card-app/');
    console.log('🔧 Node.js version: 18.20.8');
    console.log('🌐 Access URL: http://print-lab-spb.ru:3000/\n');
    
    console.log('💡 Management Commands:');
    console.log('   Start app: ~/app-manager.sh start');
    console.log('   Stop app:  ~/app-manager.sh stop');
    console.log('   Check status: ~/app-manager.sh status');
    console.log('   View logs: ~/app-manager.sh logs');
    console.log('   Manual start: ~/start-product-card.sh\n');
    
    console.log('💡 Test your deployment:');
    console.log('   curl http://localhost:3000/');
    console.log('   curl http://localhost:3000/api/trpc/auth.me?batch=1&input={"0":{"json":null}}\n');
    
    console.log('🚀 Your Product Card Generator is now deployed and ready!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

// Run the deployment
deployProductionApp().catch(error => {
  console.error('\n💥 Deployment process failed:', error.message);
  process.exit(1);
});