import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateBabyAge, calculatePostpartumAge } from '@/lib/age';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parallel queries to Supabase
    const [profileRes, babiesRes, mealsRes, feedingRes, hydrationRes, wellnessRes, introRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('babies').select('*').eq('user_id', user.id),
      supabase.from('meals').select('*, meal_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('feeding_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(10),
      supabase.from('hydration_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }),
      supabase.from('wellness_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(5),
      supabase.from('food_introductions').select('*').eq('user_id', user.id).order('introduced_date', { ascending: false }),
    ]);

    const profile = profileRes.data;
    const babies = babiesRes.data || [];
    const baby = babies[0] || null;
    const meals = mealsRes.data || [];
    const feedingLogs = feedingRes.data || [];
    const hydrationLogs = hydrationRes.data || [];
    const wellnessLogs = wellnessRes.data || [];
    const foodIntroductions = introRes.data || [];

    const postpartumStage = profile?.postpartum_date
      ? calculatePostpartumAge(new Date(profile.postpartum_date), new Date())
      : { day: 14, week: 2, month: 0, stage: 'Early postpartum' };

    const babyAge = baby?.birth_date
      ? calculateBabyAge(new Date(baby.birth_date), new Date())
      : { days: 210, weeks: 30, months: 7, years: 0, formatted: '7m' };

    // Today's hydration total
    const todayStr = new Date().toISOString().split('T')[0];
    const todayHydrationMl = hydrationLogs
      .filter((h) => h.logged_at && h.logged_at.startsWith(todayStr))
      .reduce((sum, h) => sum + (Number(h.amount_ml) || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        profile,
        baby,
        babies,
        postpartumStage,
        babyAge,
        todayHydrationMl,
        todayMealsCount: meals.length,
        meals,
        feedingLogs,
        hydrationLogs,
        wellnessLogs,
        foodIntroductions,
      },
    });
  } catch (err) {
    console.error('Dashboard data error:', err);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
