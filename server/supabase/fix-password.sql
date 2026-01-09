-- Fix admin password - Run this in Supabase SQL Editor
-- Password: Rentflow@2025

-- First, generate a new hash by running:
-- node supabase/generate-hash.js
-- Then replace the hash below

-- Update existing admin user password
UPDATE users 
SET password = '$2a$10$mDJKcNPWb42vx2Hntwq1OOaq/ytNerp38g37U87vI/4wnjzpwNrm2'
WHERE email = 'admin@rentflow.com';

-- If user doesn't exist, use this instead:
INSERT INTO users (email, password, name, role) 
VALUES (
  'admin@rentflow.com',
  '$2a$10$mDJKcNPWb42vx2Hntwq1OOaq/ytNerp38g37U87vI/4wnjzpwNrm2',
  'Admin User',
  'admin'
) ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password;
