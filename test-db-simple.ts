import { Pool } from 'pg'; // This should work with the installed pg module
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('Testing PostgreSQL connection...');
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL Version:', result.rows[0].version);
    
    const dbResult = await client.query('SELECT current_database()');
    console.log('Connected Database:', dbResult.rows[0].current_database);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();