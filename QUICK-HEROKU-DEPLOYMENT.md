# 🚀 Quick Heroku Deployment - AutoM8 School Management

## Step-by-Step Manual Deployment

### 1. Install Heroku CLI (if not done)
Download from: https://devcenter.heroku.com/articles/heroku-cli

### 2. Login to Heroku
```bash
heroku login
```

### 3. Create Heroku App
```bash
heroku create your-app-name
# Example: heroku create autom8-demo-school
```

### 4. Add PostgreSQL Database
```bash
heroku addons:create heroku-postgresql:essential-0
```

### 5. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=super-secure-jwt-secret-key-for-autom8-school-management-system-production
heroku config:set BCRYPT_ROUNDS=12
```

### 6. Deploy the App
```bash
git push heroku main
```

### 7. Setup Database
```bash
heroku run node setup-enhanced-schema.js
```

### 8. Open Your Live App
```bash
heroku open
```

## 🎯 After Deployment

Your app will be live at: `https://your-app-name.herokuapp.com`

### Demo Credentials:
- **Admin**: admin@demo-academy.eud.co / admin123
- **Teacher**: teacher@demo-academy.eud.co / teacher123

### Share with Schools:
1. Send them the live URL
2. Provide demo credentials
3. Schedule a demo call
4. Collect feedback

## 💰 Heroku Costs
- **App**: $7/month (Hobby tier)
- **Database**: $9/month (Essential PostgreSQL)
- **Total**: ~$16/month for demo

## 🔧 Managing Your Heroku App

### View Logs
```bash
heroku logs --tail
```

### Access Database
```bash
heroku pg:psql
```

### Scale App
```bash
heroku ps:scale web=1
```

### Add Custom Domain (Optional)
```bash
heroku domains:add your-custom-domain.com
```

---

**Your school management system will be live and accessible to schools worldwide!** 🌍
