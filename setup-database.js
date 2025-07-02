/**
 * AutoM8 Database Setup Script
 * Run this to set up your database tables
 */

const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🗄️ Setting up AutoM8 database...\n');

  try {
    // Read and execute the schema SQL file
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schemaSql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement.trim());
      }
    }
    
    console.log('✅ Database schema created successfully!');
    console.log('✅ Sample data inserted!');
    console.log('\n📋 Tables created:');
    console.log('   - schools');
    console.log('   - users'); 
    console.log('   - assignments');
    console.log('   - submissions');
    console.log('   - classes');
    console.log('   - class_enrollments');
    
    console.log('\n👤 Sample admin user created:');
    console.log('   Email: admin@demoschool.edu');
    console.log('   Password: admin123');
    
    console.log('\n🚀 Database is ready for AutoM8!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
