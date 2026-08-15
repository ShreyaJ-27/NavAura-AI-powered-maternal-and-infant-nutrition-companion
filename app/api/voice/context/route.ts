import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateBabyAge, calculatePostpartumAge } from '@/lib/age';
import { calculateChildStage } from '@/lib/children';

export const runtime = 'nodejs';

interface BabyRecord {
  id: string;
  name: string;
  birth_date: string;
  birth_weight_kg?: number | null;
  complications?: string | null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If authenticated in Supabase, load DB records
    if (user) {
      const [profileRes, babiesRes, hydrationRes, mealsRes, wellnessRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('babies').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('hydration_logs').select('amount_ml, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(10),
        supabase.from('meals').select('id, food_name, created_at, analysis').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('wellness_logs').select('energy_rating, rest_rating, mood_rating, notes, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1),
      ]);

      const profile = profileRes.data;
      const babies: BabyRecord[] = (babiesRes.data || []) as BabyRecord[];
      const hydrationLogs = hydrationRes.data || [];
      const meals = mealsRes.data || [];
      const latestWellness = wellnessRes.data?.[0];

      // Calculate today's water total
      const todayDateStr = new Date().toISOString().split('T')[0];
      const todayWaterMl = hydrationLogs
        .filter((l: { logged_at: string; amount_ml: number }) => l.logged_at.startsWith(todayDateStr))
        .reduce((sum: number, l: { amount_ml: number }) => sum + Number(l.amount_ml || 0), 0);

      const postpartumAge = profile?.postpartum_date ? calculatePostpartumAge(profile.postpartum_date) : { day: 14, stage: 'Early postpartum (2–6 weeks)' };

      const formattedChildren = babies.map((b) => {
        const age = calculateBabyAge(b.birth_date);
        return {
          id: b.id,
          name: b.name,
          birthDate: b.birth_date,
          ageMonths: age.months,
          ageFormatted: age.formatted,
          developmentalStage: calculateChildStage(age.months),
          weightKg: b.birth_weight_kg ? Number(b.birth_weight_kg) : undefined,
          complications: b.complications || 'None',
        };
      });

      return NextResponse.json({
        success: true,
        authenticated: true,
        userId: user.id,
        mother: {
          name: profile?.mother_name || 'Mama',
          postpartumDay: postpartumAge.day,
          postpartumStage: postpartumAge.stage,
          feedingMethod: profile?.feeding_method || 'mixed',
          dietaryRestrictions: profile?.dietary_restrictions || 'None',
          motherComplications: profile?.allergen_awareness || 'None',
          todayWaterMl,
          waterGoalMl: 2500,
          latestWellness: latestWellness ? { energy: latestWellness.energy_rating, rest: latestWellness.rest_rating, mood: latestWellness.mood_rating } : null,
          recentMealsCount: meals.length,
        },
        children: formattedChildren,
        date: new Date().toISOString(),
      });
    }

    // Unauthenticated fallback response
    return NextResponse.json({
      success: true,
      authenticated: false,
      mother: null,
      children: [],
      date: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Voice context error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve voice context' }, { status: 500 });
  }
}
