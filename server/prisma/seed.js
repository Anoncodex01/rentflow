import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.payment.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user only
  const hashedPassword = await bcrypt.hash('Rentflow@2025', 10);

  await prisma.user.create({
    data: {
      email: 'admin@rentflow.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin'
    }
  });

  console.log('✅ Admin user created');
  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📧 Admin Login:');
  console.log('   Email: admin@rentflow.com');
  console.log('   Password: Rentflow@2025');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
