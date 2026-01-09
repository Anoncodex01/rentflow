// Safe startup script for Railway
// Only runs migrations if database is not initialized
// PREVENTS DATA LOSS on deployments

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Try to query the database - if it works, it's initialized
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected (${userCount} users found)`);
    return { initialized: true, error: false };
  } catch (error) {
    // Check if it's a "table doesn't exist" error
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.log('⚠️  Database tables not found - needs initialization');
      return { initialized: false, error: false };
    }
    // Connection error
    if (error.code === 'P1001' || error.message.includes('connect')) {
      console.log('⚠️  Database connection error - will retry');
      return { initialized: false, error: true };
    }
    // Other error - assume not initialized
    console.log('⚠️  Database check failed:', error.message);
    return { initialized: false, error: false };
  } finally {
    await prisma.$disconnect();
  }
}

async function start() {
  console.log('🚀 Starting RentFlow server...\n');
  
  // Check if database is initialized
  const dbStatus = await checkDatabase();
  
  if (!dbStatus.initialized && !dbStatus.error) {
    console.log('\n📦 Initializing database schema (first time only)...');
    try {
      // Use db push WITHOUT --accept-data-loss to be safe
      // This will only create tables if they don't exist
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
  } else {
    console.log('✅ Database ready - no migration needed\n');
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
