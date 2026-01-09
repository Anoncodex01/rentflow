# 🚀 Supabase Migration Guide

This guide will help you migrate from Prisma to Supabase.

## Step 1: Set Up Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `server/supabase/schema.sql`
4. Click **Run** to create all tables

## Step 2: Seed Admin User

1. In Supabase SQL Editor, open `server/supabase/seed.sql`
2. **IMPORTANT**: Generate the bcrypt hash for the password first:

```javascript
// Run this in Node.js to generate the hash
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('Rentflow@2025', 10);
console.log(hash);
```

3. Replace the placeholder hash in `seed.sql` with the actual hash
4. Run the seed script in SQL Editor

## Step 3: Set Environment Variables

Create a `.env` file in the `server` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://cwpdgnaxrdmqxwabkhgk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGRnbmF4cmRtcXh3YWJraGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Nzc4NjgsImV4cCI6MjA4MzU1Mzg2OH0.sbVgG2M0x0fviEbFiiF8DkL1K6MtZuLilAlf8Kr3iyU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGRnbmF4cmRtcXh3YWJraGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk3Nzg2OCwiZXhwIjoyMDgzNTUzODY4fQ.IGE0d4fZjesR8Y4g7MSuwZLqr6WiygBWT_1i0WCZzoY

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-secret-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080
```

## Step 4: Install Dependencies

```bash
cd server
npm install
```

This will install `@supabase/supabase-js` and remove Prisma dependencies.

## Step 5: Migrate Existing Data (Optional)

If you have existing data in Prisma/SQLite, you can migrate it:

1. Export data from your current database
2. Use Supabase's import feature or write a migration script
3. Data structure is the same, just column names are snake_case instead of camelCase

## Step 6: Update Railway Environment Variables

In Railway dashboard, add these environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `NODE_ENV=production`
- `FRONTEND_URL` (your frontend URL)

## Step 7: Test the Migration

1. Start the server: `npm run dev`
2. Test login with: `admin@rentflow.com` / `Rentflow@2025`
3. Verify all endpoints work correctly

## Key Changes

### Database Schema
- **UUIDs** instead of CUIDs for IDs
- **snake_case** column names (Supabase convention)
- **JSONB** for images array (better performance)
- **TIMESTAMPTZ** for timestamps

### API Changes
- All routes now use Supabase client
- Automatic camelCase conversion for responses
- Same API endpoints, no frontend changes needed

### Benefits
- ✅ Managed database (no server setup)
- ✅ Built-in authentication (can use later)
- ✅ Real-time subscriptions (can add later)
- ✅ Better scalability
- ✅ Automatic backups

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure `.env` file exists in `server` directory
- Check that all variables are set correctly

### Error: "relation does not exist"
- Run the SQL schema in Supabase SQL Editor
- Make sure all tables were created

### Data not showing
- Check that data was migrated correctly
- Verify column names match (snake_case in DB, camelCase in API)

## Next Steps

After migration:
1. ✅ Test all CRUD operations
2. ✅ Verify data integrity
3. ✅ Update Railway deployment
4. ✅ Monitor Supabase dashboard for usage
