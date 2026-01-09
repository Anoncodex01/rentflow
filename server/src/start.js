// Safe startup script for Railway
// Only runs migrations if database is not initialized
// PREVENTS DATA LOSS on deployments

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Comprehensive check: Try to query multiple tables to ensure database has data
    // This prevents accidental migration if only one table is empty
    
    const [userCount, roomCount, tenantCount, paymentCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.room.count().catch(() => 0),
      prisma.tenant.count().catch(() => 0),
      prisma.payment.count().catch(() => 0)
    ]);

    const totalRecords = userCount + roomCount + tenantCount + paymentCount;
    
    if (totalRecords > 0) {
      console.log(`✅ Database connected and has data:`);
      console.log(`   Users: ${userCount}, Rooms: ${roomCount}, Tenants: ${tenantCount}, Payments: ${paymentCount}`);
      console.log(`   Total records: ${totalRecords}`);
      return { initialized: true, error: false, recordCount: totalRecords };
    } else {
      // Database exists but is empty - safe to initialize
      console.log('✅ Database connected but empty - safe to initialize');
      return { initialized: false, error: false, recordCount: 0 };
    }
  } catch (error) {
    // Check if it's a "table doesn't exist" error
    if (error.code === 'P2021' || error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
      console.log('⚠️  Database tables not found - needs initialization');
      return { initialized: false, error: false, recordCount: 0 };
    }
    // Connection error
    if (error.code === 'P1001' || error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.log('⚠️  Database connection error - will retry');
      return { initialized: false, error: true, recordCount: 0 };
    }
    // Other error - be conservative and assume database has data
    console.log('⚠️  Database check failed:', error.message);
    console.log('⚠️  Assuming database has data to prevent data loss');
    return { initialized: true, error: false, recordCount: -1 }; // -1 means unknown, but safe
  } finally {
    await prisma.$disconnect();
  }
}

async function start() {
  console.log('🚀 Starting RentFlow server...\n');
  
  // Check if database is initialized
  const dbStatus = await checkDatabase();
  
  if (!dbStatus.initialized && !dbStatus.error && dbStatus.recordCount === 0) {
    // ONLY run migration if database is confirmed empty (0 records)
    console.log('\n📦 Initializing database schema (first time only - database is empty)...');
    console.log('   ⚠️  SAFETY: Migration will only run because database has 0 records');
    try {
      // Use db push WITHOUT --accept-data-loss to be safe
      // This will only create tables/columns, never delete data
      // --skip-generate: Don't regenerate Prisma Client (already done in build)
      execSync('npx prisma db push --skip-generate', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Database schema initialized\n');
    } catch (error) {
      console.error('❌ Schema initialization failed:', error.message);
      console.log('⚠️  Starting server anyway (schema might already exist)...\n');
    }
  } else if (dbStatus.error) {
    console.log('⚠️  Database connection issue, starting server anyway...\n');
    console.log('   (Server will retry connection on first request)\n');
  } else if (dbStatus.initialized) {
    // Database has data - NEVER run migration
    console.log('✅ Database ready - no migration needed (data protection active)\n');
    if (dbStatus.recordCount > 0) {
      console.log(`   🔒 Data protection: ${dbStatus.recordCount} records detected - migration skipped\n`);
    }
  } else {
    // Unknown state - be safe and don't migrate
    console.log('⚠️  Database state unknown - skipping migration for safety\n');
    console.log('   🔒 Data protection: Migration skipped to prevent data loss\n');
  }
  
  // Start the server
  console.log('🌐 Starting Express server...\n');
  // Dynamic import to start the server
  await import('./index.js');
}

start().catch((error) => {
  console.error('💥 Failed to start:', error);
  process.exit(1);
});
