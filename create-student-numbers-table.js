// Create student_numbers table for enhanced authentication
const pool = require('./db');

async function createStudentNumbersTable() {
    console.log('🚀 Creating student_numbers table...');
    
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_numbers (
                id SERIAL PRIMARY KEY,
                school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
                student_number VARCHAR(50) UNIQUE NOT NULL,
                grade_level VARCHAR(10) NOT NULL,
                section VARCHAR(10) NOT NULL,
                assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                assigned_at TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Created student_numbers table');
        
        // Create indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_student_numbers_school ON student_numbers(school_id);
            CREATE INDEX IF NOT EXISTS idx_student_numbers_grade_section ON student_numbers(grade_level, section);
            CREATE INDEX IF NOT EXISTS idx_student_numbers_assigned ON student_numbers(assigned_user_id);
        `);
        
        console.log('✅ Created indexes for student_numbers table');
        
    } catch (error) {
        console.error('❌ Error creating student_numbers table:', error);
    } finally {
        process.exit(0);
    }
}

createStudentNumbersTable();
