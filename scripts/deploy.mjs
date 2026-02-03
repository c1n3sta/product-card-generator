import { createReadStream, createWriteStream } from 'fs';
import { readdir, stat, readFile, writeFile } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ftp from 'basic-ftp';
const { Client } = ftp;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FTP configuration from .env file
const FTP_CONFIG = {
  host: '31.31.196.172',
  port: 21,
  user: 'u3155554_product-card-generator',
  password: 'jI6sF1yZ3mgW8yA8',
  path: './'
};

async function deleteRemoteFile(client, remotePath) {
  try {
    await client.remove(remotePath);
    console.log(`🗑️  Deleted: ${remotePath}`);
    return true;
  } catch (error) {
    // File might not exist, which is fine
    return true;
  }
}

async function uploadFileViaFTP(localPath, remotePath) {
  let client;
  
  try {
    console.log(`Uploading ${localPath} to ${remotePath}`);
    
    // Create FTP client
    client = new Client();
    client.ftp.verbose = true;
    
    // Connect to FTP server
    await client.access({
      host: FTP_CONFIG.host,
      port: FTP_CONFIG.port,
      user: FTP_CONFIG.user,
      password: FTP_CONFIG.password,
      secure: false
    });
    
    console.log('✅ Connected to FTP server');
    
    // Delete existing file first
    await deleteRemoteFile(client, remotePath);
    
    // Ensure remote directory exists
    const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'));
    if (remoteDir && remoteDir !== '/' && remoteDir !== '.') {
      try {
        // Split path and create each directory
        const dirs = remoteDir.split('/').filter(dir => dir);
        let currentPath = '';
        
        for (const dir of dirs) {
          currentPath = currentPath ? `${currentPath}/${dir}` : dir;
          try {
            await client.send(`MKD ${currentPath}`);
            console.log(`📁 Created directory: ${currentPath}`);
          } catch (mkdError) {
            // Directory might already exist, which is fine
            if (!mkdError.message.includes('File exists')) {
              console.log(`⚠️  Could not create directory ${currentPath}:`, mkdError.message);
            }
          }
        }
        
        // Change to the target directory
        await client.cd(remoteDir);
        console.log(`✅ Changed to directory: ${remoteDir}`);
      } catch (dirError) {
        console.log(`⚠️  Could not ensure directory ${remoteDir}:`, dirError.message);
      }
    }
    
    // Upload file (use just filename since we're in the correct directory)
    const fileName = remotePath.split('/').pop();
    await client.uploadFrom(localPath, fileName);
    console.log(`✅ Uploaded: ${remotePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to upload ${localPath}:`, error.message);
    return false;
  } finally {
    if (client) {
      client.close();
    }
  }
}

async function deployDirectory(localDir, remoteBasePath = '') {
  try {
    const files = await readdir(localDir, { withFileTypes: true });
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      const localPath = join(localDir, file.name);
      const remotePath = remoteBasePath ? `${remoteBasePath}/${file.name}` : file.name;

      if (file.isDirectory()) {
        // Recursively deploy subdirectories
        const subdirResult = await deployDirectory(localPath, remotePath);
        successCount += subdirResult.success;
        failCount += subdirResult.failed;
      } else {
        // Upload file
        const success = await uploadFileViaFTP(localPath, remotePath);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    return { success: successCount, failed: failCount };
  } catch (error) {
    console.error(`Error reading directory ${localDir}:`, error.message);
    return { success: 0, failed: 1 };
  }
}

async function main() {
  console.log('🚀 Starting FTP deployment...');
  console.log(`FTP Server: ${FTP_CONFIG.host}:${FTP_CONFIG.port}`);
  console.log(`Username: ${FTP_CONFIG.user}`);
  console.log(`Remote Path: ${FTP_CONFIG.path}`);
  
  // Deploy the dist/public directory (frontend files)
  console.log('\n📦 Deploying frontend files (dist/public)...');
  const publicResult = await deployDirectory(
    join(__dirname, '..', 'dist', 'public'), 
    FTP_CONFIG.path
  );
  
  // Deploy the server file
  console.log('\n🔧 Deploying server file (dist/index.js)...');
  const serverSuccess = await uploadFileViaFTP(
    join(__dirname, '..', 'dist', 'index.js'),
    `${FTP_CONFIG.path}/index.js`
  );
  
  console.log('\n📊 Deployment Summary:');
  console.log(`✅ Successful uploads: ${publicResult.success + (serverSuccess ? 1 : 0)}`);
  console.log(`❌ Failed uploads: ${publicResult.failed + (serverSuccess ? 0 : 1)}`);
  
  if (publicResult.failed === 0 && serverSuccess) {
    console.log('\n🎉 Deployment completed successfully!');
    console.log('🔗 Application should now be accessible at your hosting URL');
  } else {
    console.log('\n⚠️  Deployment completed with some errors');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});