#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Correct SSH and Database configuration
const CONFIG = {
  sshHost: 'server193.hosting.reg.ru',
  sshUser: 'u3155554',
  sshPassword: 'eO2aV5sJ7ftF4sP6',  // Correct password as specified
  dbUser: 'u3155554_product-card-user',
  dbPassword: 'eO2aV5sJ7ftF4sP6',  // Same as SSH password
  dbName: 'u3155554_product-card-generator'
};

const DATABASE_SETUP_SQL = `
-- Product Card Generator Database Setup
-- Using correct password: eO2aV5sJ7ftF4sP6

CREATE DATABASE IF NOT EXISTS \`${CONFIG.dbName}\`;
USE \`${CONFIG.dbName}\`;

-- Users table
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) UNIQUE NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
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

-- Processing jobs table
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

-- Insert default user
INSERT IGNORE INTO \`users\` (\`id\`, \`name\`, \`email\`) VALUES 
('local-user', 'Local User', 'user@example.com');

-- Create indexes
CREATE INDEX idx_products_user_id ON \`products\`(\`user_id\`);
CREATE INDEX idx_processing_jobs_product_id ON \`processing_jobs\`(\`product_id\`);
CREATE INDEX idx_processing_jobs_status ON \`processing_jobs\`(\`status\`);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON \`${CONFIG.dbName}\`.* TO '${CONFIG.dbUser}'@'%';
FLUSH PRIVILEGES;

SELECT '✅ Database setup completed successfully with correct password!' AS message;
`;

async function runAutonomousDatabaseSetup() {
  console.log('🚀 Starting AUTONOMOUS database setup via SSH...');
  console.log('🔐 Using CORRECT password: eO2aV5sJ7ftF4sP6');
  console.log(`🖥️  SSH Host: ${CONFIG.sshHost}`);
  console.log(`👤 SSH User: ${CONFIG.sshUser}`);
  console.log(`🗄️  Database: ${CONFIG.dbName}`);
  console.log(`👨‍💼 DB User: ${CONFIG.dbUser}`);
  
  try {
    // Create temporary SQL file
    const fs = await import('fs/promises');
    const path = await import('path');
    const tempSqlFile = path.join(process.cwd(), 'correct_setup.sql');
    await fs.writeFile(tempSqlFile, DATABASE_SETUP_SQL);
    
    console.log('\n📋 Uploading SQL file with correct password...');
    
    // Upload SQL file via SCP (using correct password)
    const scpCommand = `echo "${CONFIG.sshPassword}" | scp -o StrictHostKeyChecking=no "${tempSqlFile}" ${CONFIG.sshUser}@${CONFIG.sshHost}:/tmp/correct_setup.sql`;
    await execAsync(scpCommand);
    
    console.log('📤 Executing database setup with correct credentials...');
    
    // Execute SQL via SSH (using correct password)
    const sshCommand = `echo "${CONFIG.sshPassword}" | ssh -o StrictHostKeyChecking=no ${CONFIG.sshUser}@${CONFIG.sshHost} "mysql -u ${CONFIG.dbUser} -p${CONFIG.dbPassword} < /tmp/correct_setup.sql && rm /tmp/correct_setup.sql"`;
    const { stdout, stderr } = await execAsync(sshCommand);
    
    // Cleanup
    await fs.unlink(tempSqlFile);
    
    if (stderr) {
      console.log('⚠️  STDERR (may be warnings):', stderr);
    }
    
    console.log('📋 STDOUT:', stdout || 'Setup completed successfully');
    
    console.log('\n🎉 AUTONOMOUS DATABASE SETUP COMPLETED!');
    console.log('✅ Database created:', CONFIG.dbName);
    console.log('✅ Tables created: users, products, processing_jobs');
    console.log('✅ Default user inserted');
    console.log('✅ Permissions granted');
    console.log('✅ ALL WITH CORRECT PASSWORD eO2aV5sJ7ftF4sP6');
    
  } catch (error) {
    console.error('💥 Autonomous database setup FAILED:', error.message);
    console.error('🔧 Please verify the password is correct and SSH access works');
    process.exit(1);
  }
}

// Execute autonomous setup with correct password
runAutonomousDatabaseSetup();