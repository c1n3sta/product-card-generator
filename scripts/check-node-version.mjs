import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkNodeVersion() {
    try {
        console.log('🔍 Checking current Node.js version on server...');
        
        const command = `"C:\\Program Files\\SshRunAs\\SshRunAs.exe" -u u3155554 -p CeZPr42z5WVara15 server193.hosting.reg.ru "node --version"`;
        
        const { stdout, stderr } = await execAsync(command);
        
        console.log('Current Node.js version:', stdout.trim());
        if (stderr) {
            console.log('Stderr:', stderr);
        }
        
        return stdout.trim();
    } catch (error) {
        console.error('❌ Error checking Node.js version:', error.message);
        return null;
    }
}

// Run the check
checkNodeVersion();