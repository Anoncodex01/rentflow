// Supabase client setup
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for backend

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client with service role key (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to handle Supabase errors
export function handleSupabaseError(error) {
  console.error('Supabase error:', error);
  
  if (error.code === 'PGRST116') {
    return { error: 'Record not found' };
  }
  
  if (error.code === '23505') {
    return { error: 'Duplicate entry' };
  }
  
  if (error.code === '23503') {
    return { error: 'Foreign key constraint violation' };
  }
  
  return { error: error.message || 'Database error' };
}

// Helper to convert Supabase row to camelCase
export function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  const camelObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = value;
  }
  
  return camelObj;
}

// Helper to convert camelCase to snake_case for database
export function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const snakeObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = value;
  }
  
  return snakeObj;
}
