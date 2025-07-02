// Setup test data for enhanced authentication system
const pool = require('./db');

async function setupTestData() {
    console.log('🚀 Setting up test data for enhanced authentication...');
    
    try {
        // Check if demo school exists
        const schoolResult = await pool.query("SELECT * FROM schools WHERE domain_name = 'demo-school'");
        
        if (schoolResult.rows.length === 0) {
            // Create demo school
            await pool.query(`
                INSERT INTO schools (name, domain_name, full_domain, address, primary_color, secondary_color, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, ['Demo School', 'demo-school', 'demo-school.eud.co', '123 Demo Street', '#667eea', '#764ba2', true]);
            console.log('✅ Created demo school');
        } else {
            console.log('✅ Demo school already exists');
        }
        
        // Get school ID
        const schoolQuery = await pool.query("SELECT id FROM schools WHERE domain_name = 'demo-school'");
        const schoolId = schoolQuery.rows[0].id;
        
        // Generate some test student numbers
        const studentNumbers = [
            { number: 'STU24001A001', grade: '1', section: 'A' },
            { number: 'STU24001A002', grade: '1', section: 'A' },
            { number: 'STU24001B001', grade: '1', section: 'B' },
            { number: 'STU24002A001', grade: '2', section: 'A' },
            { number: 'STU24002A002', grade: '2', section: 'A' }
        ];
        
        for (const sn of studentNumbers) {
            try {
                await pool.query(`
                    INSERT INTO student_numbers (school_id, student_number, grade_level, section, is_active)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (student_number) DO NOTHING
                `, [schoolId, sn.number, sn.grade, sn.section, true]);
            } catch (err) {
                // Ignore conflicts (already exists)
            }
        }
        console.log('✅ Created test student numbers');
        
        // Check existing admin
        const adminResult = await pool.query("SELECT * FROM users WHERE email = 'admin@school.com'");
        if (adminResult.rows.length === 0) {
            console.log('❌ Default admin user not found. Please ensure setup-enhanced-schema.js was run.');
        } else {
            console.log('✅ Default admin user exists');
        }
        
        console.log('\n📋 Test Data Summary:');
        console.log('- School Domain: demo-school');
        console.log('- Admin Login: admin@school.com / admin123');
        console.log('- Student Numbers: STU24001A001, STU24001A002, STU24001B001, STU24002A001, STU24002A002');
        console.log('- All student numbers are unassigned and ready for registration');
        
        console.log('\n✅ Test data setup complete!');
        
    } catch (error) {
        console.error('❌ Error setting up test data:', error);
    } finally {
        process.exit(0);
    }
}

setupTestData();
