# 🔧 Fix: Invalid Token & Image Storage Setup

## Issues Fixed

1. ✅ **Invalid Token Error** - Auth middleware was still using Prisma (now fixed to use Supabase)
2. ✅ **Image Storage** - Created Supabase Storage bucket setup

## Step 1: Fix Authentication (Already Fixed in Code)

The auth middleware has been updated to use Supabase instead of Prisma.

## Step 2: Create Supabase Storage Bucket

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `server/supabase/storage-setup.sql`
4. Click **Run**

This will create:
- Storage bucket: `room-images`
- Public read access (images accessible via URL)
- Policies for upload/update/delete

## Step 3: Deploy Updated Code to VPS

Run these commands on your VPS:

```bash
ssh root@77.42.74.242
# Enter password: Rentflow@2025@

cd /var/www/rentflow
git pull
cd server
pm2 restart rentflow-api
```

Or use the automated update:

```bash
cd /var/www/rentflow
git pull
npm run build
cd server
pm2 restart rentflow-api
```

## Step 4: Test

1. **Login again** - The token should work now
2. **Add a room** - Should work without "Invalid token" error
3. **Upload images** - Images will be stored as base64 in database (for now)

## Current Image Storage

**For now:** Images are stored as base64 strings in the database (JSONB field). This works but has limitations:
- ✅ Simple implementation
- ❌ Larger database size
- ❌ Limited to ~5MB per image

**Future:** After creating the storage bucket, we can update to use Supabase Storage for better performance.

## Quick Fix Summary

### 1. Run Storage Setup SQL in Supabase
- Open Supabase SQL Editor
- Run `server/supabase/storage-setup.sql`

### 2. Update Server Code
```bash
cd /var/www/rentflow
git pull
cd server
pm2 restart rentflow-api
```

### 3. Test Login & Add Room
- Login should work now
- Adding rooms should work without token errors

---

**The authentication fix is critical - make sure to restart the backend after pulling the code!**
