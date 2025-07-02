# AutoM8 School Management System - DigitalOcean Deployment

## 🌊 Deploy to DigitalOcean

### Why DigitalOcean?
- **Affordable**: $12/month for basic droplet
- **Scalable**: Easy to upgrade resources
- **Multiple Schools**: Host multiple schools on one server
- **Full Control**: Complete server access

### Step 1: Create DigitalOcean Account
- Sign up at: https://www.digitalocean.com/
- $200 free credit available for new users

### Step 2: Create a Droplet
1. **Choose Image**: Ubuntu 22.04 LTS
2. **Choose Plan**: Basic $12/month (2GB RAM, 1 vCPU, 50GB SSD)
3. **Add SSH Key**: For secure access
4. **Choose Hostname**: `autom8-schools-server`

### Step 3: Server Setup Script

```bash
#!/bin/bash
# AutoM8 School Management System - DigitalOcean Setup Script

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo apt install git -y

# Setup PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE autom8_school;"
sudo -u postgres psql -c "CREATE USER autom8_user WITH ENCRYPTED PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE autom8_school TO autom8_user;"

# Clone your repository
cd /opt
sudo git clone https://github.com/wildfire20/autom8-school-management-system.git
sudo chown -R $USER:$USER autom8-school-management-system
cd autom8-school-management-system

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
# Edit .env with production values

# Initialize database
node setup-enhanced-schema.js

# Start with PM2
pm2 start index.js --name "autom8-school"
pm2 startup
pm2 save

echo "✅ AutoM8 School Management System deployed successfully!"
echo "🌐 Access via your server IP address"
```

### Step 4: Configure Nginx

```nginx
# /etc/nginx/sites-available/autom8-schools
server {
    listen 80;
    server_name your-domain.com *.your-domain.com;

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

### Step 5: SSL Certificate (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d *.your-domain.com
```

## 🏫 Multi-School Setup on DigitalOcean

### Option A: Subdomains (Recommended)
- `lincolnhigh.yourschools.com`
- `oakview.yourschools.com`
- `riverside.yourschools.com`

### Option B: Separate Domains
- `lincolnhigh-school.com`
- `oakview-academy.com`
- `riverside-high.com`

## 💰 Cost Breakdown
- **Server**: $12/month (can host 10-20 small schools)
- **Domain**: $12/year per domain
- **SSL**: Free (Let's Encrypt)
- **Backups**: $2/month (optional)

**Total**: ~$15-20/month for multiple schools
