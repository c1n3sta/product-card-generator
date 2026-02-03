#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// SSH configuration
const CONFIG = {
  sshHost: 'server193.hosting.reg.ru',
  sshUser: 'u3155554',
  sshPassword: 'CeZPr42z5WVara15'
};

async function runSSHCommand(command) {
  try {
    // Set environment variables for SshRunAs
    process.env.SSH_USER = CONFIG.sshUser;
    process.env.SSH_PASS = CONFIG.sshPassword;
    
    const sshCommand = `"C:\\Program Files\\SshRunAs\\SshRunAs.exe" -s ${CONFIG.sshHost} -u SSH_USER -p SSH_PASS -c "${command}" -P 22 -v 1`;
    
    console.log(`Executing: ${command}`);
    const { stdout, stderr } = await execAsync(sshCommand);
    
    // Clean up environment variables
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

async function checkCurrentNodeVersion() {
  console.log('🔍 Checking current Node.js version...');
  try {
    const versionOutput = await runSSHCommand('node --version');
    console.log('Current Node.js version:', versionOutput.trim());
    return versionOutput.trim();
  } catch (error) {
    console.log('Could not determine current Node.js version');
    return null;
  }
}

async function upgradeNodeJS() {
  console.log('🚀 Starting Node.js upgrade to version 18...');
  
  try {
    // Check current version first
    const currentVersion = await checkCurrentNodeVersion();
    
    // Install NodeSource setup script for Node.js 18
    console.log('\n📥 Installing NodeSource setup script for Node.js 18...');
    await runSSHCommand('curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -');
    
    // Update package lists
    console.log('\n🔄 Updating package lists...');
    await runSSHCommand('sudo apt-get update');
    
    // Install Node.js 18
    console.log('\n📥 Installing Node.js 18...');
    await runSSHCommand('sudo apt-get install -y nodejs');
    
    // Verify installation
    console.log('\n✅ Verifying Node.js 18 installation...');
    const newVersion = await checkCurrentNodeVersion();
    
    if (newVersion && newVersion.includes('v18')) {
      console.log('\n🎉 Node.js upgrade successful!');
      console.log(`New version: ${newVersion}`);
      
      // Also check npm version
      console.log('\n📦 Checking npm version...');
      const npmVersion = await runSSHCommand('npm --version');
      console.log('NPM version:', npmVersion.trim());
      
      console.log('\n✨ Node.js 18 is now ready for your application!');
    } else {
      console.log('⚠️  Upgrade may not have completed successfully');
      console.log('Current version:', newVersion);
    }
    
  } catch (error) {
    console.error('💥 Node.js upgrade failed:', error.message);
    
    // Try alternative method using nvm
    console.log('\n🔄 Trying alternative method with NVM...');
    await tryNVMInstallation();
  }
}

async function tryNVMInstallation() {
  try {
    console.log('📥 Installing NVM (Node Version Manager)...');
    
    // Install NVM
    await runSSHCommand('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash');
    
    // Source NVM and install Node.js 18
    console.log('📥 Installing Node.js 18 via NVM...');
    await runSSHCommand('export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm install 18');
    
    // Set default version
    await runSSHCommand('export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use 18 && nvm alias default 18');
    
    // Verify
    const version = await checkCurrentNodeVersion();
    console.log('Node.js version after NVM installation:', version);
    
  } catch (nvmError) {
    console.error('❌ NVM installation also failed:', nvmError.message);
    console.log('\n💡 Manual steps you might need to take:');
    console.log('1. Log into your server via SSH manually');
    console.log('2. Run: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -');
    console.log('3. Run: sudo apt-get install -y nodejs');
    console.log('4. Or use NVM: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash');
    console.log('5. Then: nvm install 18 && nvm use 18');
  }
}

// Main execution
console.log('🔧 Node.js 18 Upgrade Tool');
console.log('==========================\n');

upgradeNodeJS();