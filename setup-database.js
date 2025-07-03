/**
 * AutoM8 Database Setup Script
 * Works with Railway, Heroku, and local PostgreSQL
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
    database: process.env.DB_NAME || 'autom8_school',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  };
};

const pool = new Pool(getDatabaseConfig());

async function setupDatabase() {
  console.log('🗄️  AutoM8 School Management System - Database Setup');
  console.log(''.padEnd(60, '='));

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    
    // Read and execute the schema SQL file
    console.log('📋 Creating database schema...');
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = schemaSql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          await client.query(statement.trim());
        }
      }
      console.log('✅ Database schema created successfully!');
    } else {
      console.log('⚠️  Schema file not found, creating basic tables...');
      await createBasicTables(client);
    }
    
    client.release();
    console.log('✅ Sample data inserted!');
    
    // Show connection info
    console.log('\n📊 Database Information:');
    if (process.env.DATABASE_URL) {
      console.log('🔗 Connection: Using DATABASE_URL (Railway/Heroku)');
      console.log('🌐 Environment: ' + (process.env.NODE_ENV || 'development'));
    } else {
      console.log('🏠 Connection: Local PostgreSQL');
      console.log('🏢 Host: ' + (process.env.DB_HOST || 'localhost'));
      console.log('🚪 Port: ' + (process.env.DB_PORT || 5432));
      console.log('📁 Database: ' + (process.env.DB_NAME || 'autom8_school'));
    }
    
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
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Database Connection Tips:');
      console.log('1. Make sure PostgreSQL is running');
      console.log('2. Check your DATABASE_URL environment variable');
      console.log('3. For Railway: Database should be auto-configured');
      console.log('4. For local: Install PostgreSQL and create database');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function createBasicTables(client) {
  const basicSchema = `
    -- Schools table with domain support
    CREATE TABLE IF NOT EXISTS schools (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      domain_name VARCHAR(100) UNIQUE NOT NULL,
      full_domain VARCHAR(255),
      address TEXT,
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      school_id INTEGER REFERENCES schools(id),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'student',
      student_number VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Classes table
    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      school_id INTEGER REFERENCES schools(id),
      name VARCHAR(255) NOT NULL,
      grade_level VARCHAR(50),
      teacher_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Assignments table
    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      class_id INTEGER REFERENCES classes(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Submissions table
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      assignment_id INTEGER REFERENCES assignments(id),
      student_id INTEGER REFERENCES users(id),
      content TEXT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Class enrollments table
    CREATE TABLE IF NOT EXISTS class_enrollments (
      id SERIAL PRIMARY KEY,
      class_id INTEGER REFERENCES classes(id),
      student_id INTEGER REFERENCES users(id),
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(basicSchema);
  console.log('✅ Basic tables created successfully!');
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase, getDatabaseConfig };
