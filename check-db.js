const pool = require('./db');

async function checkDatabase() {
  try {
    // Check existing tables
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log('📋 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  • ${row.tablename}`);
    });
    
    // Check if we have any users
    try {
      const usersResult = await pool.query('SELECT COUNT(*) as count FROM users;');
      console.log(`\n👥 Users in database: ${usersResult.rows[0].count}`);
    } catch (err) {
      console.log('\n👥 Users table does not exist yet');
    }
    
    // Check if we have schools
    try {
      const schoolsResult = await pool.query('SELECT COUNT(*) as count FROM schools;');
      console.log(`🏫 Schools in database: ${schoolsResult.rows[0].count}`);
    } catch (err) {
      console.log('🏫 Schools table does not exist yet');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
