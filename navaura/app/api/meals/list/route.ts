import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const babyId = searchParams.get('babyId');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let query = supabase
    .from('meals')
    .select('*, meal_images(*)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (babyId) {
    query = query.eq('baby_id', babyId);
  }

  const { data: meals, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: `Database error: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    meals: meals || [],
    total: count || 0,
    limit,
    offset,
  });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mealId = searchParams.get('id');

  if (!mealId) {
    return NextResponse.json(
      { error: 'Meal ID is required' },
      { status: 400 }
    );
  }

  // Verify the meal belongs to the user
  const { data: meal, error: fetchError } = await supabase
    .from('meals')
    .select('id, meal_images(storage_path)')
    .eq('id', mealId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !meal) {
    return NextResponse.json(
      { error: 'Meal not found' },
      { status: 404 }
    );
  }

  // Delete associated images from storage
  if (meal.meal_images && meal.meal_images.length > 0) {
    const storagePaths = meal.meal_images.map((img: { storage_path: string }) => img.storage_path);
    await Promise.all(
      storagePaths.map((path) =>
        supabase.storage.from('meal-images').remove([path])
      )
    );
  }

  // Delete the meal (cascade will delete meal_images records)
  const { error: deleteError } = await supabase
    .from('meals')
    .delete()
    .eq('id', mealId);

  if (deleteError) {
    return NextResponse.json(
      { error: `Delete failed: ${deleteError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
