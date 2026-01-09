// Script to generate bcrypt hash for admin password
// Run: node supabase/generate-hash.js

import bcrypt from 'bcryptjs';

const password = 'Rentflow@2025';
const hash = await bcrypt.hash(password, 10);

console.log('\n✅ Generated bcrypt hash:');
console.log(hash);
console.log('\n📝 Copy this hash to server/supabase/seed.sql\n');
