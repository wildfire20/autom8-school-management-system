# 🚀 AutoM8 School Management System - Deployment Guide

## 🎯 DEPLOYMENT OPTIONS

### **Option 1: Local/Development Deployment** (Recommended for testing)
### **Option 2: Cloud Deployment** (Recommended for production)
### **Option 3: On-Premises Deployment** (For schools with specific requirements)

---

## 🏠 OPTION 1: LOCAL/DEVELOPMENT DEPLOYMENT

### **Prerequisites**
- ✅ Windows 10/11 (Current environment)
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 13+ installed
- ✅ Git (for version control)

### **Step 1: Environment Setup**

Create `.env` file in project root:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autom8_school
DB_USER=postgres
DB_PASSWORD=your_password

# Application Configuration
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### **Step 2: Database Setup**

```bash
# Create database
createdb autom8_school

# Initialize schema
node setup-enhanced-schema.js
```

### **Step 3: Install Dependencies**

```bash
# Install all required packages
npm install

# Or if package.json doesn't exist, install manually:
npm init -y
npm install express pg bcrypt jsonwebtoken multer dotenv socket.io cors helmet
npm install --save-dev nodemon
```

### **Step 4: Start Application**

```bash
# Development mode with auto-restart
npm run dev
# or
nodemon index.js

# Production mode
npm start
# or
node index.js
```

### **Step 5: Access Application**

Open browser and navigate to:
```
http://localhost:3000
```

---

## ☁️ OPTION 2: CLOUD DEPLOYMENT

### **Recommended Cloud Platforms**

#### **A. Heroku (Easiest for beginners)**

1. **Create Heroku App**
```bash
# Install Heroku CLI
# Create app
heroku create autom8-school-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev
```

2. **Configure Environment Variables**
```bash
heroku config:set JWT_SECRET=your-super-secret-jwt-key
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://your-app.herokuapp.com
```

3. **Deploy Application**
```bash
# Add and commit all files
git add .
git commit -m "Initial deployment"

# Deploy to Heroku
git push heroku main

# Run database setup
heroku run node setup-enhanced-schema.js
```

4. **Scale Application**
```bash
heroku ps:scale web=1
```

#### **B. DigitalOcean App Platform**

1. **Create App**
   - Connect GitHub repository
   - Select Node.js environment
   - Add PostgreSQL database

2. **Environment Variables**
   ```
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=production
   DATABASE_URL=provided-by-digitalocean
   ```

3. **Deploy**
   - Platform auto-deploys from Git
   - Run database setup via console

#### **C. Railway**

1. **Deploy from GitHub**
   - Connect repository
   - Add PostgreSQL plugin
   - Auto-deployment enabled

2. **Environment Setup**
   - Configure variables in dashboard
   - Database URL auto-provided

#### **D. AWS (Advanced)**

1. **Services Needed**
   - EC2 instance (t3.micro for small schools)
   - RDS PostgreSQL database
   - S3 for file storage
   - Route 53 for domain management

2. **Setup Process**
   - Launch EC2 instance
   - Install Node.js and dependencies
   - Configure RDS connection
   - Setup reverse proxy (nginx)
   - Configure SSL certificate

---

## 🏢 OPTION 3: ON-PREMISES DEPLOYMENT

### **Hardware Requirements**

#### **Small School (< 500 students)**
- **CPU**: 4 cores, 2.4GHz+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 100GB SSD minimum
- **Network**: Gigabit Ethernet

#### **Medium School (500-2000 students)**
- **CPU**: 8 cores, 2.8GHz+
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: 500GB SSD minimum
- **Network**: Gigabit Ethernet with redundancy

#### **Large School (2000+ students)**
- **CPU**: 16+ cores, 3.0GHz+
- **RAM**: 32GB minimum, 64GB recommended
- **Storage**: 1TB+ SSD with RAID
- **Network**: Multiple Gigabit connections

### **Server Setup (Ubuntu/CentOS)**

1. **Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

2. **Database Setup**
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE autom8_school;
CREATE USER autom8_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE autom8_school TO autom8_user;
\q
```

3. **Application Setup**
```bash
# Clone repository
git clone https://github.com/yourrepo/autom8-school-app.git
cd autom8-school-app

# Install dependencies
npm install --production

# Setup environment variables
cp .env.example .env
nano .env  # Configure variables

# Initialize database
node setup-enhanced-schema.js

# Start with PM2
pm2 start index.js --name "autom8-school"
pm2 startup
pm2 save
```

4. **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/autom8-school
server {
    listen 80;
    server_name your-school.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **SSL Certificate (Let's Encrypt)**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-school.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔧 PRODUCTION CONFIGURATION

### **Environment Variables for Production**

```env
# Production Database (Use strong credentials)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=autom8_school_prod
DB_USER=autom8_secure_user
DB_PASSWORD=very-secure-password-here

# Application
PORT=3000
NODE_ENV=production
JWT_SECRET=very-long-random-secret-key-for-jwt-tokens

# Email Service (Production SMTP)
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourschool.edu
EMAIL_PASS=secure-email-password

