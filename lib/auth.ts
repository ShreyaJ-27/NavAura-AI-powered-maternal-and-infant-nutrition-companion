import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}

export async function requireUser() {
  const { user, error } = await getSessionUser();

  if (error || !user) {
    redirect('/auth/sign-in');
  }

  return user;
}
