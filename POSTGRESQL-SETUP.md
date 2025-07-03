# 🗄️ PostgreSQL Database Setup for AutoM8 School System

## 🚄 Railway PostgreSQL Setup (Recommended)

### Step 1: Deploy to Railway
1. **Go to**: https://railway.app
2. **Login** with your GitHub account
3. **Click "Start a New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose**: `wildfire20/autom8-school-management-system`

### Step 2: Add PostgreSQL Database
1. **In Railway Dashboard**, click **"+ Add"**
2. **Select "Database"**
3. **Choose "PostgreSQL"**
4. **Railway automatically**:
   - ✅ Creates PostgreSQL database
   - ✅ Sets `DATABASE_URL` environment variable
   - ✅ Connects database to your app

### Step 3: Initialize Database
After deployment, run the database setup:

```bash
# Railway automatically runs this on deploy
npm run setup-db
```

Or access Railway's database console and run:
```bash
node setup-database.js
```

## 🔧 Environment Variables (Auto-configured by Railway)

Railway automatically sets these for you:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to "production"
- `PORT` - App port (auto-configured)

## 🌐 Other Platform Database Setup

### Heroku PostgreSQL
```bash
# After creating Heroku app
heroku addons:create heroku-postgresql:essential-0
heroku config:set NODE_ENV=production
git push heroku main
heroku run node setup-database.js
```

### Render PostgreSQL
1. **Create Web Service** from GitHub
2. **Add PostgreSQL Database** in Render dashboard
3. **Set Environment Variables**:
   - `DATABASE_URL` (from Render PostgreSQL)
   - `NODE_ENV=production`

### Local PostgreSQL Setup
```bash
# Install PostgreSQL
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Create database
createdb autom8_school_system

# Set environment variables
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autom8_school_system
DB_USER=postgres
DB_PASSWORD=your_password

# Run setup
node setup-database.js
```

## 🎯 Database Schema

Your database will include these tables:
- **schools** - School information
- **users** - Students, teachers, admins, parents
- **classes** - Class/course information
- **assignments** - Homework and projects
- **submissions** - Student assignment submissions
- **class_enrollments** - Student-class relationships

## 📋 Sample Data

The setup creates:
- **Demo School** (domain: demo)
- **Admin User**: admin@demoschool.edu
- **Password**: admin123

## 🚀 Database Commands

```bash
# Setup database (first time)
node setup-database.js

# Setup new school
node setup-new-school.js

# Check database connection
node check-db.js

# Reset database (development only)
node reset-database.js
```

## 🔍 Troubleshooting

### Connection Issues
```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL

# Test database connection
node -e "const pool = require('./db'); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err : res.rows[0]); pool.end(); });"
```

### Common Errors
- **"Connection refused"**: Database not running or wrong credentials
- **"Database does not exist"**: Create database first
- **"SSL required"**: Set `ssl: { rejectUnauthorized: false }` for production

## 🎉 Success Indicators

After successful setup, you should see:
```
✅ Database connected successfully!
✅ Database schema created successfully!
✅ Sample data inserted!
🚀 Database is ready for AutoM8!
```

## 📞 Support

- **Railway**: https://railway.app/help
- **PostgreSQL**: https://www.postgresql.org/docs/
- **AutoM8 Issues**: Check setup-database.js logs

---

**Next**: After database setup, your AutoM8 School Management System is ready for schools to use! 🎓
