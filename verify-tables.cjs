const { Client } = require('pg');
require('dotenv').config();

async function verifyTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // List all tables
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('\n📋 Created tables:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.tablename}`);
    });
    
    // Test a simple query on each table
    console.log('\n🔍 Testing table access:');
    for (const row of result.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${row.tablename}`);
        console.log(`✅ ${row.tablename}: ${countResult.rows[0].count} records`);
      } catch (error) {
        console.log(`❌ ${row.tablename}: Error - ${error.message}`);
      }
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyTables();