# 🚂 Railway Deployment Guide

## ⚠️ IMPORTANT: Data Protection

**Your data is now SAFE!** The deployment process has been updated to prevent data loss.

### What Changed?

**Before (UNSAFE):**
- `prisma db push` ran on EVERY deployment
- Could potentially reset database on schema changes

**Now (SAFE):**
- Database is checked before any migration
- Migrations only run if database is empty (first deploy)
- Existing data is NEVER touched on updates

## How It Works

1. **On First Deploy:**
   - Database is empty → Schema is created
   - Admin user is seeded (if seed script runs)

2. **On Subsequent Deploys:**
   - Database is checked → Already has data
   - **NO migration runs** → Data is preserved
   - Server starts normally

3. **On Schema Changes:**
   - If you need to add new fields, use Prisma migrations (see below)

## Deployment Process

### Initial Setup

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix: Prevent data loss on Railway deployments"
   git push
   ```

2. **Railway will automatically:**
   - Build the project
   - Generate Prisma Client
   - Run the safe startup script
   - Initialize database (first time only)

### Migrating Local Data to Railway

See `MIGRATE_DATA.md` for detailed instructions on copying your local SQLite data to Railway PostgreSQL.

## Making Schema Changes Safely

If you need to add/modify database fields:

### Option 1: Use Prisma Migrations (Recommended)

```bash
cd server

# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_new_field

# 3. Push to GitHub
git add .
git commit -m "Add new field to schema"
git push
```

Railway will apply the migration automatically.

### Option 2: Manual Migration

1. Update `schema.prisma`
2. Push to GitHub
3. Railway will detect the change
4. The safe startup script will apply it (only if safe)

## Environment Variables

Make sure these are set in Railway:

- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Railway)
- `JWT_SECRET` - Your JWT secret key
- `NODE_ENV` - `production`
- `FRONTEND_URL` - Your frontend URL (if different domain)
- `PORT` - Usually auto-set by Railway

## Troubleshooting

### Data Still Getting Deleted?

1. **Check Railway Logs:**
   - Look for "Database ready - no migration needed"
   - Should NOT see "Initializing database schema" on updates

2. **Verify DATABASE_URL:**
   - Make sure Railway database service is persistent
   - Check that DATABASE_URL doesn't change between deploys

3. **Check Database Service:**
   - In Railway, make sure your database service is NOT being recreated
   - Database should be a separate service, not part of the app

### Database Connection Errors

- Check Railway database service is running
- Verify DATABASE_URL is correct
- Check network connectivity in Railway logs

### Schema Changes Not Applying

- Use Prisma migrations for production changes
- Check Railway logs for migration errors
- Verify schema.prisma is committed to GitHub

## Backup Strategy

**Always backup before major changes:**

1. **Export data from Railway:**
   ```bash
   # Use Prisma Studio or pg_dump
   DATABASE_URL="your-railway-url" npx prisma studio
   ```

2. **Or use the migration script in reverse:**
   - Modify `migrate-data.js` to export FROM Railway TO local

## Current Protection Status

✅ **Safe startup script** - Only migrates if database is empty  
✅ **Data preservation** - Existing data is never touched  
✅ **Schema sync** - Only creates missing tables  
✅ **Error handling** - Graceful fallbacks if migration fails  

## Need Help?

If you experience data loss:
1. Check Railway logs immediately
2. Verify DATABASE_URL hasn't changed
3. Check if database service was recreated
4. Contact Railway support if database service was reset
