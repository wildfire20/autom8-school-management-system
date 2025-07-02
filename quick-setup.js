/**
 * Quick Database Fix Script
 */

const pool = require('./db');

async function quickSetup() {
  console.log('🔧 Quick database setup...');
  
  try {
    // Drop and recreate tables in correct order
    await pool.query('DROP TABLE IF EXISTS submissions CASCADE;');
    await pool.query('DROP TABLE IF EXISTS assignments CASCADE;');
    await pool.query('DROP TABLE IF EXISTS class_enrollments CASCADE;');
    await pool.query('DROP TABLE IF EXISTS classes CASCADE;');
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');
    await pool.query('DROP TABLE IF EXISTS schools CASCADE;');
    
    console.log('✅ Dropped existing tables');

    // Create schools table
    await pool.query(`
      CREATE TABLE schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        contact_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        student_number VARCHAR(100),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
        school_id INTEGER REFERENCES schools(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create assignments table
    await pool.query(`
      CREATE TABLE assignments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        due_date TIMESTAMP NOT NULL,
        max_score INTEGER DEFAULT 100,
        teacher_id INTEGER REFERENCES users(id),
        school_id INTEGER REFERENCES schools(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create submissions table
    await pool.query(`
      CREATE TABLE submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES assignments(id),
        student_id INTEGER REFERENCES users(id),
        content TEXT,
        file_url TEXT,
        score INTEGER,
        feedback TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        submitted_at TIMESTAMP,
        graded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert demo school
    await pool.query(`
      INSERT INTO schools (name, contact_email) 
      VALUES ('Demo High School', 'admin@demoschool.edu');
    `);

    console.log('✅ All tables created successfully!');
    console.log('🎉 Database is ready for testing!');
    
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
  } finally {
    await pool.end();
  }
}

quickSetup();
