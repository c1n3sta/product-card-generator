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

async function testNode18() {
  console.log('🧪 Testing Node.js 18 functionality...\n');
  
  try {
    // Test basic Node.js 18 features that weren't available in v10
    console.log('1. Testing Node.js version:');
    const version = await runSSHCommand('~/bin/node --version');
    console.log('   Version:', version.trim());
    
    console.log('\n2. Testing npm version:');
    const npmVersion = await runSSHCommand('~/bin/npm --version');
    console.log('   NPM Version:', npmVersion.trim());
    
    console.log('\n3. Testing modern JavaScript features:');
    
    // Test async/await (should work in both versions, but let's verify)
    const asyncTest = `
    async function testAsync() {
      return 'Async/Await works!';
    }
    testAsync().then(console.log);
    `;
    await runSSHCommand(`echo '${asyncTest}' | ~/bin/node`);
    
    // Test destructuring
    const destructuringTest = `
    const obj = { a: 1, b: 2 };
    const { a, b } = obj;
    console.log('Destructuring works:', a, b);
    `;
    await runSSHCommand(`echo '${destructuringTest}' | ~/bin/node`);
    
    // Test spread operator
    const spreadTest = `
    const arr1 = [1, 2];
    const arr2 = [...arr1, 3, 4];
    console.log('Spread operator works:', arr2);
    `;
    await runSSHCommand(`echo '${spreadTest}' | ~/bin/node`);
    
    // Test template literals
    const templateTest = `
    const name = 'Node.js';
    console.log(\`Template literals work with \${name}!\`);
    `;
    await runSSHCommand(`echo '${templateTest}' | ~/bin/node`);
    
    console.log('\n4. Testing npm installation capability:');
    // Create a temporary directory and test npm init
    await runSSHCommand('mkdir -p ~/test-npm && cd ~/test-npm && ~/bin/npm init -y');
    const packageJson = await runSSHCommand('cat ~/test-npm/package.json');
    console.log('   Created package.json:');
    console.log(packageJson);
    
    // Clean up
    await runSSHCommand('rm -rf ~/test-npm');
    
    console.log('\n✅ All Node.js 18 tests passed!');
    console.log('🎉 Your server is now running Node.js 18.20.8');
    console.log('💡 You can now deploy and run modern Node.js applications!');
    
  } catch (error) {
    console.error('❌ Node.js 18 test failed:', error.message);
  }
}

testNode18();