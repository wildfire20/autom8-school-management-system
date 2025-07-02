const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAdminPanelAPI() {
    console.log('🧪 Testing Admin Panel API Endpoints...\n');
    
    // First login as admin
    console.log('1️⃣ Logging in as admin...');
    let adminToken;
    try {
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@school.com',
            password: 'admin123'
        });
        adminToken = loginResponse.data.token;
        console.log('✅ Admin login successful');
    } catch (error) {
        console.error('❌ Admin login failed:', error.response?.data || error.message);
        return;
    }
    
    const headers = { Authorization: `Bearer ${adminToken}` };
    
    // Test admin stats endpoint
    console.log('\n2️⃣ Testing admin stats endpoint...');
    try {
        const statsResponse = await axios.get(`${API_BASE}/admin/dashboard/admin-stats`, { headers });
        console.log('✅ Admin stats loaded:', statsResponse.data.stats);
    } catch (error) {
        console.error('❌ Admin stats failed:', error.response?.data || error.message);
    }
    
    // Test users list endpoint
    console.log('\n3️⃣ Testing users list endpoint...');
    try {
        const usersResponse = await axios.get(`${API_BASE}/admin/users`, { headers });
        console.log('✅ Users list loaded:', usersResponse.data.users?.length, 'users found');
    } catch (error) {
        console.error('❌ Users list failed:', error.response?.data || error.message);
    }
    
    // Test creating a user
    console.log('\n4️⃣ Testing user creation...');
    try {
        const newUser = {
            full_name: 'Test Student',
            email: `test-${Date.now()}@school.com`,
            student_number: `TEST${Date.now()}`,
            password: 'test123',
            role: 'student',
            school_id: 1
        };
        
        const createResponse = await axios.post(`${API_BASE}/admin/users`, newUser, { headers });
        console.log('✅ User created successfully:', createResponse.data.user?.full_name);
    } catch (error) {
        console.error('❌ User creation failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Admin Panel API testing complete!');
}

async function testAdminPanelFrontend() {
    console.log('\n🌐 Testing Admin Panel Frontend Access...\n');
    
    console.log('📋 Admin Panel Access Instructions:');
    console.log('1. Open http://localhost:3000/index.html');
    console.log('2. The form should be pre-filled with admin credentials:');
    console.log('   📧 Email: admin@school.com');
    console.log('   🔑 Password: admin123');
    console.log('3. Click "Login" or use the "⚡ Quick Admin Access" button');
    console.log('4. You should be redirected to the admin panel automatically');
    console.log('5. The admin panel should show:');
    console.log('   - Welcome message with admin name');
    console.log('   - Statistics dashboard');
    console.log('   - User management section');
    console.log('   - Create user functionality');
    console.log('   - Recent activity log');
    
    console.log('\n🔍 If the admin panel shows a blank screen:');
    console.log('- Check browser console (F12) for JavaScript errors');
    console.log('- Verify you are logged in as admin role');
    console.log('- Check network tab for failed API calls');
    console.log('- Try refreshing the page after login');
}

async function main() {
    console.log('🚀 AutoM8 Admin Panel Comprehensive Test\n');
    console.log('========================================\n');
    
    await testAdminPanelAPI();
    await testAdminPanelFrontend();
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Test the admin panel in the browser');
    console.log('2. Create/edit users through the admin interface');
    console.log('3. Check that all statistics are displaying correctly');
    console.log('4. Verify navigation between different admin sections');
}

main().catch(console.error);
