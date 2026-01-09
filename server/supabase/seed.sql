-- Seed initial admin user
-- Password: Rentflow@2025 (bcrypt hashed)
-- 
-- To generate the hash, run:
-- node supabase/generate-hash.js
--
-- Then replace the hash below with the generated one

INSERT INTO users (email, password, name, role) 
VALUES (
  'admin@rentflow.com',
  '$2a$10$Q6rRN96tCj9n5CR7./exielcGJKuHV/Lont4Hgs/.ngLoCtYtyFhO', -- Run generate-hash.js first!
  'Admin User',
  'admin'
) ON CONFLICT (email) DO NOTHING;
