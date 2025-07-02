# 🎓 AutoM8 School Management System

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()

A comprehensive, modern school management system built with Node.js, Express, and PostgreSQL. Features real-time notifications, role-based access control, and multi-school support.

## ✨ Features

### 🔐 Authentication & Security
- **Multi-role authentication** (Admin, Teacher, Student, Parent)
- **JWT-based secure sessions**
- **School domain isolation**
- **Password hashing with bcrypt**
- **Role-based access control**

### 👥 User Management
- **Admin dashboard** for system administration
- **Teacher portal** for class and assignment management
- **Student dashboard** for assignments and grades
- **Parent portal** for monitoring child's progress
- **User profile management** with photo uploads

### 📚 Academic Management
- **Class management** with teacher assignments
- **Assignment creation and submission**
- **Grade management and calculations**
- **Attendance tracking** with daily reports
- **Real-time notifications** via WebSocket

### 🏫 Multi-School Support
- **Domain-based school isolation**
- **Configurable school settings**
- **Custom branding per school**
- **Scalable architecture**

### 📊 Administrative Features
- **User management and roles**
- **System-wide notifications**
- **File upload management**
- **Audit trails and logging**
- **Database health monitoring**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/autom8-school-app.git
   cd autom8-school-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Initialize the database:**
   ```bash
   node setup-enhanced-schema.js
   ```

5. **Start the server:**
   ```bash
   node index.js
   ```

6. **Access the application:**
   - Main site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html

### Demo Credentials

- **Admin**: admin@demo-academy.eud.co / admin123
- **Teacher**: teacher@demo-academy.eud.co / teacher123

## 📋 System Requirements

### Minimum Requirements
- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 20 GB available space
- **OS**: Linux, Windows, or macOS

### Recommended for Production
- **CPU**: 4+ cores, 2.5+ GHz
- **RAM**: 8+ GB
- **Storage**: 100+ GB SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+

## 🏗️ Architecture

```
autom8-school-app/
├── controllers/          # Business logic controllers
├── db/                  # Database configuration and schema
├── frontend/            # Static frontend files
│   ├── assets/         # JavaScript, CSS, images
│   └── *.html         # HTML pages
├── middleware/          # Express middleware
├── routes/             # API route definitions
├── utils/              # Utility functions
├── uploads/            # User uploaded files
└── *.js               # Setup and utility scripts
```

### Database Schema

- **schools** - School information and configuration
- **users** - All system users with role-based access
- **classes** - Class management with teacher assignments
- **assignments** - Assignment creation and tracking
- **submissions** - Student assignment submissions
- **grades** - Grade management and calculations
- **attendance** - Daily attendance tracking
- **notifications** - System-wide notification system
- **parents** - Parent-student relationships

## 🔧 Configuration

### Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:5432/autom8_school
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autom8_school
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-64-characters-long
BCRYPT_ROUNDS=10

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourschool.com
```

## 🚀 Deployment

### Production Deployment Options

#### Option 1: PM2 (Recommended)
```bash
npm install -g pm2
pm2 start index.js --name "autom8-school"
pm2 startup
pm2 save
```

#### Option 2: Docker
```bash
docker build -t autom8-school .
docker run -d -p 3000:3000 --env-file .env autom8-school
```

#### Option 3: Systemd Service
```bash
sudo cp autom8-school.service /etc/systemd/system/
sudo systemctl enable autom8-school
sudo systemctl start autom8-school
```

### Web Server Configuration (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name yourschool.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🧪 Testing

### Run System Validation
```bash
# Quick validation
node validate-system.js

# Comprehensive testing
node final-validation.js

# Database verification
node check-db.js
node check-demo-users.js
```

### Expected Output
```
🎉 SYSTEM READY FOR DEPLOYMENT!
✅ Tests Passed: 4
❌ Tests Failed: 0
📈 Success Rate: 100%
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/school/:domain` - Get school by domain

### Dashboard Endpoints
- `GET /api/dashboard/admin` - Admin dashboard data
- `GET /api/dashboard/teacher` - Teacher dashboard data
- `GET /api/dashboard/student` - Student dashboard data
- `GET /api/dashboard/parent` - Parent dashboard data

### Management Endpoints
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `GET /api/attendance` - Attendance records
- `POST /api/attendance` - Mark attendance

## 🔒 Security Features

- **SQL Injection Prevention** via parameterized queries
- **XSS Protection** with sanitized inputs
- **CSRF Protection** with secure headers
- **Rate Limiting** for API endpoints
- **File Upload Security** with type restrictions
- **Password Security** with bcrypt hashing
- **JWT Token Security** with expiration

## 🛠️ Development

### Setup Development Environment
```bash
# Install dependencies
npm install

# Set up development database
node setup-enhanced-schema.js

# Start development server
npm run dev
```

### Code Structure Guidelines
- **Controllers**: Business logic and data processing
- **Routes**: API endpoint definitions and validation
- **Middleware**: Authentication, authorization, and utilities
- **Frontend**: Static HTML, CSS, and JavaScript files

## 📊 Monitoring

### Health Checks
```bash
# Server health
curl -f http://localhost:3000/

# Database connection
curl -f http://localhost:3000/api/auth/test
```

### Logging
- Application logs via console output
- PM2 logs for process management
- Nginx access and error logs
- Database query logs (configurable)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Deployment Guide](FINAL-DEPLOYMENT-GUIDE.md)
- [System Overview](SYSTEM-OVERVIEW.md)
- [API Testing Guide](API-TESTING.md)
- [Frontend Setup](FRONTEND-SETUP-GUIDE.md)

### Troubleshooting
- Check the [troubleshooting guide](FINAL-DEPLOYMENT-GUIDE.md#troubleshooting)
- Run system validation: `node final-validation.js`
- Check logs: `pm2 logs autom8-school`

### Getting Help
- Create an [issue](https://github.com/yourusername/autom8-school-app/issues)
- Check existing [discussions](https://github.com/yourusername/autom8-school-app/discussions)
- Review the documentation

## 🎯 Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced reporting and analytics
- [ ] Integration with external learning platforms
- [ ] Multi-language support
- [ ] Advanced calendar and scheduling
- [ ] Parent-teacher communication system
- [ ] Online examination system
- [ ] Student performance analytics

## 🏆 Project Status

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: July 2, 2025  
**Test Coverage**: 100% core features validated  

---

**AutoM8 School Management System** - Streamlining education management with modern technology.

*Built with ❤️ for educational institutions worldwide.*
