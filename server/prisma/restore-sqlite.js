// Helper script to restore SQLite schema after migration

import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = join(__dirname, 'schema.prisma');
const backupPath = join(__dirname, 'schema.prisma.sqlite.backup');

try {
  if (!existsSync(backupPath)) {
    console.error('❌ Backup file not found. Cannot restore.');
    process.exit(1);
  }
  
  // Restore original schema
  copyFileSync(backupPath, schemaPath);
  console.log('✅ Restored SQLite schema');
  console.log('\n📝 Next step:');
  console.log('   Run: npx prisma generate (to regenerate Prisma Client for SQLite)');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
