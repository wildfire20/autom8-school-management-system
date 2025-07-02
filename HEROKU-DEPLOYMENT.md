# AutoM8 School Management System - Heroku Deployment Guide

## 🚀 Deploy to Heroku (Free Tier Available)

### Prerequisites
- Heroku account (free): https://signup.heroku.com/
- Heroku CLI installed: https://devcenter.heroku.com/articles/heroku-cli

### Step 1: Install Heroku CLI
Download from: https://devcenter.heroku.com/articles/heroku-cli

### Step 2: Login to Heroku
```bash
heroku login
```

### Step 3: Create Heroku App
```bash
# In your project directory
heroku create your-school-name-management
```

### Step 4: Add PostgreSQL Database
```bash
heroku addons:create heroku-postgresql:mini
```

### Step 5: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secure-jwt-secret-key-minimum-64-characters-long
heroku config:set BCRYPT_ROUNDS=12
heroku config:set PORT=3000
```

### Step 6: Deploy
```bash
git add .
git commit -m "Add Heroku deployment configuration"
git push heroku main
```

### Step 7: Initialize Database
```bash
heroku run node setup-enhanced-schema.js
```

### Step 8: Open Your App
```bash
heroku open
```

Your app will be available at: `https://your-school-name-management.herokuapp.com`

## 🏫 Setting Up for Multiple Schools

### Method 1: Single Instance, Multiple Schools
- Use the built-in multi-school architecture
- Each school gets their own domain/subdomain
- Schools are isolated by domain in the database

### Method 2: Separate Instances per School
- Deploy separate Heroku apps for each school
- Complete isolation and customization
- Easier billing and management per school

## 💰 Cost Estimation (Heroku)
- **Hobby Tier**: $7/month per app
- **Standard-1X**: $25/month per app
- **Database**: $9/month for Basic PostgreSQL

## 🔧 Custom Domain Setup
1. Purchase domain for school (e.g., `lincolnhigh-management.com`)
2. In Heroku dashboard: Settings → Domains → Add Domain
3. Configure DNS to point to Heroku
4. Add SSL certificate (free with Heroku)
