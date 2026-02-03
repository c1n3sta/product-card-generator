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

async function fixNVMPath() {
  console.log('🔧 Fixing NVM PATH configuration...\n');
  
  try {
    // Check existing shell profiles
    console.log('1. Checking existing shell profiles...');
    const bashrcExists = await runSSHCommand('[ -f ~/.bashrc ] && echo "bashrc exists" || echo "bashrc not found"');
    console.log('   .bashrc:', bashrcExists.trim());
    
    const bashProfileExists = await runSSHCommand('[ -f ~/.bash_profile ] && echo "bash_profile exists" || echo "bash_profile not found"');
    console.log('   .bash_profile:', bashProfileExists.trim());
    
    const profileExists = await runSSHCommand('[ -f ~/.profile ] && echo "profile exists" || echo "profile not found"');
    console.log('   .profile:', profileExists.trim());
    
    // Add NVM sourcing to .bashrc
    console.log('\n2. Adding NVM sourcing to .bashrc...');
    const nvmSourceLine = 'export NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"';
    
    // Append to .bashrc
    await runSSHCommand(`echo '${nvmSourceLine}' >> ~/.bashrc`);
    console.log('   Added NVM sourcing to .bashrc');
    
    // Also add to .profile for login shells
    console.log('\n3. Adding NVM sourcing to .profile...');
    await runSSHCommand(`echo '${nvmSourceLine}' >> ~/.profile`);
    console.log('   Added NVM sourcing to .profile');
    
    // Source the profiles in current session
    console.log('\n4. Sourcing profiles in current session...');
    await runSSHCommand('source ~/.bashrc');
    await runSSHCommand('source ~/.profile');
    
    // Test if node version is now correct
    console.log('\n5. Testing node version after PATH fix...');
    try {
      // This might not work in the same SSH session, but let's try
      const testVersion = await runSSHCommand('export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && node --version');
      console.log('   Node version in sourced session:', testVersion.trim());
    } catch (error) {
      console.log('   Could not test in current session (expected)');
    }
    
    // Create a test script that sources NVM and runs node
    console.log('\n6. Creating persistent node wrapper script...');
    const wrapperScript = `#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"
node "$@"
`;
    
    await runSSHCommand(`echo '${wrapperScript}' > ~/node-wrapper.sh`);
    await runSSHCommand('chmod +x ~/node-wrapper.sh');
    console.log('   Created node wrapper script at ~/node-wrapper.sh');
    
    // Test the wrapper
    console.log('\n7. Testing node wrapper script...');
    const wrapperTest = await runSSHCommand('~/node-wrapper.sh --version');
    console.log('   Wrapper script node version:', wrapperTest.trim());
    
    console.log('\n✅ NVM PATH configuration fixed!');
    console.log('💡 To use Node.js 18 in future SSH sessions:');
    console.log('   1. Run: source ~/.bashrc');
    console.log('   2. Or use the wrapper: ~/node-wrapper.sh --version');
    console.log('   3. Or run: export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && node --version');
    
  } catch (error) {
    console.error('❌ Failed to fix NVM PATH:', error.message);
  }
}

fixNVMPath();