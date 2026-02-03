const { Client } = require('pg');

// Connect to default postgres database
const client = new Client({
  host: '79.174.89.22',
  port: 16132,
  user: 'product_card_admin',
  password: 'i-5JbuUEgYDGNmA',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function listDatabases() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');
    
    // List all databases
    const result = await client.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname
    `);
    
    console.log('\n📋 Available databases:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.datname}`);
    });
    
    // Check user permissions
    const userResult = await client.query(`
      SELECT 
        rolname,
        rolsuper,
        rolcreatedb,
        rolcreaterole
      FROM pg_roles 
      WHERE rolname = 'product_card_admin'
    `);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('\n👤 User Permissions:');
      console.log(`   Username: ${user.rolname}`);
      console.log(`   Superuser: ${user.rolsuper ? 'Yes' : 'No'}`);
      console.log(`   Can create DB: ${user.rolcreatedb ? 'Yes' : 'No'}`);
      console.log(`   Can create roles: ${user.rolcreaterole ? 'Yes' : 'No'}`);
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Failed to list databases:', error.message);
    process.exit(1);
  }
}

listDatabases();