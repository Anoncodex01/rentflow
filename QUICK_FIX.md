# 🔧 Quick Fix: "Failed to fetch" Error

## Problem
The server can't start because Supabase environment variables are missing.

## Solution

### Step 1: Create `.env` file

Create a file named `.env` in the `server` directory with this content:

```env
# Supabase Configuration
SUPABASE_URL=https://cwpdgnaxrdmqxwabkhgk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGRnbmF4cmRtcXh3YWJraGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Nzc4NjgsImV4cCI6MjA4MzU1Mzg2OH0.sbVgG2M0x0fviEbFiiF8DkL1K6MtZuLilAlf8Kr3iyU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGRnbmF4cmRtcXh3YWJraGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk3Nzg2OCwiZXhwIjoyMDgzNTUzODY4fQ.IGE0d4fZjesR8Y4g7MSuwZLqr6WiygBWT_1i0WCZzoY

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=rentflow-secret-key-change-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080
```

### Step 2: Install dotenv package

```bash
cd server
npm install
```

### Step 3: Make sure Supabase database is set up

1. Go to Supabase Dashboard → SQL Editor
2. Run `server/supabase/schema.sql` to create tables
3. Run `server/supabase/seed.sql` to create admin user

### Step 4: Start the server

```bash
cd server
npm run dev
```

You should see:
```
🚀 RentFlow running on port 3001
✅ Database ready
```

### Step 5: Test login

- Email: `admin@rentflow.com`
- Password: `Rentflow@2025`

## Still not working?

1. **Check if server is running:**
   - Look for "RentFlow running on port 3001" in terminal
   - Visit http://localhost:3001/api/health

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for CORS errors or network errors

3. **Check server logs:**
   - Look for error messages about missing environment variables
   - Look for Supabase connection errors

4. **Verify Supabase setup:**
   - Make sure tables exist in Supabase
   - Make sure admin user exists
