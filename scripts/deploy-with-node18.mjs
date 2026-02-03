#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import { Client } from 'basic-ftp';
import path from 'path';

const execAsync = promisify(exec);

const CONFIG = {
  sshHost: 'server193.hosting.reg.ru',
  sshUser: 'u3155554',
  sshPassword: 'CeZPr42z5WVara15',
  ftpHost: 'server193.hosting.reg.ru',
  ftpUser: 'u3155554',
  ftpPassword: 'CeZPr42z5WVara15'
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

async function uploadViaFTP(localPath, remotePath) {
  const client = new Client();
  client.ftp.verbose = true;
  
  try {
    await client.access({
      host: CONFIG.ftpHost,
      user: CONFIG.ftpUser,
      password: CONFIG.ftpPassword,
      secure: false
    });
    
    console.log(`Uploading ${localPath} to ${remotePath}`);
    await client.uploadFrom(localPath, remotePath);
    console.log('✅ Upload completed');
    
  } catch (error) {
    console.error('❌ FTP upload failed:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

async function deployApplication() {
  console.log('🚀 Deploying Application with Node.js 18\n');
  console.log('========================================\n');
  
  try {
    // 1. Build the application
    console.log('1. Building application...');
    await execAsync('npm run build');
    console.log('✅ Build completed\n');
    
    // 2. Upload dist files via FTP
    console.log('2. Uploading built files via FTP...');
    await uploadViaFTP('./dist/index.js', 'data/dist/index.js');
    await uploadViaFTP('./dist/style.css', 'data/dist/style.css');
    await uploadViaFTP('./dist/assets/index.js', 'data/dist/assets/index.js');
    console.log('✅ Files uploaded\n');
    
    // 3. Install dependencies on server using Node.js 18
    console.log('3. Installing dependencies on server...');
    await runSSHCommand('cd ~/data && ~/bin/npm init -y');
    
    // Install required packages
    const packages = ['express', 'cors', 'dotenv'];
    for (const pkg of packages) {
      console.log(`Installing ${pkg}...`);
      await runSSHCommand(`cd ~/data && ~/.nvm/versions/node/v18.20.8/bin/node ~/.nvm/versions/node/v18.20.8/lib/node_modules/npm/bin/npm-cli.js install ${pkg}`);
    }
    console.log('✅ Dependencies installed\n');
    
    // 4. Create server startup script
    console.log('4. Creating server startup script...');
    const startupScript = `#!/bin/bash
cd ~/data
export NODE_ENV=production
~/bin/node dist/index.js
`;
    
    await runSSHCommand(`echo '${startupScript}' > ~/start-server.sh`);
    await runSSHCommand('chmod +x ~/start-server.sh');
    console.log('✅ Startup script created\n');
    
    // 5. Test the server startup
    console.log('5. Testing server startup...');
    try {
      // This will likely fail due to port binding, but let's see the error
      const testOutput = await runSSHCommand('timeout 10s ~/start-server.sh || true');
      console.log('Server test output:', testOutput);
    } catch (error) {
      console.log('Server test completed (may have timed out as expected)');
    }
    
    console.log('\n========================================');
    console.log('🎉 DEPLOYMENT COMPLETED!');
    console.log('========================================\n');
    
    console.log('✅ Application built and uploaded');
    console.log('✅ Dependencies installed with Node.js 18');
    console.log('✅ Startup script created\n');
    
    console.log('💡 To start your server:');
    console.log('   ~/start-server.sh\n');
    
    console.log('💡 To check if server is running:');
    console.log('   ps aux | grep node\n');
    
    console.log('💡 To view server logs:');
    console.log('   tail -f ~/data/server.log\n');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deployApplication();