/**
 * AutoM8 School Management System - Database Connection Test
 * Quick test to verify database connectivity
 */

const { Pool } = require('pg');

// Database connection configuration
const getDatabaseConfig = () => {
  // For Railway, Heroku, etc. - use DATABASE_URL
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }
  
  // For local development
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'autom8_school_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  };
};

async function testDatabaseConnection() {
  console.log('🔍 AutoM8 Database Connection Test');
  console.log(''.padEnd(50, '='));
  
  const pool = new Pool(getDatabaseConfig());
  
  try {
    console.log('📡 Attempting to connect...');
    
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database query successful!');
    
    console.log('\n📊 Database Information:');
    console.log('🕐 Current Time:', result.rows[0].current_time);
    console.log('🗄️  PostgreSQL Version:', result.rows[0].postgres_version.split(',')[0]);
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📋 Tables in Database:');
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
        console.log('   - ' + row.table_name);
      });
    } else {
      console.log('   ⚠️  No tables found. Run setup-database.js first.');
    }
    
    // Connection details
    console.log('\n🔗 Connection Details:');
    if (process.env.DATABASE_URL) {
      console.log('   Type: Cloud Database (Railway/Heroku)');
      console.log('   URL: ' + process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));
    } else {
      console.log('   Type: Local PostgreSQL');
      console.log('   Host: ' + (process.env.DB_HOST || 'localhost'));
      console.log('   Port: ' + (process.env.DB_PORT || 5432));
      console.log('   Database: ' + (process.env.DB_NAME || 'autom8_school_system'));
    }
    
    client.release();
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    console.log('\n💡 Troubleshooting Tips:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   • Database server is not running');
      console.log('   • Check if PostgreSQL is installed and running');
      console.log('   • Verify connection parameters');
    } else if (error.code === '3D000') {
      console.log('   • Database does not exist');
      console.log('   • Create database: createdb autom8_school_system');
    } else if (error.code === '28P01') {
      console.log('   • Authentication failed');
      console.log('   • Check username and password');
    } else {
      console.log('   • Check DATABASE_URL environment variable');
      console.log('   • Verify database credentials');
      console.log('   • For Railway: Database should be auto-configured');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  testDatabaseConnection();
}

module.exports = { testDatabaseConnection };
