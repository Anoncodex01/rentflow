// Safe database initialization script
// Only runs migrations if database is not initialized
// Prevents data loss on deployments

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log('🔍 Checking database initialization...');
    
    // Check if database is already initialized by checking if User table exists
    const userCount = await prisma.user.count().catch(() => null);
    
    if (userCount !== null) {
      console.log('✅ Database already initialized');
      console.log(`   Found ${userCount} user(s) in database`);
      return { initialized: true, needsMigration: false };
    }
    
    // If we get here, database might not be initialized
    // But let's be safe - check if any tables exist
    try {
      const roomCount = await prisma.room.count();
      const tenantCount = await prisma.tenant.count();
      const paymentCount = await prisma.payment.count();
      
      console.log('✅ Database tables exist');
      console.log(`   Rooms: ${roomCount}, Tenants: ${tenantCount}, Payments: ${paymentCount}`);
      return { initialized: true, needsMigration: false };
    } catch (error) {
      // Tables don't exist, need to initialize
      console.log('⚠️  Database tables not found, initializing...');
      return { initialized: false, needsMigration: true };
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    // If it's a connection error, don't initialize (might be temporary)
    if (error.code === 'P1001' || error.message.includes('connect')) {
      console.log('⚠️  Database connection issue, skipping initialization');
      return { initialized: false, needsMigration: false, error: true };
    }
    // For other errors, assume we need to initialize
    return { initialized: false, needsMigration: true };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then((result) => {
      if (result.needsMigration && !result.error) {
        console.log('\n📝 Database needs initialization');
        console.log('   Run: npx prisma db push');
        process.exit(1); // Signal that migration is needed
      } else if (result.error) {
        process.exit(2); // Connection error
      } else {
        process.exit(0); // Already initialized
      }
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export default initializeDatabase;
