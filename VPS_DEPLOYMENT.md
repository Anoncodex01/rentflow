# 🖥️ VPS Deployment Guide - kiminvestment.space

## Server Details
- **IP Address:** 77.42.74.242
- **Domain:** kiminvestment.space
- **SSH User:** Rentflow@2025 (or root)
- **SSH Port:** 22 (default)

## Step 1: SSH into Server

```bash
ssh Rentflow@2025@77.42.74.242
# Or if username is different:
ssh root@77.42.74.242
```

Enter your password when prompted.

## Step 2: Install Required Software

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js (v20 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Install Nginx (Web Server)
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install Git
```bash
sudo apt install -y git
```

### Install Certbot (for SSL)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

## Step 3: Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/Anoncodex01/rentflow.git
sudo chown -R $USER:$USER /var/www/rentflow
cd rentflow
```

## Step 4: Install Dependencies

### Install Frontend Dependencies
```bash
npm install
```

### Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

## Step 5: Build Frontend

```bash
npm run build
```

This creates the `dist/` directory with production-ready frontend files.

## Step 6: Configure Backend Environment

```bash
cd server
nano .env
```

Add these environment variables:
```env
SUPABASE_URL=https://cwpdgnaxrdmqxwabkhgk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGRnbmF4cmRtcXh3YWJraGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk3Nzg2OCwiZXhwIjoyMDgzNTUzODY4fQ.IGE0d4fZjesR8Y4g7MSuwZLqr6WiygBWT_1i0WCZzoY
PORT=3001
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret-key-change-this
FRONTEND_URL=https://kiminvestment.space
```

Save and exit (Ctrl+X, then Y, then Enter).

## Step 7: Configure PM2

### Start Backend with PM2
```bash
cd /var/www/rentflow/server
pm2 start src/index.js --name rentflow-api
pm2 save
pm2 startup
# Copy and run the command PM2 provides
```

## Step 8: Configure Nginx

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/kiminvestment.space
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name kiminvestment.space www.kiminvestment.space;

    # Frontend (Static Files)
    location / {
        root /var/www/rentflow/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Increase body size for file uploads
    client_max_body_size 10M;
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/kiminvestment.space /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 9: Setup SSL Certificate (HTTPS)

```bash
sudo certbot --nginx -d kiminvestment.space -d www.kiminvestment.space
```

Follow the prompts to get SSL certificate. Certbot will automatically update Nginx config.

## Step 10: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## Step 11: Verify Deployment

1. **Check Backend:**
   ```bash
   pm2 status
   pm2 logs rentflow-api
   ```

2. **Test API:**
   ```bash
   curl http://localhost:3001/api/health
   ```

3. **Visit Website:**
   - Open browser: `https://kiminvestment.space`
   - Should see login page

## Step 12: Update DNS (if not done)

Make sure your domain DNS points to the server:
- **A Record:** `@` → `77.42.74.242`
- **A Record:** `www` → `77.42.74.242`

## Troubleshooting

### Backend not starting
```bash
cd /var/www/rentflow/server
pm2 logs rentflow-api
# Check for errors
```

### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Port 3001 already in use
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
pm2 restart rentflow-api
```

### Check PM2 processes
```bash
pm2 list
pm2 logs
pm2 restart rentflow-api
```

### Update Application
```bash
cd /var/www/rentflow
git pull
npm run build
cd server
pm2 restart rentflow-api
```

## Quick Commands Reference

```bash
# View logs
pm2 logs rentflow-api

# Restart backend
pm2 restart rentflow-api

# Stop backend
pm2 stop rentflow-api

# Update and redeploy
cd /var/www/rentflow
git pull
npm run build
cd server
pm2 restart rentflow-api

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx
sudo systemctl reload nginx
```

## Security Checklist

- ✅ Firewall configured (UFW)
- ✅ SSL certificate installed (HTTPS)
- ✅ Non-root user for application
- ✅ Environment variables secured
- ✅ PM2 auto-restart configured
- ✅ Nginx reverse proxy configured

## Admin Login

- **URL:** https://kiminvestment.space
- **Email:** admin@rentflow.com
- **Password:** Rentflow@2025

## Maintenance

### Auto-update Script
Create `/var/www/rentflow/update.sh`:
```bash
#!/bin/bash
cd /var/www/rentflow
git pull
npm run build
cd server
pm2 restart rentflow-api
echo "Update complete!"
```

Make it executable:
```bash
chmod +x /var/www/rentflow/update.sh
```

Run updates:
```bash
/var/www/rentflow/update.sh
```

---

**Your app should now be live at: https://kiminvestment.space** 🚀
