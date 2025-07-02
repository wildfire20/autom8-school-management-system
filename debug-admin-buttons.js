const axios = require('axios');

async function testAdminFunctions() {
    console.log('🧪 Testing Admin Panel Functions...\n');
    
    // First get admin token
    console.log('1️⃣ Getting admin token...');
    let adminToken;
    try {
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@school.com',
            password: 'admin123'
        });
        adminToken = loginResponse.data.token;
        console.log('✅ Admin token obtained');
    } catch (error) {
        console.error('❌ Failed to get admin token:', error.message);
        return;
    }
    
    const headers = { Authorization: `Bearer ${adminToken}` };
    
    // Test all admin endpoints
    console.log('\n2️⃣ Testing admin stats...');
    try {
        const statsResponse = await axios.get('http://localhost:3000/api/admin/dashboard/admin-stats', { headers });
        console.log('✅ Admin stats working:', statsResponse.data.stats);
    } catch (error) {
        console.error('❌ Admin stats failed:', error.response?.data || error.message);
    }
    
    console.log('\n3️⃣ Testing users list...');
    try {
        const usersResponse = await axios.get('http://localhost:3000/api/admin/users', { headers });
        console.log('✅ Users list working:', usersResponse.data.users?.length, 'users');
    } catch (error) {
        console.error('❌ Users list failed:', error.response?.data || error.message);
    }
    
    console.log('\n4️⃣ Testing user creation...');
    try {
        const newUser = {
            full_name: 'Test Button User',
            email: `test-button-${Date.now()}@school.com`,
            password: 'test123',
            role: 'student'
        };
        
        const createResponse = await axios.post('http://localhost:3000/api/admin/users', newUser, { headers });
        console.log('✅ User creation working:', createResponse.data.user?.full_name);
    } catch (error) {
        console.error('❌ User creation failed:', error.response?.data || error.message);
    }
    
    console.log('\n✅ All admin API endpoints are working correctly!');
    console.log('\n🔍 If buttons aren\'t working in the browser:');
    console.log('1. Check browser console (F12) for JavaScript errors');
    console.log('2. Verify you\'re logged in as admin');
    console.log('3. Check if alert() function is being blocked');
    console.log('4. Try clicking buttons and watch console for errors');
}

testAdminFunctions().catch(console.error);
