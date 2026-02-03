#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// Database configuration
const SSH_CONFIG = {
  host: '31.31.196.172',
  user: 'u3155554',
  password: 'CeZPr42z5WVara15'
};

async function runRemoteDatabaseSetup() {
  console.log('🚀 Starting remote database setup via SSH...');
  console.log(`Host: ${SSH_CONFIG.host}`);
  console.log(`User: ${SSH_CONFIG.user}`);
  
  try {
    // Read the SQL setup file
    const sqlFilePath = join(process.cwd(), 'database', 'setup.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute remotely`);
    
    // Create SSH connection and execute MySQL commands
    const ssh = spawn('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      `${SSH_CONFIG.user}@${SSH_CONFIG.host}`
    ]);
    
    let output = '';
    let errorOutput = '';
    
    ssh.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ssh.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    ssh.on('close', (code) => {
      console.log('SSH connection closed with code:', code);
      if (output) console.log('Output:', output);
      if (errorOutput) console.log('Errors:', errorOutput);
    });
    
    // Send MySQL commands through SSH
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Send the MySQL command
        const mysqlCommand = `mysql -u ${SSH_CONFIG.user} -p'${SSH_CONFIG.password}' -e "${statement.replace(/"/g, '\\"')}";\n`;
        ssh.stdin.write(mysqlCommand);
        
        // Wait a bit between commands
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Close the SSH connection
    ssh.stdin.end();
    
    console.log('\n🎉 Remote database setup initiated!');
    console.log('✅ SQL commands sent to server');
    console.log('✅ Check server output above for results');
    
  } catch (error) {
    console.error('💥 Remote database setup failed:', error.message);
    process.exit(1);
  }
}

// Alternative: Simple SSH command execution
async function runSimpleSSHSetup() {
  console.log('🚀 Running simple SSH database setup...');
  
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    // Read and prepare SQL content
    const sqlFilePath = join(process.cwd(), 'database', 'setup.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf8');
    
    // Escape the SQL content for shell execution
    const escapedSQL = sqlContent
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');
    
    // Execute via SSH with heredoc
    const command = `ssh -o StrictHostKeyChecking=no ${SSH_CONFIG.user}@${SSH_CONFIG.host} "mysql -u ${SSH_CONFIG.user} -p'${SSH_CONFIG.password}' << 'EOF'\n${escapedSQL}\nEOF"`;
    
    console.log('Executing database setup...');
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) console.log('Output:', stdout);
    if (stderr) console.log('Errors:', stderr);
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('💥 Database setup failed:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
  }
}

// Run the simple setup (more reliable)
runSimpleSSHSetup();