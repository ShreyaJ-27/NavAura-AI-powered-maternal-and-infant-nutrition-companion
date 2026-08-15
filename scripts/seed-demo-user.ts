import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fzbvzfsabgisymipbbfj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnZ6ZnNhYmdpc3ltaXBiYmZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3OTg1MCwiZXhwIjoyMTAyMzU1ODUwfQ.P25NZlOrtHd2bvf1jhySW9Z8ctzdt5xuo7JBKz6_620';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function seedDemoUser() {
  console.log('Seeding Demo User...');
  const email = 'demo@navaura.com';
  const password = 'demo123456';

  // Check if demo user already exists
  const { data: usersData } = await supabase.auth.admin.listUsers();
  let demoUser = usersData?.users?.find((u) => u.email === email);

  if (!demoUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { mother_name: 'Elena Vance' },
    });

    if (error) {
      console.error('Failed to create demo user:', error);
      return;
    }
    demoUser = data.user;
    console.log('Created demo user:', demoUser.id);
  } else {
    console.log('Demo user already exists:', demoUser.id);
    // Ensure email is confirmed and password set
    await supabase.auth.admin.updateUserById(demoUser.id, {
      password,
      email_confirm: true,
    });
  }

  // Seed Profile
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: demoUser.id,
    mother_name: 'Elena Vance',
    postpartum_date: '2025-11-20',
    feeding_method: 'mixed',
    allergen_awareness: 'default',
    dietary_restrictions: 'None (Focusing on iron and choline recovery)',
  });
  if (profErr) console.log('Profile upsert notice:', profErr.message);
  else console.log('Profile seeded for demo user.');

  // Seed Baby
  const { error: babyErr } = await supabase.from('babies').upsert({
    user_id: demoUser.id,
    name: 'Maya',
    birth_date: '2025-11-20',
    birth_weight_kg: 3.4,
  });
  if (babyErr) console.log('Baby upsert notice:', babyErr.message);
  else console.log('Baby seeded for demo user (Maya, ~9 months old).');

  // Seed a sample meal
  const { error: mealErr } = await supabase.from('meals').upsert({
    user_id: demoUser.id,
    food_name: 'Steamed Sweet Potato Puree & Wild Salmon',
    analysis: {
      meal_description: 'Nutrient-dense postpartum bowl with steamed mashed sweet potato and flaked salmon',
      foods: [
        { name: 'Sweet Potato', confidence: 0.96, visible_portion: 'medium' },
        { name: 'Salmon', confidence: 0.94, visible_portion: 'small' },
      ],
      uncertainty: '',
    },
    texture: 'soft_mashed',
    preparation: 'steamed_flaked',
    allergen_status: 'contains_fish',
    safety_notes: { suitable: true, chokingHazard: false },
  });
  if (mealErr) console.log('Meal upsert notice:', mealErr.message);
  else console.log('Sample meal seeded for demo user.');

  console.log('\n✅ Demo User Ready!');
  console.log('Email:    demo@navaura.com');
  console.log('Password: demo123456\n');
}

seedDemoUser();
