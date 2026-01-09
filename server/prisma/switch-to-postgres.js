// Helper script to temporarily switch schema to PostgreSQL for migration
// This backs up your SQLite schema and creates a PostgreSQL version

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = join(__dirname, 'schema.prisma');
const backupPath = join(__dirname, 'schema.prisma.sqlite.backup');

try {
  // Read current schema
  const schema = readFileSync(schemaPath, 'utf-8');
  
  // Backup original schema
  if (!existsSync(backupPath)) {
    copyFileSync(schemaPath, backupPath);
    console.log('✅ Backed up original SQLite schema');
  }
  
  // Replace SQLite with PostgreSQL
  const postgresSchema = schema
    .replace(/provider = "sqlite"/, 'provider = "postgresql"')
    .replace(/url\s*=\s*"file:\.\/rentflow\.db"/, 'url      = env("DATABASE_URL")')
    .replace(/\/\/ SQLite Database/, '// PostgreSQL Database (for Railway)');
  
  // Write updated schema
  writeFileSync(schemaPath, postgresSchema);
  console.log('✅ Switched schema to PostgreSQL');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npx prisma generate');
  console.log('   2. Run: DATABASE_URL="your-railway-url" npm run migrate:to-railway');
  console.log('   3. Run: node prisma/restore-sqlite.js (to switch back)');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
