# RentFlow - cPanel Deployment Guide

## Prerequisites
- cPanel hosting with Node.js support (Node.js Selector)
- SSH access to your hosting server
- Domain name configured

---

## Option 1: Deploy Frontend Only (Recommended for cPanel)

If your cPanel doesn't support Node.js well, you can host the frontend on cPanel and use a separate backend service.

### Step 1: Build the Frontend

```bash
# In the project root directory
npm run build
```

This creates a `dist` folder with the production build.

### Step 2: Configure API URL

Before building, update the API URL in `src/lib/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.com/api';
```

Or create a `.env.production` file:

```
VITE_API_URL=https://your-backend-url.com/api
```

### Step 3: Upload to cPanel

1. Log into cPanel
2. Go to **File Manager**
3. Navigate to `public_html` (or your domain's directory)
4. Upload all contents from the `dist` folder
5. Make sure `.htaccess` file is uploaded (it may be hidden)

### Step 4: Test

Visit your domain - the frontend should be working!

---

## Option 2: Full Stack Deployment on cPanel (with Node.js Selector)

### Step 1: Prepare the Backend

```bash
cd server
npm install
npm run setup  # Creates database and seeds admin user
```

### Step 2: Upload Backend to cPanel

1. Create a folder in cPanel for the backend (e.g., `rentflow-api`)
2. Upload all files from the `server` folder
3. Make sure `prisma/rentflow.db` is uploaded

### Step 3: Configure Node.js in cPanel

1. Go to **Software** → **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js Version**: 18.x or higher
   - **Application Mode**: Production
   - **Application Root**: `rentflow-api` (your backend folder)
   - **Application URL**: `yourdomain.com/api` or subdomain
   - **Application Startup File**: `src/index.js`
4. Click **Create**

### Step 4: Set Environment Variables

In the Node.js App settings, add:
- `NODE_ENV`: `production`
- `PORT`: `3001` (or as assigned by cPanel)
- `JWT_SECRET`: `your-secure-secret-key`
- `DATABASE_URL`: `file:./prisma/rentflow.db`

### Step 5: Install Dependencies

Click **Run NPM Install** in the Node.js App interface.

### Step 6: Start the Application

Click **Start App** or **Restart App**.

### Step 7: Configure Proxy (if needed)

If using subdomain for API, configure in `.htaccess`:

```apache
RewriteEngine On
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]
```

---

## Option 3: Alternative - Use Railway/Render for Backend

Since SQLite works well with cPanel but Node.js can be tricky, consider:

1. **Frontend**: Host on cPanel (static files)
2. **Backend**: Host on Railway.app or Render.com (free tier available)

### Railway.app Deployment

1. Push your `server` folder to GitHub
2. Go to [railway.app](https://railway.app)
3. Create new project → Deploy from GitHub
4. Set environment variables
5. Railway provides a free URL for your API

Then update your frontend's API URL to point to Railway.

---

## Build Commands Summary

### Frontend
```bash
npm install
npm run build
# Upload `dist` folder to public_html
```

### Backend
```bash
cd server
npm install
npm run setup  # Creates DB + Admin user
npm run dev    # Development
npm start      # Production
```

---

## Admin Login Credentials

- **Email**: `admin@rentflow.com`
- **Password**: `Rentflow@2025`

---

## Troubleshooting

### Frontend shows blank page
- Check browser console for errors
- Verify `.htaccess` is uploaded and working
- Make sure all files from `dist` are uploaded

### API not working
- Check Node.js app status in cPanel
- Verify environment variables are set
- Check error logs in cPanel

### Database errors
- Make sure `rentflow.db` file exists and is writable
- Run `npx prisma db push` if needed

### CORS errors
- Update `FRONTEND_URL` in backend environment
- Check CORS configuration in `server/src/index.js`

---

## File Structure After Deployment

```
public_html/
├── index.html
├── assets/
│   ├── index-xxx.js
│   └── index-xxx.css
├── .htaccess
└── favicon.ico

rentflow-api/  (or separate location)
├── src/
│   └── index.js
├── prisma/
│   ├── schema.prisma
│   └── rentflow.db
├── node_modules/
├── package.json
└── .env
```

---

## Support

For issues, check:
1. cPanel error logs
2. Node.js app logs
3. Browser developer console

