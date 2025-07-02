// Comprehensive Admin Panel Function Test
// This script tests all admin panel functions to ensure they're working

console.log('🧪 Starting Comprehensive Admin Panel Function Test');

async function testAllAdminFunctions() {
    console.log('1. Testing authentication...');
    
    // Check if we're logged in
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (!token || !user) {
        console.log('❌ Not logged in - logging in as admin...');
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'admin@school.com',
                    password: 'admin123'
                })
            });
            
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                console.log('✅ Logged in successfully');
            } else {
                console.error('❌ Login failed:', data.error);
                return;
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return;
        }
    } else {
        console.log('✅ Already logged in as admin');
    }
    
    console.log('\n2. Testing function availability...');
    
    // List of functions that should be available
    const requiredFunctions = [
        'showCreateUserModal',
        'closeModal',
        'editUser', 
        'deleteUser',
        'generateReport',
        'showSystemSettings',
        'showEmailSettings',
        'exportUsers',
        'backupDatabase',
        'clearCache',
        'viewSystemLogs',
        'maintenanceMode',
        'logout'
    ];
    
    const results = {};
    
    for (const funcName of requiredFunctions) {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ ${funcName} - Available`);
            results[funcName] = 'Available';
        } else {
            console.log(`❌ ${funcName} - Missing`);
            results[funcName] = 'Missing';
        }
    }
    
    console.log('\n3. Testing API endpoints...');
    
    const token2 = localStorage.getItem('authToken');
    const headers = { 
        'Authorization': `Bearer ${token2}`,
        'Content-Type': 'application/json'
    };
    
    // Test stats API
    try {
        const statsResponse = await fetch('http://localhost:3000/api/admin/dashboard/admin-stats', { headers });
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('✅ Stats API working:', statsData.stats);
        } else {
            console.log('❌ Stats API failed');
        }
    } catch (error) {
        console.log('❌ Stats API error:', error.message);
    }
    
    // Test users API
    try {
        const usersResponse = await fetch('http://localhost:3000/api/admin/users', { headers });
        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            console.log('✅ Users API working:', usersData.users.length, 'users');
        } else {
            console.log('❌ Users API failed');
        }
    } catch (error) {
        console.log('❌ Users API error:', error.message);
    }
    
    console.log('\n4. Testing button clicks...');
    
    // Find all buttons with onclick handlers
    const buttons = document.querySelectorAll('button[onclick]');
    console.log(`Found ${buttons.length} buttons with onclick handlers`);
    
    buttons.forEach((button, index) => {
        const onclick = button.getAttribute('onclick');
        console.log(`Button ${index + 1}: "${button.textContent.trim()}" -> ${onclick}`);
    });
    
    console.log('\n5. Function test summary:');
    
    const available = Object.values(results).filter(r => r === 'Available').length;
    const missing = Object.values(results).filter(r => r === 'Missing').length;
    
    console.log(`✅ Available functions: ${available}`);
    console.log(`❌ Missing functions: ${missing}`);
    
    if (missing === 0) {
        console.log('\n🎉 ALL FUNCTIONS ARE AVAILABLE! Admin panel should work perfectly.');
        
        // Test a few functions
        console.log('\n6. Testing actual function execution...');
        
        try {
            console.log('Testing exportUsers...');
            window.exportUsers();
            
            console.log('Testing clearCache...');
            window.clearCache();
            
            console.log('Testing backupDatabase...');
            window.backupDatabase();
            
            console.log('✅ Functions executed successfully!');
        } catch (error) {
            console.log('❌ Function execution error:', error);
        }
        
    } else {
        console.log('\n❌ Some functions are missing. Admin panel may not work correctly.');
    }
    
    return results;
}

// Auto-run the test
testAllAdminFunctions().then(results => {
    console.log('\n🏁 Test completed. Results:', results);
}).catch(error => {
    console.error('Test failed:', error);
});

// Export for manual testing
window.testAllAdminFunctions = testAllAdminFunctions;
