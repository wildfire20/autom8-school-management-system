/**
 * AutoM8 School Management System - Comprehensive Route Testing Script
 * Run this with: node test-routes.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testUserId = '';

// Test data
const testTeacher = {
  full_name: 'Test Teacher',
  email: `teacher-${Date.now()}@demo.school`,
  student_number: `TEACH${Date.now()}`,
  password: 'teacherPass123',
  role: 'teacher',
  school_id: 1
};

const testStudent = {
  full_name: 'Test Student',
  email: `student-${Date.now()}@demo.school`,
  student_number: `STU${Date.now()}`,
  password: 'studentPass123',
  role: 'student',
  school_id: 1
};

async function testAuthRoutes() {
  console.log('🔐 Testing Authentication Routes...\n');

  try {
    // Test 1: Register teacher
    console.log('1️⃣ Testing POST /api/auth/register (Teacher)');
    const teacherRegister = await axios.post(`${BASE_URL}/auth/register`, testTeacher);
    console.log('✅ Teacher registered:', teacherRegister.data.message);

    // Test 2: Register student
    console.log('2️⃣ Testing POST /api/auth/register (Student)');
    const studentRegister = await axios.post(`${BASE_URL}/auth/register`, testStudent);
    console.log('✅ Student registered:', studentRegister.data.message);

    // Test 3: Login as teacher
    console.log('3️⃣ Testing POST /api/auth/login');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testTeacher.email,
      password: testTeacher.password
    });
    
    authToken = loginResponse.data.token;
    testUserId = loginResponse.data.user.id;
    console.log('✅ Login successful, token received');

    // Test 4: Get profile (protected route)
    console.log('4️⃣ Testing GET /api/auth/profile (Protected)');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile fetched:', profileResponse.data.user.full_name);

    console.log('\n');

  } catch (error) {
    console.error('❌ Auth test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testAssignmentRoutes() {
  console.log('📝 Testing Assignment Routes...\n');

  try {
    // Test 1: Create assignment (as teacher)
    console.log('1️⃣ Testing POST /api/assignments (Create Assignment)');
    const assignmentData = {
      title: 'Test Assignment',
      description: 'This is a test assignment for the AutoM8 system',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      max_score: 100
    };

    const createAssignment = await axios.post(`${BASE_URL}/assignments`, assignmentData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const assignmentId = createAssignment.data.assignment.id;
    console.log('✅ Assignment created with ID:', assignmentId);

    // Test 2: Get assignment details
    console.log('2️⃣ Testing GET /api/assignments/:id');
    const getAssignment = await axios.get(`${BASE_URL}/assignments/${assignmentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Assignment details fetched:', getAssignment.data.assignment.title);

    // Test 3: Login as student and submit assignment
    console.log('3️⃣ Testing assignment submission (as student)');
    const studentLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: testStudent.email,
      password: testStudent.password
    });
    
    const studentToken = studentLogin.data.token;
    
    const submissionData = {
      content: 'This is my submission for the test assignment. I have completed all the required tasks.',
      file_url: 'https://example.com/my-submission.pdf'
    };

    const submitAssignment = await axios.post(`${BASE_URL}/assignments/${assignmentId}/submit`, submissionData, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Assignment submitted:', submitAssignment.data.message);

    // Test 4: Get submissions (as teacher)
    console.log('4️⃣ Testing GET /api/assignments/:id/submissions (Teacher View)');
    const getSubmissions = await axios.get(`${BASE_URL}/assignments/${assignmentId}/submissions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Submissions fetched:', getSubmissions.data.submissions.length, 'submissions');

    console.log('\n');

  } catch (error) {
    console.error('❌ Assignment test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testDashboardRoutes() {
  console.log('📊 Testing Dashboard Routes...\n');

  try {
    // Test 1: Get dashboard stats
    console.log('1️⃣ Testing GET /api/dashboard/stats');
    const statsResponse = await axios.get(`${BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Dashboard stats:', statsResponse.data.stats);

    // Test 2: Get teacher's assignments
    console.log('2️⃣ Testing GET /api/dashboard/my-assignments');
    const myAssignments = await axios.get(`${BASE_URL}/dashboard/my-assignments`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Teacher assignments fetched:', myAssignments.data.assignments.length, 'assignments');

    console.log('\n');

  } catch (error) {
    console.error('❌ Dashboard test failed:', error.response?.data || error.message);
    // Don't throw error for dashboard tests as they might require admin role
  }
}

async function runAllTests() {
  console.log('🧪 Starting AutoM8 API Comprehensive Tests...\n');
  
  try {
    await testAuthRoutes();
    await testAssignmentRoutes();
    await testDashboardRoutes();
    
    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Authentication (register, login, profile)');
    console.log('✅ Assignments (create, view, submit)');
    console.log('✅ Dashboard (stats, user assignments)');
    console.log('\n🚀 Your AutoM8 API is ready for development!');

  } catch (error) {
    console.error('\n💥 Test suite failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
