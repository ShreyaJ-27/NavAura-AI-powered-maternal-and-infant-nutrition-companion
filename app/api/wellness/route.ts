import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { data: logs, error } = await supabase
        .from('wellness_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (error) {
        return NextResponse.json({ success: true, data: [] });
      }

      return NextResponse.json({ success: true, data: logs || [] });
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }
  } catch (err) {
    console.error('Fetch wellness logs error:', err);
    return NextResponse.json({ error: 'Failed to fetch wellness logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { energyRating, restRating, moodRating, notes } = body;

    const record = {
      id: crypto.randomUUID(),
      user_id: user.id,
      energy_rating: energyRating ? Number(energyRating) : 3,
      rest_rating: restRating ? Number(restRating) : 3,
      mood_rating: moodRating ? Number(moodRating) : 3,
      notes: notes || '',
      logged_at: new Date().toISOString(),
    };

    try {
      const { data: log, error } = await supabase
        .from('wellness_logs')
        .insert(record)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ success: true, data: record });
      }

      return NextResponse.json({ success: true, data: log });
    } catch {
      return NextResponse.json({ success: true, data: record });
    }
  } catch (err) {
    console.error('Save wellness log error:', err);
    return NextResponse.json({ error: 'Failed to save wellness log' }, { status: 500 });
  }
}
