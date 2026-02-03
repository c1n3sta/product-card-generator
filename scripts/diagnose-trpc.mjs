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

async function diagnoseTRPC() {
  console.log('🔍 Diagnosing tRPC API Issues\n');
  console.log('===============================\n');
  
  try {
    // 1. Check if Node.js server is running
    console.log('1. Checking if Node.js server is running...');
    const processList = await runSSHCommand('ps aux | grep node');
    const nodeProcesses = processList.split('\n').filter(line => line.includes('node') && !line.includes('grep'));
    
    if (nodeProcesses.length > 0) {
      console.log('✅ Node.js processes found:');
      nodeProcesses.forEach(proc => console.log('   ', proc.trim()));
    } else {
      console.log('❌ No Node.js processes found');
    }
    console.log('');
    
    // 2. Check if the app directory exists
    console.log('2. Checking application directory...');
    try {
      const dirCheck = await runSSHCommand('ls -la ~/my-node-app/');
      console.log('✅ Application directory exists:');
      console.log(dirCheck);
    } catch (error) {
      console.log('❌ Application directory not found');
    }
    console.log('');
    
    // 3. Check package.json
    console.log('3. Checking package.json...');
    try {
      const packageJson = await runSSHCommand('cat ~/my-node-app/package.json');
      console.log('📄 package.json contents:');
      console.log(packageJson);
    } catch (error) {
      console.log('❌ Could not read package.json');
    }
    console.log('');
    
    // 4. Test basic Node.js functionality
    console.log('4. Testing Node.js 18 functionality...');
    const nodeVersion = await runSSHCommand('~/bin/node --version');
    console.log('✅ Node.js version:', nodeVersion.trim());
    
    // Test a simple script
    const testResult = await runSSHCommand('~/bin/node -e "console.log(\'Node.js working: \' + process.version)"');
    console.log('✅ Basic Node.js test:', testResult.trim());
    console.log('');
    
    // 5. Check if we can create and run a simple tRPC-like server
    console.log('5. Testing tRPC endpoint simulation...');
    const testServer = `
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/api/trpc/auth.me') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result: { data: { user: { id: 'test-user', name: 'Test User' } } } }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(3001, () => {
  console.log('Test server running on port 3001');
});
`;
    
    // Save and run test server
    await runSSHCommand('echo \'' + testServer.replace(/'/g, "'\"'\"'") + '\' > ~/test-trpc-server.js');
    
    console.log('✅ Created test server script');
    
    // Try to start the test server
    try {
      const serverStart = await runSSHCommand('timeout 5 ~/bin/node ~/test-trpc-server.js || true');
      console.log('✅ Test server output:', serverStart.trim() || 'Server started');
    } catch (error) {
      console.log('⚠️  Test server had issues:', error.message);
    }
    
    console.log('\n===============================');
    console.log('📋 DIAGNOSIS COMPLETE');
    console.log('===============================\n');
    
    console.log('💡 Next steps to fix tRPC issues:');
    console.log('1. Ensure your main application server is running');
    console.log('2. Verify the tRPC middleware is properly configured');
    console.log('3. Check that "/api/trpc" endpoint is accessible');
    console.log('4. Confirm client-side baseURL configuration matches server');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

// Run diagnosis
diagnoseTRPC().catch(error => {
  console.error('\n💥 Diagnosis failed:', error.message);
  process.exit(1);
});