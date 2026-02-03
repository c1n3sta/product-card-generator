#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// SSH and Database configuration
const CONFIG = {
  sshHost: 'server193.hosting.reg.ru',
  sshUser: 'u3155554',
  sshPassword: 'eO2aV5sJ7ftF4sP6',
  dbUser: 'u3155554_product-card-user',
  dbPassword: 'eO2aV5sJ7ftF4sP6',
  dbName: 'u3155554_product-card-generator'
};

const DATABASE_SQL = `
CREATE DATABASE IF NOT EXISTS \`${CONFIG.dbName}\`;
USE \`${CONFIG.dbName}\`;

CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) UNIQUE NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`price\` DECIMAL(10, 2),
  \`image_url\` TEXT,
  \`user_id\` VARCHAR(36),
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`processing_jobs\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`product_id\` VARCHAR(36),
  \`status\` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  \`progress\` INT DEFAULT 0,
  \`result_data\` JSON,
  \`error_message\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE
);

INSERT IGNORE INTO \`users\` (\`id\`, \`name\`, \`email\`) VALUES 
('local-user', 'Local User', 'user@example.com');

CREATE INDEX idx_products_user_id ON \`products\`(\`user_id\`);
CREATE INDEX idx_processing_jobs_product_id ON \`processing_jobs\`(\`product_id\`);
CREATE INDEX idx_processing_jobs_status ON \`processing_jobs\`(\`status\`);

GRANT SELECT, INSERT, UPDATE, DELETE ON \`${CONFIG.dbName}\`.* TO '${CONFIG.dbUser}'@'%';
FLUSH PRIVILEGES;

SELECT 'Database setup completed successfully!' AS message;
`;

async function runDatabaseSetupViaSSH() {
  console.log('🚀 Starting autonomous database setup via SSH...');
  console.log(`SSH Host: ${CONFIG.sshHost}`);
  console.log(`SSH User: ${CONFIG.sshUser}`);
  console.log(`Database: ${CONFIG.dbName}`);
  console.log(`DB User: ${CONFIG.dbUser}`);
  
  try {
    // Method 1: Direct SSH with SQL file
    console.log('\n📋 Method 1: Uploading SQL file and executing...');
    
    // Write SQL to temporary file
    const fs = await import('fs/promises');
    const path = await import('path');
    const tempSqlFile = path.join(process.cwd(), 'temp_setup.sql');
    await fs.writeFile(tempSqlFile, DATABASE_SQL);
    
    // SCP the SQL file to remote server using SSH config
    const scpCommand = `sshpass -p "${CONFIG.sshPassword}" scp -o StrictHostKeyChecking=no "${tempSqlFile}" ${CONFIG.sshUser}@${CONFIG.sshHost}:/tmp/temp_setup.sql 2>/dev/null || scp -o StrictHostKeyChecking=no "${tempSqlFile}" ${CONFIG.sshUser}@${CONFIG.sshHost}:/tmp/temp_setup.sql`;
    console.log('Uploading SQL file...');
    await execAsync(scpCommand);
    
    // Execute SQL file via SSH using SSH config
    const sshCommand = `sshpass -p "${CONFIG.sshPassword}" ssh -o StrictHostKeyChecking=no ${CONFIG.sshUser}@${CONFIG.sshHost} "mysql -u ${CONFIG.dbUser} -p${CONFIG.dbPassword} < /tmp/temp_setup.sql && rm /tmp/temp_setup.sql" 2>/dev/null || ssh -o StrictHostKeyChecking=no ${CONFIG.sshUser}@${CONFIG.sshHost} "mysql -u ${CONFIG.dbUser} -p${CONFIG.dbPassword} < /tmp/temp_setup.sql && rm /tmp/temp_setup.sql"`;
    console.log('Executing database setup...');
    const { stdout, stderr } = await execAsync(sshCommand);
    
    // Clean up local temp file
    await fs.unlink(tempSqlFile);
    
    if (stderr) {
      console.log('STDERR:', stderr);
    }
    
    console.log('STDOUT:', stdout || 'Setup completed successfully');
    console.log('\n🎉 Database setup completed via SSH!');
    console.log('✅ Database created:', CONFIG.dbName);
    console.log('✅ Tables created: users, products, processing_jobs');
    console.log('✅ Default user inserted');
    console.log('✅ Permissions granted');
    
  } catch (error) {
    console.error('💥 SSH database setup failed:', error.message);
    process.exit(1);
  }
}

// Execute the autonomous setup
runDatabaseSetupViaSSH();