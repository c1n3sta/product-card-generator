import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('Testing PostgreSQL connection...');
  
  const pool = new Pool({
    host: process.env.DBaaS_HOST,
    port: parseInt(process.env.DBaaS_PORT || '5432'),
    user: process.env.DBaaS_USER,
    password: process.env.DBaaS_PASSWORD,
    database: process.env.DBaaS_DATABASE,
    ssl: process.env.DBaaS_SSL_CERT ? {
      ca: process.env.DBaaS_SSL_CERT
    } : false
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL Version:', result.rows[0].version);
    
    const dbResult = await client.query('SELECT current_database()');
    console.log('Connected Database:', dbResult.rows[0].current_database);
    
    client.release();
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await pool.end();
  }
}

testConnection();