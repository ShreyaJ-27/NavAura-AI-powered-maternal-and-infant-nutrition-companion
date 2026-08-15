import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase.from('meals').delete().eq('id', id).eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Meal deleted successfully' });
  } catch (err) {
    console.error('Delete meal error:', err);
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}
