import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, motherName } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  try {
    // Use admin API to create user with email auto-confirmed (bypasses email rate limits)
    const admin = createSupabaseAdmin(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let userId: string;

    // Check if user already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    if (existingUser) {
      // Update password if user already exists
      await admin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: { mother_name: motherName || 'Mama' },
      });
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // auto-confirm, no email sent
        user_metadata: { mother_name: motherName || 'Mama' },
      });

      if (createError || !newUser?.user) {
        return NextResponse.json({ error: createError?.message || 'Failed to create account' }, { status: 400 });
      }
      userId = newUser.user.id;
    }

    // Create default profile
    await admin.from('profiles').upsert({
      id: userId,
      mother_name: motherName || 'Mama',
      postpartum_date: new Date().toISOString().split('T')[0],
      feeding_method: 'mixed',
      allergen_awareness: 'default',
    });

    // Sign in to get SSR session cookies
    const supabase = await createClient();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !authData.session) {
      return NextResponse.json({ error: signInError?.message || 'Account created but sign-in failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Signup failed' }, { status: 500 });
  }
}
