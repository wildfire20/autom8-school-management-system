/**
 * AutoM8 School Management System - Database Migration
 * Fixes missing domain_name and full_domain columns in schools table
 */

const { Pool } = require('pg');

// Database connection configuration
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }
  
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'autom8_school_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  };
};

async function migrateDatabase() {
  console.log('🔄 Running database migration...');
  
  const pool = new Pool(getDatabaseConfig());
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check if domain_name column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'schools' AND column_name = 'domain_name'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('📋 Adding missing domain_name column to schools table...');
      
      // Add domain_name column
      await client.query(`
        ALTER TABLE schools 
        ADD COLUMN IF NOT EXISTS domain_name VARCHAR(100) UNIQUE
      `);
      
      // Add full_domain column
      await client.query(`
        ALTER TABLE schools 
        ADD COLUMN IF NOT EXISTS full_domain VARCHAR(255)
      `);
      
      console.log('✅ Added domain_name and full_domain columns');
      
      // Update existing schools with default domain values
      const schoolsResult = await client.query('SELECT id, name FROM schools WHERE domain_name IS NULL');
      
      if (schoolsResult.rows.length > 0) {
        console.log('🔄 Updating existing schools with domain values...');
        
        for (const school of schoolsResult.rows) {
          const domainName = school.name.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20) || 'school';
          
          const fullDomain = `${domainName}.autom8.edu`;
          
          await client.query(`
            UPDATE schools 
            SET domain_name = $1, full_domain = $2 
            WHERE id = $3
          `, [domainName, fullDomain, school.id]);
        }
        
        console.log(`✅ Updated ${schoolsResult.rows.length} schools with domain values`);
      }
      
      // Create demo school if none exists
      const demoCheck = await client.query(`SELECT id FROM schools WHERE domain_name = 'demo'`);
      
      if (demoCheck.rows.length === 0) {
        console.log('🏫 Creating demo school...');
        
        const demoSchool = await client.query(`
          INSERT INTO schools (name, domain_name, full_domain, address, contact_email)
          VALUES ('Demo Academy', 'demo', 'demo-academy.edu.co', '123 Education Street', 'admin@demo-academy.edu.co')
          ON CONFLICT (domain_name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `);
        
        const schoolId = demoSchool.rows[0].id;
        
        // Create demo admin user
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await client.query(`
          INSERT INTO users (school_id, email, password, full_name, role)
          VALUES ($1, 'admin@demoschool.edu', $2, 'Demo Admin', 'admin')
          ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
        `, [schoolId, hashedPassword]);
        
        console.log('✅ Created demo school and admin user');
        console.log('📋 Login: admin@demoschool.edu / admin123');
      }
      
    } else {
      console.log('✅ Database schema is up to date');
    }
    
    client.release();
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateDatabase();
}

module.exports = { migrateDatabase };
