// Migration script to copy data from local SQLite to Railway PostgreSQL
// Usage: DATABASE_URL="postgresql://..." node prisma/migrate-data.js

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Local SQLite database
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./rentflow.db',
    },
  },
});

// Railway PostgreSQL database (from environment variable)
const railwayDatabaseUrl = process.env.DATABASE_URL;

if (!railwayDatabaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is required');
  console.log('\n📝 Usage:');
  console.log('   DATABASE_URL="postgresql://user:password@host:port/database" node prisma/migrate-data.js');
  console.log('\n💡 Get your Railway DATABASE_URL from:');
  console.log('   Railway Dashboard → Your Project → Database → Connect → Connection URL');
  process.exit(1);
}

const railwayPrisma = new PrismaClient({
  datasources: {
    db: {
      url: railwayDatabaseUrl,
    },
  },
});

async function migrateData() {
  try {
    console.log('🚀 Starting data migration...\n');

    // Test connections
    console.log('📡 Testing database connections...');
    await localPrisma.$connect();
    console.log('✅ Local SQLite connected');
    
    await railwayPrisma.$connect();
    console.log('✅ Railway database connected\n');

    // 1. Migrate Users
    console.log('👤 Migrating Users...');
    const users = await localPrisma.user.findMany();
    if (users.length > 0) {
      // Delete existing users in Railway (optional - comment out if you want to keep existing)
      // await railwayPrisma.user.deleteMany();
      
      for (const user of users) {
        await railwayPrisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            password: user.password,
            role: user.role,
            avatar: user.avatar,
          },
          create: {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        });
      }
      console.log(`   ✅ Migrated ${users.length} users`);
    } else {
      console.log('   ℹ️  No users to migrate');
    }

    // 2. Migrate Rooms
    console.log('\n🏠 Migrating Rooms...');
    const rooms = await localPrisma.room.findMany();
    if (rooms.length > 0) {
      for (const room of rooms) {
        await railwayPrisma.room.upsert({
          where: { roomNumber: room.roomNumber },
          update: {
            roomName: room.roomName,
            monthlyRent: room.monthlyRent,
            status: room.status,
            images: room.images,
            notes: room.notes,
          },
          create: {
            id: room.id,
            roomNumber: room.roomNumber,
            roomName: room.roomName,
            monthlyRent: room.monthlyRent,
            status: room.status,
            images: room.images,
            notes: room.notes,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
          },
        });
      }
      console.log(`   ✅ Migrated ${rooms.length} rooms`);
    } else {
      console.log('   ℹ️  No rooms to migrate');
    }

    // 3. Migrate Tenants
    console.log('\n👥 Migrating Tenants...');
    const tenants = await localPrisma.tenant.findMany();
    if (tenants.length > 0) {
      for (const tenant of tenants) {
        await railwayPrisma.tenant.upsert({
          where: { roomId: tenant.roomId },
          update: {
            name: tenant.name,
            phone: tenant.phone,
            idNumber: tenant.idNumber,
            moveInDate: tenant.moveInDate,
            moveOutDate: tenant.moveOutDate,
            roomId: tenant.roomId,
          },
          create: {
            id: tenant.id,
            name: tenant.name,
            phone: tenant.phone,
            idNumber: tenant.idNumber,
            moveInDate: tenant.moveInDate,
            moveOutDate: tenant.moveOutDate,
            roomId: tenant.roomId,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
          },
        });
      }
      console.log(`   ✅ Migrated ${tenants.length} tenants`);
    } else {
      console.log('   ℹ️  No tenants to migrate');
    }

    // 4. Migrate Payments
    console.log('\n💰 Migrating Payments...');
    const payments = await localPrisma.payment.findMany();
    if (payments.length > 0) {
      // Delete existing payments first (to avoid duplicates)
      // await railwayPrisma.payment.deleteMany();
      
      for (const payment of payments) {
        await railwayPrisma.payment.create({
          data: {
            id: payment.id,
            amount: payment.amount,
            datePaid: payment.datePaid,
            monthPaidFor: payment.monthPaidFor,
            status: payment.status,
            batchId: payment.batchId,
            tenantId: payment.tenantId,
            roomId: payment.roomId,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
          },
        }).catch((err) => {
          // If payment already exists, skip it
          if (err.code === 'P2002') {
            console.log(`   ⚠️  Payment ${payment.id} already exists, skipping...`);
          } else {
            throw err;
          }
        });
      }
      console.log(`   ✅ Migrated ${payments.length} payments`);
    } else {
      console.log('   ℹ️  No payments to migrate');
    }

    // 5. Migrate Alerts
    console.log('\n🔔 Migrating Alerts...');
    const alerts = await localPrisma.alert.findMany();
    if (alerts.length > 0) {
      for (const alert of alerts) {
        await railwayPrisma.alert.create({
          data: {
            id: alert.id,
            type: alert.type,
            message: alert.message,
            roomId: alert.roomId,
            tenantId: alert.tenantId,
            date: alert.date,
            isRead: alert.isRead,
            createdAt: alert.createdAt,
          },
        }).catch((err) => {
          // If alert already exists, skip it
          if (err.code === 'P2002') {
            console.log(`   ⚠️  Alert ${alert.id} already exists, skipping...`);
          } else {
            throw err;
          }
        });
      }
      console.log(`   ✅ Migrated ${alerts.length} alerts`);
    } else {
      console.log('   ℹ️  No alerts to migrate');
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Rooms: ${rooms.length}`);
    console.log(`   Tenants: ${tenants.length}`);
    console.log(`   Payments: ${payments.length}`);
    console.log(`   Alerts: ${alerts.length}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await localPrisma.$disconnect();
    await railwayPrisma.$disconnect();
  }
}

migrateData()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
