#!/bin/bash
# VPS Server Setup Script for kiminvestment.space
# Run this on your VPS: bash server-setup.sh

set -e

echo "🚀 Starting RentFlow VPS Setup..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update system
echo -e "${YELLOW}📦 Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo -e "${GREEN}✅ Node.js $(node --version) installed${NC}"

# Install PM2
echo -e "${YELLOW}📦 Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo -e "${GREEN}✅ PM2 installed${NC}"

# Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi
echo -e "${GREEN}✅ Nginx installed${NC}"

# Install Certbot
echo -e "${YELLOW}📦 Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
fi
echo -e "${GREEN}✅ Certbot installed${NC}"

# Install Git
echo -e "${YELLOW}📦 Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt install -y git
fi
echo -e "${GREEN}✅ Git installed${NC}"

# Clone repository
echo -e "${YELLOW}📦 Cloning repository...${NC}"
if [ ! -d "/var/www/rentflow" ]; then
    sudo mkdir -p /var/www
    cd /var/www
    sudo git clone https://github.com/Anoncodex01/rentflow.git
    sudo chown -R $USER:$USER /var/www/rentflow
else
    echo -e "${YELLOW}⚠️  Repository already exists, skipping clone${NC}"
fi
cd /var/www/rentflow

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install

# Build frontend
echo -e "${YELLOW}📦 Building frontend...${NC}"
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd server
npm install

# Create .env file if it doesn't exist
echo -e "${YELLOW}📝 Creating .env file...${NC}"
if [ ! -f ".env" ]; then
    cat > .env << EOF
SUPABASE_URL=https://cwpdgnaxrdmqxwabkhgk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGRnbmF4cmRtcXh3YWJraGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk3Nzg2OCwiZXhwIjoyMDgzNTUzODY4fQ.IGE0d4fZjesR8Y4g7MSuwZLqr6WiygBWT_1i0WCZzoY
PORT=3001
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
FRONTEND_URL=https://kiminvestment.space
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping${NC}"
fi

# Start backend with PM2
echo -e "${YELLOW}🚀 Starting backend with PM2...${NC}"
pm2 delete rentflow-api 2>/dev/null || true
pm2 start src/index.js --name rentflow-api
pm2 save

# Setup PM2 startup
echo -e "${YELLOW}📦 Setting up PM2 startup...${NC}"
pm2 startup | tail -n 1 | sudo bash || true

echo -e "${GREEN}✅ Backend started with PM2${NC}"

# Configure Nginx
echo -e "${YELLOW}📝 Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/kiminvestment.space > /dev/null << 'EOF'
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
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/kiminvestment.space /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
echo -e "${GREEN}✅ Nginx configured${NC}"

# Configure Firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable
echo -e "${GREEN}✅ Firewall configured${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update DNS to point kiminvestment.space to 77.42.74.242"
echo "2. Run SSL setup: sudo certbot --nginx -d kiminvestment.space -d www.kiminvestment.space"
echo "3. Visit: http://kiminvestment.space"
echo ""
echo "Check backend status: pm2 status"
echo "View logs: pm2 logs rentflow-api"
echo ""
