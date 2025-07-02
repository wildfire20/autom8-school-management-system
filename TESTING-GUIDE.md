# 🧪 AutoM8 School Management System - Testing Guide

## 🚀 QUICK START TESTING

### 1. **Setup Database and Schema**

First, ensure your database is ready:

```bash
# Navigate to project directory
cd c:\Users\HUAWEI\autom8-school-app

# Create/Reset database schema
node setup-enhanced-schema.js
```

Expected output:
```
🏫 Creating enhanced database schema for real-world school implementation...
✅ Dropped existing tables
✅ Performance indexes created
✅ Demo school and users created
🎉 Enhanced database schema created successfully!
```

### 2. **Start the Server**

```bash
# Start the application server
node index.js
```

Expected output:
```
✅ DB connected: { now: '2025-07-02T...' }
🚀 Server running at http://localhost:3000
🔌 WebSocket server ready for real-time notifications
```

### 3. **Quick Server Test**

```bash
# Test server is responding (in new terminal)
node test-api.js
```

Expected output:
```
🧪 Testing AutoM8 School Management API...
✅ Main endpoint response: <!DOCTYPE html>...
✅ Status: 200
🎉 API test completed! Server is responding.
```

---

## 🔐 LOGIN CREDENTIALS FOR TESTING

### **Demo School Domain**: `demo-academy.eud.co`

#### **Admin Account**
- **Email**: `admin@demo-academy.eud.co`
- **Password**: `admin123`
- **Access**: Full system administration

#### **Teacher Account**
- **Email**: `teacher@demo-academy.eud.co`
- **Password**: `teacher123`
- **Access**: Class management, grading

#### **Student Accounts** (Auto-generated)
- **Student Number**: `STU-2025-0001`, `STU-2025-0002`, etc.
- **Password**: Auto-generated (check admin panel)
- **Access**: Academic dashboard

---

## 🌐 FRONTEND TESTING

### **1. Access the Application**

Open your browser and navigate to:
```
http://localhost:3000
```

### **2. Test Login Portal**

#### **Staff Login Test**
1. Click "Staff Login" tab
2. Enter: `admin@demo-academy.eud.co`
3. Password: `admin123`
4. Should redirect to Admin Dashboard

#### **Student Login Test** (After creating students)
1. Click "Student Login" tab
2. Enter student number (e.g., `STU-2025-0001`)
3. Enter student password
4. Should redirect to Student Dashboard

### **3. Test All Dashboards**

#### **Admin Dashboard** (`admin-enhanced.html`)
- ✅ User management
- ✅ Student registration
- ✅ Bulk import
- ✅ System statistics
- ✅ School settings

#### **Teacher Dashboard** (`teacher-dashboard.html`)
- ✅ Class management
- ✅ Assignment creation
- ✅ Grade recording
- ✅ Attendance tracking

#### **Student Dashboard** (`student-dashboard.html`)
- ✅ Academic overview
- ✅ Assignment viewing
- ✅ Grade checking
- ✅ Submission tracking

#### **Parent Dashboard** (`parent-dashboard.html`)
- ✅ Children overview
- ✅ Academic progress
- ✅ Attendance monitoring
- ✅ Communication center

---

## 🔧 API TESTING

### **1. Test Authentication Endpoints**

```bash
# Test school domain lookup
curl -X GET "http://localhost:3000/api/auth/school/demo-academy"

# Test login
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@demo-academy.eud.co",
    "password": "admin123",
    "school_domain": "demo-academy"
  }'
```

### **2. Test Protected Endpoints** (Replace TOKEN with actual JWT)

```bash
# Get user profile
curl -X GET "http://localhost:3000/api/auth/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get classes
curl -X GET "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get assignments
curl -X GET "http://localhost:3000/api/assignments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🎯 COMPREHENSIVE TESTING SCENARIOS

### **Scenario 1: Complete School Setup**

1. **Admin Login** → Create school configuration
2. **Create Teachers** → Add teacher accounts
3. **Create Classes** → Set up grade-level classes
4. **Bulk Import Students** → Upload student list
5. **Create Assignments** → Teachers create assignments
6. **Student Login** → Students view and submit
7. **Grade Assignments** → Teachers record grades
8. **Parent Access** → Parents monitor progress

### **Scenario 2: Permission Testing**

1. **Grade-Level Access** → Students only see their grade
2. **Class Restrictions** → Teachers only access their classes
3. **Parent Filtering** → Parents only see their children
4. **Admin Override** → Admins access everything

### **Scenario 3: Real-World Workflow**

1. **Academic Year Setup** → Configure school year
2. **Student Registration** → Enroll new students
3. **Class Scheduling** → Create class schedules
4. **Daily Operations** → Attendance, assignments, grading
5. **Parent Communication** → Notifications and updates
6. **Reporting** → Generate academic reports

---

## 🔍 TESTING CHECKLIST

### **✅ Authentication & Security**
- [ ] Domain-based login works
- [ ] Student number login works
- [ ] JWT tokens are generated correctly
- [ ] Protected routes require authentication
- [ ] Role-based access is enforced
- [ ] Grade-level filtering works

### **✅ User Management**
- [ ] Admin can create users
- [ ] Student numbers auto-generate
- [ ] Bulk import functions
- [ ] Password reset works
- [ ] Parent-student linking works

### **✅ Academic Features**
- [ ] Classes can be created and managed
- [ ] Assignments work end-to-end
- [ ] Grading system functions
- [ ] Attendance tracking works
- [ ] Reports generate correctly

### **✅ Frontend Functionality**
- [ ] All dashboards load correctly
- [ ] Navigation works smoothly
- [ ] Forms submit successfully
- [ ] Data displays properly
- [ ] Mobile responsiveness works

### **✅ API Endpoints**
- [ ] All endpoints respond correctly
- [ ] Error handling works
- [ ] Data validation functions
- [ ] Permissions are enforced
- [ ] Performance is acceptable

---

## 🐛 TROUBLESHOOTING

### **Common Issues**

#### **Database Connection Error**
```bash
# Check PostgreSQL is running
# Update .env file with correct database credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autom8_school
DB_USER=your_username
DB_PASSWORD=your_password
```

#### **Port Already in Use**
```bash
# Find and kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

#### **Login Issues**
- Verify database has demo users
- Check password is correct
- Ensure school domain matches

#### **Permission Errors**
- Verify user roles are set correctly
- Check grade-level assignments
- Confirm class enrollments

### **Debug Mode**
```bash
# Run with debug logging
NODE_ENV=development DEBUG=* node index.js
```

---

## 📊 PERFORMANCE TESTING

### **Load Testing**
```bash
# Install artillery for load testing
npm install -g artillery

# Create load test config
artillery quick --count 10 --num 100 http://localhost:3000
```

### **Database Performance**
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE school_id = 1;

-- Monitor slow queries
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC;
```

---

## ✅ TESTING COMPLETION

### **Verification Steps**
1. ✅ All login flows work correctly
2. ✅ All user roles can access their features
3. ✅ Grade-level permissions are enforced
4. ✅ Academic workflows function end-to-end
5. ✅ Data integrity is maintained
6. ✅ Security measures are effective
7. ✅ Performance is acceptable
8. ✅ Error handling works properly

### **Ready for Production**
Once all tests pass, the system is ready for deployment!

---

*Testing is critical for ensuring the system works correctly in real-world scenarios. Follow this guide systematically to validate all features before deployment.*
