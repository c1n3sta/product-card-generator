#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testSSHConnection() {
  console.log('🔍 Testing SSH Connection...\n');
  
  const CONFIG = {
    sshHost: 'server193.hosting.reg.ru',
    sshUser: 'u3155554',
    sshPassword: 'CeZPr42z5WVara15'
  };
  
  try {
    // Set environment variables
    process.env.SSH_USER = CONFIG.sshUser;
    process.env.SSH_PASS = CONFIG.sshPassword;
    
    // Test basic SSH connection with a simple command
    const testCommand = `cmd.exe /c ""C:\\Program Files\\SshRunAs\\SshRunAs.exe" -s ${CONFIG.sshHost} -u SSH_USER -p SSH_PASS -c "echo 'SSH Connection Successful'" -P 22 -v 1"`;
    
    console.log('📡 Testing SSH connection...');
    const { stdout, stderr } = await execAsync(testCommand);
    
    console.log('✅ SSH Connection Test Results:');
    console.log('STDOUT:', stdout);
    if (stderr) {
      console.log('STDERR:', stderr);
    }
    
    // Clean up environment variables
    delete process.env.SSH_USER;
    delete process.env.SSH_PASS;
    
    console.log('\n🎉 SSH connection is working!');
    
  } catch (error) {
    console.error('❌ SSH Connection Test Failed:');
    console.error('Error:', error.message);
    
    // Clean up environment variables on error too
    delete process.env.SSH_USER;
    delete process.env.SSH_PASS;
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Verify credentials are correct');
    console.log('2. Check if SshRunAs.exe is properly installed');
    console.log('3. Try manual SSH connection: ssh u3155554@server193.hosting.reg.ru');
  }
}

// Run the test
testSSHConnection();