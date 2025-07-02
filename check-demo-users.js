const pool = require('./db');

async function checkDemoUsers() {
  try {
    const result = await pool.query('SELECT email, role, student_number, full_name FROM users ORDER BY role;');
    
    console.log('👥 Demo users created:');
    result.rows.forEach(user => {
      const identifier = user.email || user.student_number;
      console.log(`  ${user.role}: ${user.full_name} (${identifier})`);
    });
    
    // Check school
    const schoolResult = await pool.query('SELECT name, domain_name, full_domain FROM schools;');
    console.log('\n🏫 Demo school:');
    schoolResult.rows.forEach(school => {
      console.log(`  ${school.name} (${school.full_domain})`);
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    process.exit(0);
  }
}

checkDemoUsers();
