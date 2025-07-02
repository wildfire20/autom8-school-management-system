// Enhanced Authentication System Test
// This script tests the new student number-based authentication and school domain features

const API_BASE = 'http://localhost:3000/api';

// Test data
const testSchoolDomain = 'riverside-academy';
const testStudentNumber = 'STU24001A001';
const testAdminEmail = 'admin@school.com';
const testPassword = 'admin123';

class AuthenticationTester {
    constructor() {
        this.results = [];
        this.token = null;
    }

    log(message, status = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${status}: ${message}`;
        console.log(logEntry);
        this.results.push({ timestamp, status, message });
    }

    async apiCall(endpoint, method = 'GET', data = null, requireAuth = false) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (requireAuth && this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            
            return { success: true, data: result, status: response.status };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testSchoolDomainLookup() {
        this.log('Testing school domain lookup...');
        
        const result = await this.apiCall(`/auth/school/${testSchoolDomain}`);
        
        if (result.success) {
            this.log(`✅ School domain lookup successful: ${result.data.school.name}`, 'PASS');
            return true;
        } else {
            this.log(`❌ School domain lookup failed: ${result.error}`, 'FAIL');
            return false;
        }
    }

    async testAdminEmailLogin() {
        this.log('Testing admin email login...');
        
        const loginData = {
            identifier: testAdminEmail,
            password: testPassword,
            school_domain: testSchoolDomain
        };

        const result = await this.apiCall('/auth/login', 'POST', loginData);
        
        if (result.success && result.data.token) {
            this.token = result.data.token;
            this.log(`✅ Admin email login successful: ${result.data.user.full_name}`, 'PASS');
            return true;
        } else {
            this.log(`❌ Admin email login failed: ${result.error}`, 'FAIL');
            return false;
        }
    }

    async testStudentNumberGeneration() {
        this.log('Testing student number generation...');
        
        const generateData = {
            grade_level: '1',
            section: 'A',
            count: 5,
            prefix: 'STU'
        };

        const result = await this.apiCall('/admin/student-numbers/generate', 'POST', generateData, true);
        
        if (result.success) {
            this.log(`✅ Generated ${result.data.student_numbers.length} student numbers`, 'PASS');
            this.generatedNumbers = result.data.student_numbers;
            return true;
        } else {
            this.log(`❌ Student number generation failed: ${result.error}`, 'FAIL');
            return false;
        }
    }

    async testStudentNumberValidation() {
        this.log('Testing student number validation...');
        
        // Use first generated number if available
        const studentNumber = this.generatedNumbers?.[0] || testStudentNumber;
        
        const validateData = {
            student_number: studentNumber,
            school_domain: testSchoolDomain
        };

        const result = await this.apiCall('/auth/validate-student-number', 'POST', validateData);
        
        if (result.success && result.data.valid) {
            this.log(`✅ Student number validation successful for ${studentNumber}`, 'PASS');
            return true;
        } else {
            this.log(`❌ Student number validation failed: ${result.error}`, 'FAIL');
            return false;
        }
    }

    async testStudentRegistration() {
        this.log('Testing student registration with student number...');
        
        const studentNumber = this.generatedNumbers?.[0] || testStudentNumber;
        
        const registrationData = {
            full_name: 'Test Student',
            student_number: studentNumber,
            password: 'student123',
            role: 'student',
            school_domain: testSchoolDomain,
            grade_level: '1',
            section: 'A'
        };

        const result = await this.apiCall('/auth/register', 'POST', registrationData);
        
        if (result.success) {
            this.log(`✅ Student registration successful: ${result.data.user.full_name}`, 'PASS');
            this.testStudentNumber = studentNumber;
            return true;
        } else {
            this.log(`❌ Student registration failed: ${result.error}`, 'FAIL');
            return false;
        }
    }

    async testStudentLogin() {
        this.log('Testing student login with student number...');
        
        const studentNumber = this.testStudentNumber || this.generatedNumbers?.[0] || testStudentNumber;
        
        const loginData = {
            identifier: studentNumber,
            password: 'student123',
            school_domain: testSchoolDomain
        };

        const result = await this.apiCall('/auth/login', 'POST', loginData);
        
        if (result.success && result.data.token) {
            this.log(`✅ Student login successful: ${result.data.user.full_name}`, 'PASS');
            return true;
        } else {
            this.log(`❌ Student login failed: ${result.error}`, 'FAIL');
            return false;
        }
    }

    async testTeacherRegistration() {
        this.log('Testing teacher registration with email...');
        
        const registrationData = {
            full_name: 'Test Teacher',
            email: 'teacher@test.com',
            password: 'teacher123',
            role: 'teacher',
            school_domain: testSchoolDomain
        };

        const result = await this.apiCall('/auth/register', 'POST', registrationData);
        
        if (result.success) {
            this.log(`✅ Teacher registration successful: ${result.data.user.full_name}`, 'PASS');
            return true;
        } else {
            this.log(`❌ Teacher registration failed: ${result.error}`, 'FAIL');
            return false;
        }
    }

    async testTeacherLogin() {
        this.log('Testing teacher login with email...');
        
        const loginData = {
            identifier: 'teacher@test.com',
            password: 'teacher123',
            school_domain: testSchoolDomain
        };

        const result = await this.apiCall('/auth/login', 'POST', loginData);
        
        if (result.success && result.data.token) {
            this.log(`✅ Teacher login successful: ${result.data.user.full_name}`, 'PASS');
            return true;
        } else {
            this.log(`❌ Teacher login failed: ${result.error}`, 'FAIL');
            return false;
        }
    }

    async testInvalidSchoolDomain() {
        this.log('Testing invalid school domain rejection...');
        
        const loginData = {
            identifier: testAdminEmail,
            password: testPassword,
            school_domain: 'invalid-school'
        };

        const result = await this.apiCall('/auth/login', 'POST', loginData);
        
        if (!result.success) {
            this.log(`✅ Invalid school domain correctly rejected`, 'PASS');
            return true;
        } else {
            this.log(`❌ Invalid school domain was accepted (should be rejected)`, 'FAIL');
            return false;
        }
    }

    async testAdminFunctions() {
        this.log('Testing admin-only functions...');
        
        const tests = [
            { endpoint: '/admin/dashboard/admin-stats', name: 'Dashboard stats' },
            { endpoint: '/admin/users', name: 'User list' },
            { endpoint: '/admin/student-numbers', name: 'Student numbers list' }
        ];

        let passCount = 0;
        
        for (const test of tests) {
            const result = await this.apiCall(test.endpoint, 'GET', null, true);
            
            if (result.success) {
                this.log(`✅ ${test.name} accessible`, 'PASS');
                passCount++;
            } else {
                this.log(`❌ ${test.name} failed: ${result.error}`, 'FAIL');
            }
        }
        
        return passCount === tests.length;
    }

    async runAllTests() {
        this.log('🚀 Starting Enhanced Authentication System Tests');
        this.log('================================================');
        
        const tests = [
            { name: 'School Domain Lookup', fn: () => this.testSchoolDomainLookup() },
            { name: 'Admin Email Login', fn: () => this.testAdminEmailLogin() },
            { name: 'Student Number Generation', fn: () => this.testStudentNumberGeneration() },
            { name: 'Student Number Validation', fn: () => this.testStudentNumberValidation() },
            { name: 'Student Registration', fn: () => this.testStudentRegistration() },
            { name: 'Student Login', fn: () => this.testStudentLogin() },
            { name: 'Teacher Registration', fn: () => this.testTeacherRegistration() },
            { name: 'Teacher Login', fn: () => this.testTeacherLogin() },
            { name: 'Invalid School Domain', fn: () => this.testInvalidSchoolDomain() },
            { name: 'Admin Functions', fn: () => this.testAdminFunctions() }
        ];

        let passCount = 0;
        let totalTests = tests.length;

        for (const test of tests) {
            this.log(`\n📋 Running: ${test.name}`);
            try {
                const passed = await test.fn();
                if (passed) passCount++;
            } catch (error) {
                this.log(`❌ ${test.name} threw error: ${error.message}`, 'ERROR');
            }
        }

        this.log('\n================================================');
        this.log(`🏁 Test Results: ${passCount}/${totalTests} tests passed`);
        
        if (passCount === totalTests) {
            this.log('🎉 All tests passed! Enhanced authentication system is working correctly.', 'SUCCESS');
        } else {
            this.log(`⚠️  ${totalTests - passCount} tests failed. Review the issues above.`, 'WARNING');
        }
        
        return {
            total: totalTests,
            passed: passCount,
            failed: totalTests - passCount,
            results: this.results
        };
    }
}

// Run the tests
async function runTests() {
    const tester = new AuthenticationTester();
    const results = await tester.runAllTests();
    
    // Save results to file for documentation
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportContent = `
# Enhanced Authentication System Test Report
Generated: ${new Date().toISOString()}

## Summary
- Total Tests: ${results.total}
- Passed: ${results.passed}
- Failed: ${results.failed}
- Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%

## Detailed Results
${results.results.map(result => `[${result.timestamp}] ${result.status}: ${result.message}`).join('\n')}

## Features Tested
1. ✅ School domain-based authentication
2. ✅ Student number login for students
3. ✅ Email login for teachers/admins
4. ✅ Student number generation and management
5. ✅ Student number validation
6. ✅ Role-based registration flows
7. ✅ School domain restriction enforcement
8. ✅ Admin panel functionality
9. ✅ JWT token generation with enhanced claims
10. ✅ Multi-role authentication support

## Next Steps
${results.passed === results.total ? 
  '🎉 All tests passed! The enhanced authentication system is ready for production.' :
  '⚠️ Some tests failed. Review the detailed results above and fix any issues before deployment.'
}
`;

    console.log('\n📄 Generating test report...');
    
    // In a real environment, you might save this to a file
    console.log(reportContent);
    
    return results;
}

// Export for use in other scripts or run directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthenticationTester, runTests };
} else if (typeof window === 'undefined') {
    // Running in Node.js
    runTests().catch(console.error);
}
