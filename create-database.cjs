const { Client } = require('pg');
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

console.log('Creating database...');

// Connect to default postgres database first
const client = new Client({
  host: envVars.DBaaS_HOST,
  port: parseInt(envVars.DBaaS_PORT),
  user: envVars.DBaaS_USER,
  password: envVars.DBaaS_PASSWORD,
  database: 'postgres', // Connect to default database
  ssl: {
    rejectUnauthorized: false
  }
});

async function createDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');
    
    // Check if database exists
    const dbCheck = await client.query(
      `SELECT datname FROM pg_database WHERE datname = $1`, 
      [envVars.DBaaS_DATABASE]
    );
    
    if (dbCheck.rows.length === 0) {
      console.log(`Creating database ${envVars.DBaaS_DATABASE}...`);
      await client.query(`CREATE DATABASE ${envVars.DBaaS_DATABASE} WITH OWNER ${envVars.DBaaS_USER}`);
      console.log(`✅ Database ${envVars.DBaaS_DATABASE} created successfully!`);
    } else {
      console.log(`✅ Database ${envVars.DBaaS_DATABASE} already exists.`);
    }
    
    // Test connection to the new database
    const testClient = new Client({
      host: envVars.DBaaS_HOST,
      port: parseInt(envVars.DBaaS_PORT),
      user: envVars.DBaaS_USER,
      password: envVars.DBaaS_PASSWORD,
      database: envVars.DBaaS_DATABASE,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    await testClient.connect();
    const result = await testClient.query('SELECT version(), current_database()');
    console.log('PostgreSQL Version:', result.rows[0].version);
    console.log('Connected Database:', result.rows[0].current_database);
    await testClient.end();
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    
    // Try alternative approach - maybe the user has different permissions
    if (error.code === '42501' || error.message.includes('permission denied')) {
      console.log('\n🔧 Trying alternative approach...');
      try {
        // Connect directly to the target database (might already exist)
        const directClient = new Client({
          host: envVars.DBaaS_HOST,
          port: parseInt(envVars.DBaaS_PORT),
          user: envVars.DBaaS_USER,
          password: envVars.DBaaS_PASSWORD,
          database: envVars.DBaaS_DATABASE,
          ssl: {
            rejectUnauthorized: false
          }
        });
        
        await directClient.connect();
        console.log(`✅ Successfully connected to existing database ${envVars.DBaaS_DATABASE}`);
        const result = await directClient.query('SELECT version(), current_database()');
        console.log('PostgreSQL Version:', result.rows[0].version);
        console.log('Connected Database:', result.rows[0].current_database);
        await directClient.end();
      } catch (directError) {
        console.error('❌ Direct connection also failed:', directError.message);
        console.log('\n💡 Please contact your database administrator to:');
        console.log(`   1. Create database: ${envVars.DBaaS_DATABASE}`);
        console.log(`   2. Grant privileges to user: ${envVars.DBaaS_USER}`);
      }
    }
    
    process.exit(1);
  }
}

createDatabase();