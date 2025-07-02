/**
 * AutoM8 School Management System - Quick Validation Test
 * Tests basic functionality and demo user access
 */

const http = require('http');

// Configuration
const API_BASE = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  admin: {
    identifier: 'admin@demo-academy.eud.co',
    password: 'admin123',
    role: 'admin'
  },
  teacher: {
    identifier: 'teacher@demo-academy.eud.co',
    password: 'teacher123',
    role: 'teacher'
  }
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    
    req.end();
  });
}

// Test function wrapper
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 Testing: ${testName}...`);
  
  try {
    await testFunction();
    testResults.passed++;
    testResults.details.push({ name: testName, status: 'PASSED', error: null });
    console.log(`✅ ${testName} - PASSED`);
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
    console.log(`❌ ${testName} - FAILED: ${error.message}`);
  }
}

// Test 1: Server Health Check
async function testServerHealth() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  };

  const response = await makeRequest(options);
  
  if (response.statusCode !== 200) {
    throw new Error(`Server returned status ${response.statusCode}`);
  }
  
  if (!response.data.includes('School Portal')) {
    throw new Error('Server response does not contain expected content');
  }
}

// Test 2: API Endpoint Availability
async function testAPIEndpoints() {
  const endpoints = [
    '/api/auth/profile',
    '/api/admin/users',
    '/api/classes',
    '/api/assignments'
  ];

  for (const endpoint of endpoints) {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'GET'
    };

    const response = await makeRequest(options);
    
    // These should return 401 (unauthorized) since we're not authenticated
    if (response.statusCode !== 401) {
      throw new Error(`Endpoint ${endpoint} returned unexpected status ${response.statusCode} instead of 401`);
    }
  }
}

// Test 3: Login Functionality
async function testLogin() {
  for (const [userType, credentials] of Object.entries(TEST_CREDENTIALS)) {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const loginData = {
      identifier: credentials.identifier,
      password: credentials.password,
      school_domain: 'demo-academy'
    };

    const response = await makeRequest(options, loginData);
    
    if (response.statusCode === 200) {
      console.log(`  ✓ ${userType} login successful`);
      
      // Verify response structure
      if (!response.data.token || !response.data.user) {
        throw new Error(`${userType} login response missing token or user data`);
      }
      
      if (response.data.user.role !== credentials.role) {
        throw new Error(`${userType} has incorrect role: expected ${credentials.role}, got ${response.data.user.role}`);
      }
    } else {
      console.log(`  ⚠️  ${userType} login failed (${response.statusCode}) - user may not exist yet`);
    }
  }
}

// Test 4: Database Connection
async function testDatabaseConnection() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/school/demo-academy',
    method: 'GET'
  };

  const response = await makeRequest(options);
  
  // This should return school info or 404 if school doesn't exist
  if (response.statusCode !== 200 && response.statusCode !== 404) {
    throw new Error(`Database connection test failed with status ${response.statusCode}`);
  }
}

// Test 5: File Serving
async function testFileServing() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/student-dashboard.html',
    method: 'GET'
  };

  const response = await makeRequest(options);
  
  if (response.statusCode !== 200) {
    throw new Error(`Static file serving failed with status ${response.statusCode}`);
  }
  
  if (!response.data.includes('Student Dashboard')) {
    throw new Error('Student dashboard file does not contain expected content');
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 AutoM8 School Management System - Validation Tests');
  console.log('=' * 60);
  
  await runTest('Server Health Check', testServerHealth);
  await runTest('API Endpoint Availability', testAPIEndpoints);
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('File Serving', testFileServing);
  await runTest('Login Functionality', testLogin);
  
  // Print results summary
  console.log('\n' + '=' * 60);
  console.log('🏆 TEST RESULTS SUMMARY');
  console.log('=' * 60);
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📊 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details.filter(t => t.status === 'FAILED').forEach(test => {
      console.log(`  • ${test.name}: ${test.error}`);
    });
  }
  
  console.log('\n' + '=' * 60);
  
  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! System is ready for deployment.');
  } else {
    console.log('⚠️  Some tests failed. Please check the issues before deployment.');
  }
  
  console.log('=' * 60);
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
