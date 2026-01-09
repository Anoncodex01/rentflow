# ⚡ Quick Start: Deploy to VPS

## Server Details
- **IP:** 77.42.74.242
- **Domain:** kiminvestment.space
- **SSH:** `ssh Rentflow@2025@77.42.74.242` (or use root/your-username)

## 🚀 Quick Deployment (Automated)

### Step 1: SSH into Server
```bash
ssh Rentflow@2025@77.42.74.242
# Or if different username:
ssh root@77.42.74.242
# Enter password when prompted
```

### Step 2: Download and Run Setup Script
```bash
cd /tmp
wget https://raw.githubusercontent.com/Anoncodex01/rentflow/main/server-setup.sh
chmod +x server-setup.sh
bash server-setup.sh
```

**OR** if already on server:
```bash
cd /var/www
git clone https://github.com/Anoncodex01/rentflow.git
cd rentflow
chmod +x server-setup.sh
bash server-setup.sh
```

The script will:
- ✅ Install Node.js, PM2, Nginx, Certbot
- ✅ Clone repository
- ✅ Install dependencies
- ✅ Build frontend
- ✅ Configure backend
- ✅ Setup PM2
- ✅ Configure Nginx
- ✅ Setup firewall

### Step 3: Setup SSL (HTTPS)
```bash
sudo certbot --nginx -d kiminvestment.space -d www.kiminvestment.space
```

Follow the prompts to get SSL certificate.

### Step 4: Verify DNS
Make sure your domain DNS points to server:
- **A Record:** `@` → `77.42.74.242`
- **A Record:** `www` → `77.42.74.242`

### Step 5: Test
Visit: **https://kiminvestment.space**

---

## 📝 Manual Deployment (If Needed)

If the automated script doesn't work, follow these steps:

### 1. Install Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/Anoncodex01/rentflow.git
sudo chown -R $USER:$USER /var/www/rentflow
cd rentflow
```

### 3. Build Frontend
```bash
npm install
npm run build
```

### 4. Setup Backend
```bash
cd server
npm install

# Create .env file
nano .env
```

Add to `.env`:
```env
SUPABASE_URL=https://cwpdgnaxrdmqxwabkhgk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGRnbmF4cmRtcXh3YWJraGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk3Nzg2OCwiZXhwIjoyMDgzNTUzODY4fQ.IGE0d4fZjesR8Y4g7MSuwZLqr6WiygBWT_1i0WCZzoY
PORT=3001
NODE_ENV=production
JWT_SECRET=your-secure-secret-key-here
FRONTEND_URL=https://kiminvestment.space
```

### 5. Start Backend
```bash
pm2 start src/index.js --name rentflow-api
pm2 save
pm2 startup  # Follow instructions
```

### 6. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/kiminvestment.space
```

Paste this config:
```nginx
server {
    listen 80;
    server_name kiminvestment.space www.kiminvestment.space;

    location / {
        root /var/www/rentflow/dist;
        try_files $uri $uri/ /index.html;
    }

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
    }

    client_max_body_size 10M;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/kiminvestment.space /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Setup SSL
```bash
sudo certbot --nginx -d kiminvestment.space -d www.kiminvestment.space
```

---

## 🔧 Useful Commands

```bash
# Check backend status
pm2 status
pm2 logs rentflow-api

# Restart backend
pm2 restart rentflow-api

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Update application
cd /var/www/rentflow
git pull
npm run build
cd server
pm2 restart rentflow-api
```

## 🔐 Admin Login
- **URL:** https://kiminvestment.space
- **Email:** admin@rentflow.com
- **Password:** Rentflow@2025

## ✅ Done!
Your app should now be live at: **https://kiminvestment.space** 🚀
