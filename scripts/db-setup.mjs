import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration - try multiple approaches
const dbConfigs = [
  // Try DATABASE_URL first
  process.env.DATABASE_URL ? (() => {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      multipleStatements: true
    };
  })() : null,
  // Fallback to individual env vars
  {
    host: process.env.MySQL_HOST || 'localhost',
    port: process.env.MySQL_PORT || 3306,
    user: process.env.MySQL_USER || 'u3155554_default',
    password: process.env.MySQL_PASSWORD || 'X0F2W6ijqf7BS4L9',
    database: process.env.MySQL_DATABASE || 'u3155554_default',
    multipleStatements: true
  }
].filter(Boolean);

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🚀 Connecting to MySQL database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Read SQL file
    const sqlFilePath = join(__dirname, '../database/setup.sql');
    const sqlScript = readFileSync(sqlFilePath, 'utf8');
    
    console.log('📋 Executing database setup script...');
    
    // Execute the SQL script
    const [results] = await connection.query(sqlScript);
    
    console.log('✅ Database setup completed successfully!');
    console.log('📊 Results:', results);
    
    // Test the connection by querying the users table
    console.log('🧪 Testing database connection...');
    const [testResults] = await connection.execute('SELECT * FROM users LIMIT 5');
    console.log('✅ Database test successful. Sample users:', testResults);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Run the setup
setupDatabase();