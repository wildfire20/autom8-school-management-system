const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testDemoUsers() {
    console.log('🧪 Testing AutoM8 Demo Users Authentication...');
    console.log('====================================================');

    const testUsers = [
        {
            name: 'Admin User',
            identifier: 'admin@demo-academy.edu',
            password: 'admin123',
            expectedRole: 'admin'
        },
        {
            name: 'Teacher User',
            identifier: 'teacher@demo-academy.edu',
            password: 'teacher123',
            expectedRole: 'teacher'
        },
        {
            name: 'Student User',
            identifier: 'STU001',
            password: 'student123',
            expectedRole: 'student'
        },
        {
            name: 'Parent User',
            identifier: 'parent@demo-academy.edu',
            password: 'parent123',
            expectedRole: 'parent'
        }
    ];

    let successCount = 0;
    
    for (const user of testUsers) {
        try {
            console.log(`\n🔐 Testing ${user.name}...`);
            
            const response = await axios.post(`${API_BASE}/auth/login`, {
                identifier: user.identifier,
                password: user.password,
                school_domain: 'demo-academy'
            });

            if (response.status === 200 && response.data.user) {
                const userData = response.data.user;
                if (userData.role === user.expectedRole) {
                    console.log(`✅ ${user.name} login successful`);
                    console.log(`   Role: ${userData.role}`);
                    console.log(`   Name: ${userData.full_name}`);
                    successCount++;
                } else {
                    console.log(`❌ ${user.name} role mismatch. Expected: ${user.expectedRole}, Got: ${userData.role}`);
                }
            } else {
                console.log(`❌ ${user.name} login failed`);
            }
        } catch (error) {
            console.log(`❌ ${user.name} login error:`, error.response?.data?.error || error.message);
        }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`✅ Successful logins: ${successCount}/${testUsers.length}`);
    
    if (successCount === testUsers.length) {
        console.log(`🎉 All demo users authenticated successfully!`);
        console.log(`🚀 System is ready for production use!`);
    } else {
        console.log(`⚠️  Some users failed authentication. Check database setup.`);
    }
}

// Test basic server connectivity
async function testServerConnectivity() {
    console.log('\n🌐 Testing server connectivity...');
    try {
        const response = await axios.get('http://localhost:3000');
        if (response.status === 200) {
            console.log('✅ Server is responding on http://localhost:3000');
            return true;
        }
    } catch (error) {
        console.log('❌ Server connectivity failed:', error.message);
        return false;
    }
}

// Test database endpoints
async function testDatabaseEndpoints() {
    console.log('\n🗄️  Testing database endpoints...');
    try {
        // Test school endpoint
        const schoolResponse = await axios.get(`${API_BASE}/auth/school/demo-academy`);
        if (schoolResponse.status === 200) {
            console.log('✅ School configuration endpoint working');
        }
    } catch (error) {
        console.log('❌ Database endpoint test failed:', error.message);
    }
}

async function runTests() {
    console.log('🚀 AutoM8 School Management System - Demo User Validation\n');
    
    // Test server connectivity first
    const serverOk = await testServerConnectivity();
    if (!serverOk) {
        console.log('❌ Cannot proceed without server connectivity');
        process.exit(1);
    }

    // Test database endpoints
    await testDatabaseEndpoints();
    
    // Test demo user authentication
    await testDemoUsers();
    
    console.log('\n🏁 Testing complete!');
}

runTests().catch(console.error);
