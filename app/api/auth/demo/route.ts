import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  return handleDemo();
}

export async function GET() {
  return handleDemo();
}

async function handleDemo() {
  const email = 'demo@navaura.com';
  const password = 'demo123456';

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // 1. Ensure Demo user exists in Supabase
    if (serviceKey) {
      const admin = createSupabaseAdmin(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: usersData } = await admin.auth.admin.listUsers();
      let demoUser = usersData?.users?.find((u) => u.email === email);

      if (!demoUser) {
        const { data: newUser } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { mother_name: 'Elena Vance' },
        });
        demoUser = newUser?.user ?? undefined;
      } else {
        await admin.auth.admin.updateUserById(demoUser.id, {
          password,
          email_confirm: true,
        });
      }

      if (demoUser) {
        // Ensure profile exists
        await admin.from('profiles').upsert({
          id: demoUser.id,
          mother_name: 'Elena Vance',
          postpartum_date: '2025-11-20',
          feeding_method: 'mixed',
          allergen_awareness: 'default',
          dietary_restrictions: 'Focusing on iron, choline, and gentle recovery foods',
          mother_complications: 'Mild Anaemia',
        });

        // Calculate birthdates for Ava (8 months) & Mira (2 months)
        const now = new Date();
        const avaBirth = new Date(now);
        avaBirth.setMonth(avaBirth.getMonth() - 8);
        const miraBirth = new Date(now);
        miraBirth.setMonth(miraBirth.getMonth() - 2);

        // Delete existing demo babies to ensure clean state
        await admin.from('babies').delete().eq('user_id', demoUser.id);

        // Insert Child 1: Ava (8m, Complementary Solids stage)
        const { data: ava } = await admin.from('babies').insert({
          user_id: demoUser.id,
          name: 'Ava',
          birth_date: avaBirth.toISOString().split('T')[0],
          birth_weight_kg: 8.2,
          complications: 'None',
        }).select().single();

        // Insert Child 2: Mira (2m, Exclusive Milk stage)
        const { data: mira } = await admin.from('babies').insert({
          user_id: demoUser.id,
          name: 'Mira',
          birth_date: miraBirth.toISOString().split('T')[0],
          birth_weight_kg: 5.1,
          complications: 'GERD / Mild reflux',
        }).select().single();

        // Seed demo feeding logs for Ava & Mira if available
        if (ava && mira) {
          await admin.from('feeding_logs').delete().eq('user_id', demoUser.id);
          await admin.from('feeding_logs').insert([
            {
              user_id: demoUser.id,
              baby_id: ava.id,
              feeding_type: 'solids',
              food_name: 'Steamed Sweet Potato Puree (smooth)',
              notes: 'Ate 3 tablespoons, loved natural sweetness.',
              logged_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            },
            {
              user_id: demoUser.id,
              baby_id: ava.id,
              feeding_type: 'breastfeeding',
              duration_minutes: 18,
              notes: 'Morning nursing session',
              logged_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
            },
            {
              user_id: demoUser.id,
              baby_id: mira.id,
              feeding_type: 'expressed',
              amount_ml: 90,
              notes: 'Kept upright for 25 mins after feed for reflux.',
              logged_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
            },
          ]);

          // Seed demo food introductions for Ava
          await admin.from('food_introductions').delete().eq('user_id', demoUser.id);
          await admin.from('food_introductions').insert([
            {
              user_id: demoUser.id,
              baby_id: ava.id,
              food_name: 'Sweet Potato',
              status: 'introduced',
              preparation: 'Steamed & fork-mashed',
              texture: 'Smooth puree',
              reaction_notes: 'Well tolerated, clear skin',
              introduced_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
            },
            {
              user_id: demoUser.id,
              baby_id: ava.id,
              food_name: 'Banana',
              status: 'introduced',
              preparation: 'Fresh ripe mashed',
              texture: 'Soft mash',
              reaction_notes: 'Loved taste, no discomfort',
              introduced_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
            },
          ]);
        }
      }
    }

    // 2. Sign in with SSR server client to establish session cookies
    const supabase = await createClient();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !authData.session) {
      console.error('Demo server sign-in error:', signInError);
      return NextResponse.json(
        { error: signInError?.message || 'Failed to establish demo session' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Demo session established',
      user: authData.user,
    });
  } catch (err) {
    console.error('Demo route exception:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Demo login failed' },
      { status: 500 }
    );
  }
}
