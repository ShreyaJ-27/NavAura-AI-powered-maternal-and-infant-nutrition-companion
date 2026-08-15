import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fzbvzfsabgisymipbbfj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnZ6ZnNhYmdpc3ltaXBiYmZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3OTg1MCwiZXhwIjoyMTAyMzU1ODUwfQ.P25NZlOrtHd2bvf1jhySW9Z8ctzdt5xuo7JBKz6_620';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('Testing Supabase Service Role connection...');
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Admin user list error:', userError);
  } else {
    console.log(`Successfully connected! Found ${users.users.length} registered users.`);
  }
}

run();
