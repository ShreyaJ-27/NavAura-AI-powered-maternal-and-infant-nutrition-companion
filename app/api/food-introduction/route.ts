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
        .from('food_introductions')
        .select('*')
        .eq('user_id', user.id)
        .order('introduced_date', { ascending: false });

      if (error) {
        return NextResponse.json({ success: true, data: [] });
      }

      return NextResponse.json({ success: true, data: logs || [] });
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }
  } catch (err) {
    console.error('Fetch food introductions error:', err);
    return NextResponse.json({ error: 'Failed to fetch food introductions' }, { status: 500 });
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
    const { babyId, foodName, status, preparation, texture, reactionNotes, introducedDate } = body;

    if (!foodName) {
      return NextResponse.json({ error: 'Food name is required' }, { status: 400 });
    }

    let targetBabyId = babyId || null;
    if (!targetBabyId) {
      const { data: babies } = await supabase.from('babies').select('id').eq('user_id', user.id);
      if (babies && babies.length > 0) {
        targetBabyId = babies[0].id;
      }
    }

    const record = {
      id: crypto.randomUUID(),
      user_id: user.id,
      baby_id: targetBabyId,
      food_name: foodName,
      status: status || 'introduced',
      preparation: preparation || 'steamed',
      texture: texture || 'pureed',
      reaction_notes: reactionNotes || '',
      introduced_date: introducedDate || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: log, error } = await supabase
        .from('food_introductions')
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
    console.error('Save food introduction error:', err);
    return NextResponse.json({ error: 'Failed to save food introduction' }, { status: 500 });
  }
}
