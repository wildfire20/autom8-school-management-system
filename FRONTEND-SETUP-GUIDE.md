# AutoM8 Frontend Development Guide

## 🎯 Phase 1: React Frontend Setup

### Step 1: Create React App
```bash
# Navigate to your project directory
cd c:\Users\HUAWEI\

# Create React frontend
npx create-react-app autom8-frontend
cd autom8-frontend

# Install additional dependencies
npm install axios react-router-dom @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material @mui/x-date-pickers dayjs
npm install recharts react-hook-form jwt-decode
```

### Step 2: Project Structure
```
autom8-frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── classes/
│   │   ├── assignments/
│   │   ├── attendance/
│   │   ├── grades/
│   │   └── notifications/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── contexts/
│   └── utils/
```

### Step 3: Key Components to Build

#### 1. Authentication System
- Login/Register forms
- Protected routes
- JWT token management
- Role-based rendering

#### 2. Dashboard
- Student dashboard
- Teacher dashboard
- Admin dashboard
- Analytics charts

#### 3. Class Management
- Class list
- Class details
- Student enrollment
- Class roster

#### 4. Assignment System
- Assignment creation
- Assignment submission
- File upload
- Grading interface

#### 5. Attendance System
- Attendance marking
- Attendance reports
- Calendar view

#### 6. Notification System
- Notification center
- Real-time alerts
- Announcement creation

### Step 4: API Integration
- Create axios service layer
- Implement error handling
- Add loading states
- Token refresh logic

## 🔧 Getting Started Commands

```bash
# 1. Create the frontend
npx create-react-app autom8-frontend

# 2. Install dependencies
cd autom8-frontend
npm install axios react-router-dom @mui/material @emotion/react @emotion/styled @mui/icons-material

# 3. Start development
npm start

# 4. Backend should run on http://localhost:3000
# 5. Frontend will run on http://localhost:3001
```
