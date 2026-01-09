// Startup script for Railway with Supabase
// Supabase is a managed database, so no migration needed

import { supabase } from './lib/supabase.js';

async function checkDatabase() {
  try {
    // Simple check to verify Supabase connection
    const { data, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.log('⚠️  Database connection check failed:', error.message);
      return { connected: false, error: true };
    }

    console.log('✅ Supabase database connected');
    return { connected: true, error: false };
  } catch (error) {
    console.log('⚠️  Database check error:', error.message);
    return { connected: false, error: true };
  }
}

async function start() {
  console.log('🚀 Starting RentFlow server...\n');
  
  // Check database connection
  const dbStatus = await checkDatabase();
  
  if (dbStatus.error) {
    console.log('⚠️  Database connection issue, starting server anyway...\n');
    console.log('   (Server will retry connection on first request)\n');
  } else {
    console.log('✅ Database ready\n');
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
