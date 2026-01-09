# 📦 How to Migrate Data from Local SQLite to Railway PostgreSQL

This guide will help you copy all your local data to Railway's database.

## Step 1: Get Your Railway Database URL

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Click on your **Database** service
4. Go to the **Connect** tab
5. Copy the **Connection URL** (it looks like: `postgresql://postgres:password@host:port/railway`)

## Step 2: Switch Schema to PostgreSQL (Temporary)

Railway uses PostgreSQL, so we need to temporarily update the schema. Use the helper script:

```bash
cd server
node prisma/switch-to-postgres.js
```

This will:
- ✅ Backup your SQLite schema
- ✅ Switch to PostgreSQL
- ✅ Show next steps

**Note:** Don't worry - you can switch back to SQLite after migration!

## Step 3: Generate Prisma Client for PostgreSQL

```bash
cd server
npx prisma generate
```

## Step 4: Run the Migration Script

From the `server` directory, run:

```bash
cd server
DATABASE_URL="your-railway-postgresql-url-here" npm run migrate:to-railway
```

Or directly:
```bash
cd server
DATABASE_URL="your-railway-postgresql-url-here" node prisma/migrate-data.js
```

**Example:**
```bash
cd server
DATABASE_URL="postgresql://postgres:abc123@containers-us-west-123.railway.app:5432/railway" node prisma/migrate-data.js
```

## Step 5: Switch Back to SQLite (Optional)

If you want to continue using SQLite locally:

```bash
cd server
node prisma/restore-sqlite.js
npx prisma generate
```

**Note:** For Railway deployment, keep PostgreSQL. Only switch back if you want to use SQLite locally.

## Step 6: Verify the Migration

The script will:
- ✅ Connect to both databases
- ✅ Migrate Users
- ✅ Migrate Rooms
- ✅ Migrate Tenants
- ✅ Migrate Payments
- ✅ Migrate Alerts
- ✅ Show a summary

## Troubleshooting

### Error: "DATABASE_URL environment variable is required"
- Make sure you're passing the DATABASE_URL correctly
- Use quotes around the URL if it contains special characters

### Error: "Connection refused" or "Cannot connect"
- Check that your Railway database is running
- Verify the DATABASE_URL is correct
- Make sure Railway database is publicly accessible (check Railway settings)

### Error: "Table does not exist"
- Make sure you've run `npx prisma db push` on Railway first
- The schema should be migrated before importing data

### Duplicate data
- The script uses `upsert` for Users, Rooms, and Tenants (won't create duplicates)
- Payments and Alerts will skip if they already exist (based on ID)

## Alternative: Manual Export/Import

If the script doesn't work, you can:

1. **Export from SQLite:**
   ```bash
   sqlite3 server/prisma/rentflow.db .dump > backup.sql
   ```

2. **Use Prisma Studio to view data:**
   ```bash
   cd server
   npx prisma studio
   ```

3. **Manually copy data** using Railway's database interface or Prisma Studio

## Next Steps

After migration:
1. ✅ Verify data in Railway dashboard
2. ✅ Test your app on Railway
3. ✅ Keep local database as backup
