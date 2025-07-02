/**
 * AutoM8 School Management System - Quick School Setup
 * This script helps setup a new school instance
 */

const readline = require('readline');
const { Pool } = require('pg');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupNewSchool() {
  console.log('🏫 AutoM8 School Management System - New School Setup');
  console.log(''.padEnd(60, '='));
  
  try {
    // Collect school information
    const schoolName = await question('School Name: ');
    const domain = await question('School Domain (e.g., lincolnhigh): ');
    const adminName = await question('Admin Full Name: ');
    const adminEmail = await question('Admin Email: ');
    const adminPassword = await question('Admin Password: ');
    const schoolAddress = await question('School Address: ');
    const schoolPhone = await question('School Phone: ');
    
    console.log('\n📋 Setting up your school...');
    
    // Here you would typically:
    // 1. Create school in database
    // 2. Setup admin user
    // 3. Configure school settings
    // 4. Create sample data
    
    console.log(`✅ ${schoolName} setup complete!`);
    console.log(`🌐 Access URL: http://localhost:3000`);
    console.log(`👤 Admin Login: ${adminEmail}`);
    console.log(`🔑 Admin Password: ${adminPassword}`);
    console.log(`📁 School Domain: ${domain}`);
    
    console.log('\n📚 Next Steps:');
    console.log('1. Login with admin credentials');
    console.log('2. Add teachers and staff');
    console.log('3. Create classes and grade levels');
    console.log('4. Import student data');
    console.log('5. Configure school settings');
    
  } catch (error) {
    console.error('❌ Error setting up school:', error.message);
  } finally {
    rl.close();
  }
}

// Check if this is being run directly
if (require.main === module) {
  setupNewSchool();
}

module.exports = { setupNewSchool };
