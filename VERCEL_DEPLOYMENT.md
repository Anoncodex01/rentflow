# 🚀 Vercel Deployment Guide

## Deployment Options

You have **3 options** for deploying your RentFlow application:

### Option 1: Frontend on Vercel + Backend on Railway ⭐ (Recommended)

**Best for:** Production applications

**Setup:**
1. **Backend (Railway):**
   - Already configured for Railway
   - Deploys from `server/` directory
   - Environment variables:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `JWT_SECRET`
     - `NODE_ENV=production`
     - `PORT` (auto-set by Railway)

2. **Frontend (Vercel):**
   - Deploy root directory to Vercel
   - Set environment variable:
     - `VITE_API_URL` = Your Railway backend URL (e.g., `https://your-app.railway.app/api`)
   - Build command: `npm run build`
   - Output directory: `dist`

**Steps:**
```bash
# 1. Push backend to Railway (already done)
git push origin main

# 2. Get Railway backend URL
# Go to Railway → Your Project → Settings → Domains

# 3. Deploy frontend to Vercel
# Go to vercel.com → New Project
# Import from GitHub
# Set VITE_API_URL environment variable
```

---

### Option 2: Both on Vercel

**Best for:** Simple deployments, serverless architecture

**Limitations:**
- Express backend needs to be adapted to Vercel serverless functions
- More complex setup
- Better for smaller applications

**Setup:**
1. Adapt backend for Vercel serverless (requires code changes)
2. Deploy both frontend and backend to Vercel
3. Use Vercel's serverless functions for API routes

**Note:** This requires significant code changes. Option 1 is recommended.

---

### Option 3: Both on Railway (Current Setup)

**Best for:** Monorepo deployments, same infrastructure

**Setup:**
- Railway serves both frontend and backend
- Frontend built and served from `dist/`
- Backend serves frontend static files
- Single deployment, single domain

**Already configured!** Just push to GitHub and Railway auto-deploys.

---

## Quick Start: Deploy Frontend to Vercel

### Step 1: Get Your Backend URL

If using Railway:
1. Go to Railway Dashboard
2. Click your project
3. Get the domain/URL (e.g., `https://rentflow-production.up.railway.app`)

If backend is on different service, get that URL.

### Step 2: Deploy to Vercel

1. **Go to Vercel:**
   - Visit https://vercel.com
   - Sign in with GitHub

2. **Import Project:**
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Set Environment Variables:**
   - `VITE_API_URL` = `https://your-backend-url.railway.app/api`
   - Or leave empty to use default (`/api` in production)

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Get your Vercel URL

### Step 3: Update CORS (if needed)

In `server/src/index.js`, make sure CORS includes your Vercel URL:

```javascript
app.use(cors({
  origin: isProduction 
    ? [
        process.env.FRONTEND_URL, 
        'https://your-app.vercel.app',  // Add your Vercel URL
        'https://*.railway.app', 
        'https://*.up.railway.app'
      ].filter(Boolean)
    : ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

---

## Environment Variables

### Vercel (Frontend)
- `VITE_API_URL` - Your backend API URL (optional, defaults to `/api`)

### Railway (Backend)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - `production`
- `FRONTEND_URL` - Your Vercel frontend URL (for CORS)

---

## Recommendation

**Use Option 1: Frontend on Vercel + Backend on Railway**

**Why:**
- ✅ Vercel is excellent for frontend (fast CDN, automatic deployments)
- ✅ Railway is perfect for Node.js backends
- ✅ Better separation of concerns
- ✅ Easy to scale independently
- ✅ Free tiers for both

**Cost:**
- Vercel: Free tier available
- Railway: Free tier available (with usage limits)

---

## Troubleshooting

### Frontend can't connect to backend
- Check `VITE_API_URL` is set correctly in Vercel
- Verify CORS settings in backend include Vercel URL
- Check backend is running and accessible

### CORS errors
- Add your Vercel URL to backend CORS allowed origins
- Check `FRONTEND_URL` environment variable in Railway

### Build fails
- Check Node.js version (Vercel auto-detects)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

---

## Need VPS?

**Short answer: No, you don't need a VPS!**

Vercel + Railway (or just Railway) is sufficient for most applications:
- ✅ Handles scaling automatically
- ✅ No server management needed
- ✅ Free tiers available
- ✅ Easy deployments

**Only consider VPS if:**
- You need full server control
- You have specific requirements (custom software, etc.)
- You want everything on one server
- Budget allows ($5-20/month)

For this application, **Vercel + Railway is perfect!** 🚀
