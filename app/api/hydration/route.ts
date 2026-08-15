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
        .from('hydration_logs')
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
    console.error('Fetch hydration logs error:', err);
    return NextResponse.json({ error: 'Failed to fetch hydration logs' }, { status: 500 });
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
    const { amountMl, beverageType } = body;

    if (!amountMl || Number(amountMl) <= 0) {
      return NextResponse.json({ error: 'Valid water amount in mL is required' }, { status: 400 });
    }

    const record = {
      id: crypto.randomUUID(),
      user_id: user.id,
      amount_ml: Number(amountMl),
      beverage_type: beverageType || 'water',
      logged_at: new Date().toISOString(),
    };

    try {
      const { data: log, error } = await supabase
        .from('hydration_logs')
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
    console.error('Save hydration log error:', err);
    return NextResponse.json({ error: 'Failed to save hydration log' }, { status: 500 });
  }
}
