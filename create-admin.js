const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Create a simple admin user for accessing the admin panel
async function createAdmin() {
    console.log('🔧 Creating admin user for admin panel access...');
    
    const adminData = {
        full_name: 'Admin User',
        email: 'admin@school.com',
        student_number: 'ADMIN001',
        password: 'admin123',
        role: 'admin',
        school_id: 1
    };

    try {
        // First try to register the admin
        const response = await axios.post(`${API_BASE}/auth/register`, adminData);
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@school.com');
        console.log('🔑 Password: admin123');
        console.log('🎯 Role: admin');
        
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 400 && error.response.data.error.includes('already exists')) {
            console.log('ℹ️  Admin user already exists!');
            console.log('📧 Email: admin@school.com');
            console.log('🔑 Password: admin123');
            return null;
        } else {
            console.error('❌ Failed to create admin user:', error.response?.data || error.message);
            throw error;
        }
    }
}

// Test login with the admin credentials
async function testAdminLogin() {
    console.log('\n🧪 Testing admin login...');
    
    try {
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@school.com',
            password: 'admin123'
        });
        
        console.log('✅ Admin login successful!');
        console.log('🎟️  Token received:', loginResponse.data.token ? 'Yes' : 'No');
        console.log('👤 User role:', loginResponse.data.user.role);
        console.log('📛 User name:', loginResponse.data.user.full_name);
        
        return loginResponse.data;
    } catch (error) {
        console.error('❌ Admin login failed:', error.response?.data || error.message);
        throw error;
    }
}

// Main function
async function main() {
    try {
        console.log('🚀 Setting up admin access for AutoM8 School Management System\n');
        
        await createAdmin();
        await testAdminLogin();
        
        console.log('\n🎉 Setup complete! You can now access the admin panel:');
        console.log('1. Go to http://localhost:3000/index.html');
        console.log('2. Login with:');
        console.log('   📧 Email: admin@school.com');
        console.log('   🔑 Password: admin123');
        console.log('3. After login, navigate to http://localhost:3000/admin.html');
        console.log('   or update the login redirect for admin users');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

main();
