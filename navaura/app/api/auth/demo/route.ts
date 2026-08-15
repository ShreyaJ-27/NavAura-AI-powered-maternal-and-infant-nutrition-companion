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
        // Ensure profile & baby exist
        await admin.from('profiles').upsert({
          id: demoUser.id,
          mother_name: 'Elena Vance',
          postpartum_date: '2025-11-20',
          feeding_method: 'mixed',
          allergen_awareness: 'default',
          dietary_restrictions: 'Focusing on iron, choline, and gentle recovery foods',
        });

        await admin.from('babies').upsert({
          user_id: demoUser.id,
          name: 'Maya',
          birth_date: '2025-11-20',
          birth_weight_kg: 3.4,
        });
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
