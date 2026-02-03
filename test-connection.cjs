// Simple test script for PostgreSQL connection
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

console.log('Testing PostgreSQL connection...');

// Connect directly to our database
const pool = new Pool({
  host: envVars.DBaaS_HOST,
  port: parseInt(envVars.DBaaS_PORT),
  user: envVars.DBaaS_USER,
  password: envVars.DBaaS_PASSWORD,
  database: envVars.DBaaS_DATABASE,
  ssl: {
    rejectUnauthorized: false // Temporary workaround for certificate mismatch
  }
});

pool.connect()
  .then(async (client) => {
    console.log('✅ Connected to PostgreSQL successfully!');
    
    // Check if our database exists
    const dbCheck = await client.query(
      `SELECT datname FROM pg_database WHERE datname = $1`, 
      [envVars.DBaaS_DATABASE]
    );
    
    if (dbCheck.rows.length === 0) {
      console.log(`Database ${envVars.DBaaS_DATABASE} does not exist. Creating it...`);
      await client.query(`CREATE DATABASE ${envVars.DBaaS_DATABASE}`);
      console.log(`✅ Database ${envVars.DBaaS_DATABASE} created successfully!`);
    } else {
      console.log(`✅ Database ${envVars.DBaaS_DATABASE} already exists.`);
    }
    
    // Test connection to our database
    const testPool = new Pool({
      host: envVars.DBaaS_HOST,
      port: parseInt(envVars.DBaaS_PORT),
      user: envVars.DBaaS_USER,
      password: envVars.DBaaS_PASSWORD,
      database: envVars.DBaaS_DATABASE,
      ssl: {
        ca: fs.readFileSync(path.resolve(__dirname, envVars.DBaaS_SSL_CERT), 'utf8'),
        rejectUnauthorized: false
      }
    });
    
    const testClient = await testPool.connect();
    const result = await testClient.query('SELECT version(), current_database()');
    console.log('PostgreSQL Version:', result.rows[0].version);
    console.log('Connected Database:', result.rows[0].current_database);
    
    testClient.release();
    await testPool.end();
    
    return pool.end();
  })
  .catch(error => {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  });