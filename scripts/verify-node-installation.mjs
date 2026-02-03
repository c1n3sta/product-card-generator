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

async function verifyNodeInstallation() {
  console.log('🔍 Verifying Node.js installation...\n');
  
  try {
    // Check current node version
    console.log('1. Current node version:');
    const currentVersion = await runSSHCommand('node --version');
    console.log('   ', currentVersion.trim());
    
    // Check if NVM is installed
    console.log('\n2. Checking NVM installation:');
    try {
      const nvmVersion = await runSSHCommand('export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm --version');
      console.log('   NVM version:', nvmVersion.trim());
    } catch (error) {
      console.log('   NVM not found or not properly sourced');
    }
    
    // Check available Node.js versions via NVM
    console.log('\n3. Available Node.js versions:');
    try {
      const availableVersions = await runSSHCommand('export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm list');
      console.log(availableVersions);
    } catch (error) {
      console.log('   Could not list Node.js versions');
    }
    
    // Check which version is currently used
    console.log('\n4. Currently used Node.js version:');
    try {
      const currentNVM = await runSSHCommand('export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm current');
      console.log('   ', currentNVM.trim());
    } catch (error) {
      console.log('   Could not determine current NVM version');
    }
    
    // Check PATH
    console.log('\n5. Current PATH:');
    const pathOutput = await runSSHCommand('echo $PATH');
    console.log('   ', pathOutput.trim());
    
    // Check if node is in PATH correctly
    console.log('\n6. Which node executable:');
    try {
      const whichNode = await runSSHCommand('which node');
      console.log('   ', whichNode.trim());
    } catch (error) {
      console.log('   node not found in PATH');
    }
    
    // Try to use NVM node directly
    console.log('\n7. Testing NVM node directly:');
    try {
      const nvmNodeVersion = await runSSHCommand('export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && ~/.nvm/versions/node/v18.20.8/bin/node --version');
      console.log('   NVM Node version:', nvmNodeVersion.trim());
    } catch (error) {
      console.log('   Could not run NVM node directly');
    }
    
  } catch (error) {
    console.error('Verification failed:', error.message);
  }
}

verifyNodeInstallation();