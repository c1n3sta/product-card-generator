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

async function fixNPM() {
  console.log('🔧 Fixing NPM for Node.js 18...\n');
  
  try {
    // Check where npm is pointing
    console.log('1. Checking npm symlink target:');
    const npmLink = await runSSHCommand('ls -la ~/bin/npm');
    console.log('   ', npmLink.trim());
    
    // Check the full path npm
    console.log('\n2. Checking full path npm:');
    const fullPathNpm = await runSSHCommand('ls -la ~/.nvm/versions/node/v18.20.8/bin/npm');
    console.log('   ', fullPathNpm.trim());
    
    // Check NODE_PATH environment
    console.log('\n3. Checking NODE_PATH:');
    const nodePath = await runSSHCommand('echo $NODE_PATH');
    console.log('   ', nodePath.trim() || '(empty)');
    
    // Try to reinstall npm using the correct Node.js
    console.log('\n4. Reinstalling npm with correct Node.js:');
    await runSSHCommand('unset NODE_PATH && ~/.nvm/versions/node/v18.20.8/bin/node ~/.nvm/versions/node/v18.20.8/lib/node_modules/npm/bin/npm-cli.js install -g npm');
    
    // Test the fixed npm
    console.log('\n5. Testing fixed npm:');
    const npmVersion = await runSSHCommand('~/.nvm/versions/node/v18.20.8/bin/node ~/.nvm/versions/node/v18.20.8/lib/node_modules/npm/bin/npm-cli.js --version');
    console.log('   Fixed npm version:', npmVersion.trim());
    
    // Update the symlink
    console.log('\n6. Updating npm symlink:');
    await runSSHCommand('ln -sf ~/.nvm/versions/node/v18.20.8/lib/node_modules/npm/bin/npm-cli.js ~/bin/npm');
    
    // Test the symlinked npm
    console.log('\n7. Testing symlinked npm:');
    const symlinkNpm = await runSSHCommand('~/bin/npm --version');
    console.log('   Symlinked npm version:', symlinkNpm.trim());
    
    console.log('\n✅ NPM fixed for Node.js 18!');
    console.log('💡 NPM is now available via:');
    console.log('   - ~/bin/npm (symlink)');
    console.log('   - Full path: ~/.nvm/versions/node/v18.20.8/lib/node_modules/npm/bin/npm-cli.js');
    
  } catch (error) {
    console.error('❌ NPM fix failed:', error.message);
    
    // Alternative approach: create a wrapper script
    console.log('\n🔄 Creating npm wrapper script as alternative...');
    const npmWrapper = `#!/bin/bash
unset NODE_PATH
~/.nvm/versions/node/v18.20.8/bin/node ~/.nvm/versions/node/v18.20.8/lib/node_modules/npm/bin/npm-cli.js "$@"
`;
    
    await runSSHCommand(`echo '${npmWrapper}' > ~/npm-wrapper.sh`);
    await runSSHCommand('chmod +x ~/npm-wrapper.sh');
    
    // Test wrapper
    const wrapperTest = await runSSHCommand('~/npm-wrapper.sh --version');
    console.log('   NPM wrapper version:', wrapperTest.trim());
    
    console.log('\n✅ Created NPM wrapper script at ~/npm-wrapper.sh');
  }
}

fixNPM();