# File Storage
UPLOAD_DIR=/var/uploads/autom8
MAX_FILE_SIZE=52428800  # 50MB

# Security
FRONTEND_URL=https://yourschool.edu
SESSION_SECRET=another-secure-session-secret
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX=100    # requests per window

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

### **Production Optimizations**

1. **Package.json Scripts**
```json
{
  "scripts": {
    "start": "NODE_ENV=production node index.js",
    "dev": "nodemon index.js",
    "test": "npm run test:api && npm run test:ui",
    "setup": "node setup-enhanced-schema.js",
    "backup": "node scripts/backup-database.js",
    "migrate": "node scripts/migrate-database.js"
  }
}
```

2. **PM2 Ecosystem File** (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'autom8-school',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

---

## 🛡️ SECURITY CHECKLIST FOR PRODUCTION

### **Application Security**
- ✅ JWT secrets are strong and unique
- ✅ Database credentials are secure
- ✅ HTTPS is enabled and enforced
- ✅ CORS is properly configured
- ✅ Rate limiting is implemented
- ✅ Input validation is comprehensive
- ✅ File upload restrictions are in place

### **Server Security**
- ✅ Firewall is configured (only necessary ports open)
- ✅ Regular security updates are applied
- ✅ SSH is secured (key-based auth, no root login)
- ✅ Database is not publicly accessible
- ✅ Logs are monitored and rotated
- ✅ Backups are automated and tested

### **Network Security**
- ✅ SSL/TLS certificates are valid
- ✅ Domain is properly configured
- ✅ CDN is used for static assets (optional)
- ✅ DDoS protection is in place
- ✅ Monitoring and alerting are configured

---

## 📊 MONITORING AND MAINTENANCE

### **Health Monitoring**

1. **Application Monitoring**
```bash
# PM2 monitoring
pm2 monit

# Log monitoring
tail -f logs/combined.log

# Resource usage
htop
```

2. **Database Monitoring**
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('autom8_school'));

-- Monitor connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### **Backup Strategy**

1. **Database Backups**
```bash
# Daily backup script
#!/bin/bash
pg_dump autom8_school > /backups/autom8_$(date +%Y%m%d).sql
find /backups -name "autom8_*.sql" -mtime +30 -delete
```

2. **File Backups**
```bash
# Backup uploads directory
tar -czf /backups/uploads_$(date +%Y%m%d).tar.gz /var/uploads/autom8
```

3. **Automated Backup Cron**
```bash
# Add to crontab
0 2 * * * /scripts/backup-database.sh
0 3 * * * /scripts/backup-files.sh
```

---

## 🔄 UPDATE AND MIGRATION

### **Application Updates**

1. **Update Process**
```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Run database migrations
node scripts/migrate-database.js

# Restart application
pm2 restart autom8-school
```

2. **Zero-Downtime Deployment**
```bash
# Deploy new version
pm2 start ecosystem.config.js --env production

# Graceful reload
pm2 reload autom8-school
```

---

## 📞 SUPPORT AND TROUBLESHOOTING

### **Common Issues**

#### **High CPU Usage**
- Check for infinite loops in code
- Monitor database query performance
- Scale horizontally if needed

#### **Memory Leaks**
- Monitor memory usage with PM2
- Restart application periodically if needed
- Profile application for memory issues

#### **Database Performance**
- Add indexes for slow queries
- Analyze query execution plans
- Consider read replicas for large deployments

### **Getting Help**

1. **Log Analysis**
   - Check application logs
   - Monitor error rates
   - Set up alerting for critical errors

2. **Performance Monitoring**
   - Use APM tools (New Relic, DataDog)
   - Monitor response times
   - Track user engagement metrics

---

## 🎓 SCHOOL-SPECIFIC DEPLOYMENT CONSIDERATIONS

### **Domain Setup**
- Register school domain (e.g., `yourschool.edu`)
- Configure subdomain for app (e.g., `portal.yourschool.edu`)
- Set up email forwarding for system notifications

### **Data Migration**
- Import existing student records
- Transfer historical grade data
- Set up parent contact information

### **Training and Rollout**
- Train administrators first
- Pilot with select teachers
- Gradual rollout to all users
- Provide ongoing support

---

## ✅ DEPLOYMENT COMPLETION

### **Verification Checklist**
- [ ] Application loads successfully
- [ ] All user roles can log in
- [ ] Database connections work
- [ ] File uploads function
- [ ] Email notifications send
- [ ] Performance is acceptable
- [ ] Security measures are active
- [ ] Backups are running
- [ ] Monitoring is in place
- [ ] Domain and SSL are configured

### **Go-Live Steps**
1. **Final Testing** → Complete end-to-end testing
2. **Data Migration** → Import existing school data
3. **User Training** → Train staff and administrators
4. **Soft Launch** → Limited user group testing
5. **Full Deployment** → All users activated
6. **Post-Launch Support** → Monitor and resolve issues

---

**🎉 Congratulations! Your AutoM8 School Management System is now deployed and ready to serve your educational community.**

---

*This deployment guide covers all scenarios from development to enterprise production. Choose the option that best fits your school's needs and technical requirements.*
