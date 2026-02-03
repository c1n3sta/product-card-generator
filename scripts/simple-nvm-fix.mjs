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

async function simpleNVMFix() {
  console.log('🔧 Applying simple NVM fix...\n');
  
  try {
    // Create symbolic links for node and npm in ~/bin
    console.log('1. Creating ~/bin directory if it doesnt exist...');
    await runSSHCommand('mkdir -p ~/bin');
    
    console.log('2. Creating symbolic links to Node.js 18...');
    await runSSHCommand('ln -sf ~/.nvm/versions/node/v18.20.8/bin/node ~/bin/node');
    await runSSHCommand('ln -sf ~/.nvm/versions/node/v18.20.8/bin/npm ~/bin/npm');
    await runSSHCommand('ln -sf ~/.nvm/versions/node/v18.20.8/bin/npx ~/bin/npx');
    
    console.log('3. Adding ~/bin to PATH in .bashrc...');
    await runSSHCommand('echo "export PATH=\"$HOME/bin:$PATH\"" >> ~/.bashrc');
    
    console.log('4. Adding ~/bin to PATH in .profile...');
    await runSSHCommand('echo "export PATH=\"$HOME/bin:$PATH\"" >> ~/.profile');
    
    console.log('5. Testing the setup...');
    // Test by running the full path command
    const directTest = await runSSHCommand('~/.nvm/versions/node/v18.20.8/bin/node --version');
    console.log('   Direct NVM node version:', directTest.trim());
    
    // Test the symlink
    const symlinkTest = await runSSHCommand('~/bin/node --version');
    console.log('   Symlink node version:', symlinkTest.trim());
    
    console.log('\n✅ Simple NVM fix applied!');
    console.log('💡 For future sessions, Node.js 18 should be available via:');
    console.log('   - ~/bin/node (symlink)');
    console.log('   - Full path: ~/.nvm/versions/node/v18.20.8/bin/node');
    console.log('   - After sourcing .bashrc: node --version');
    
  } catch (error) {
    console.error('❌ Simple NVM fix failed:', error.message);
  }
}

simpleNVMFix();