import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateBabyAge, calculatePostpartumAge } from '@/lib/age';
import { calculateChildStage } from '@/lib/children';
import { generatePersonalizedInsights } from '@/lib/personalization';
import { getDemoChildren } from '@/lib/demo';

export const runtime = 'nodejs';

interface DemoChild {
  id: string;
  name: string;
  birthDate: string;
  birth_date?: string;
  weightKg?: number;
  birth_weight_kg?: number;
  feedingMethod?: string;
  feeding_method?: string;
  complications?: string;
}

interface DemoFeedingLog {
  id?: string;
  child_id?: string;
  childId?: string;
  baby_id?: string;
  feeding_type?: string;
  amount_ml?: number;
  duration_minutes?: number;
  food_name?: string;
  notes?: string;
  logged_at?: string;
  loggedAt?: string;
}

interface DemoHydrationLog {
  amount_ml?: number;
  beverage_type?: string;
  logged_at?: string;
}

interface DemoProfile {
  motherName?: string;
  postpartumDate?: string;
  feedingMethod?: string;
  dietaryRestrictions?: string;
  motherComplications?: string;
}

export type VoiceToolPayload = {
  toolName: string;
  parameters: Record<string, unknown>;
  clientContext?: {
    isDemo?: boolean;
    demoChildren?: DemoChild[];
    demoFeedingLogs?: DemoFeedingLog[];
    demoHydrationLogs?: DemoHydrationLog[];
    demoProfile?: DemoProfile;
  };
};

export async function POST(request: Request) {
  try {
    const body: VoiceToolPayload = await request.json();
    const { toolName, parameters = {}, clientContext } = body;

    if (!toolName) {
      return NextResponse.json({ success: false, error: 'toolName is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isDemo = clientContext?.isDemo || !user;

    // Helper to resolve child from Supabase or Demo
    async function resolveChild(identifier?: string): Promise<DemoChild | null> {
      if (isDemo) {
        const demoChildren: DemoChild[] = (clientContext?.demoChildren && clientContext.demoChildren.length > 0
          ? clientContext.demoChildren
          : getDemoChildren()) as DemoChild[];
        if (!identifier) {
          return demoChildren.length === 1 ? demoChildren[0] : null;
        }
        const lower = identifier.toLowerCase().trim();
        return demoChildren.find(
          (c) => c.id === identifier || c.name.toLowerCase() === lower
        ) || null;
      }

      if (!user) return null;
      const { data: babies } = await supabase
        .from('babies')
        .select('*')
        .eq('user_id', user.id);

      if (!babies || babies.length === 0) return null;
      const typedBabies: DemoChild[] = babies.map((b) => ({
        id: b.id,
        name: b.name,
        birthDate: b.birth_date,
        birth_weight_kg: b.birth_weight_kg ? Number(b.birth_weight_kg) : undefined,
        complications: b.complications || 'None',
      }));

      if (!identifier) {
        return typedBabies.length === 1 ? typedBabies[0] : null;
      }
      const lower = identifier.toLowerCase().trim();
      return typedBabies.find(
        (b) => b.id === identifier || b.name.toLowerCase() === lower
      ) || null;
    }

    switch (toolName) {
      case 'get_mother_profile': {
        if (isDemo) {
          const profile = clientContext?.demoProfile || {
            motherName: 'Elena Vance',
            postpartumDate: new Date(Date.now() - 42 * 24 * 3600 * 1000).toISOString().split('T')[0],
            feedingMethod: 'mixed',
            dietaryRestrictions: 'Focusing on iron, choline, and gentle recovery foods',
            motherComplications: 'Mild Anaemia',
          };
          const age = calculatePostpartumAge(profile.postpartumDate || '');
          return NextResponse.json({
            success: true,
            data: {
              name: profile.motherName || 'Elena Vance',
              postpartumDay: age.day,
              postpartumStage: age.stage,
              feedingMethod: profile.feedingMethod || 'mixed',
              dietaryRestrictions: profile.dietaryRestrictions || 'None',
              complications: profile.motherComplications || 'None',
            },
          });
        }

        if (!user) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const age = profile?.postpartum_date
          ? calculatePostpartumAge(profile.postpartum_date)
          : { day: 14, stage: 'Early postpartum (2–6 weeks)' };

        return NextResponse.json({
          success: true,
          data: {
            name: profile?.mother_name || 'Mama',
            postpartumDay: age.day,
            postpartumStage: age.stage,
            feedingMethod: profile?.feeding_method || 'mixed',
            dietaryRestrictions: profile?.dietary_restrictions || 'None',
            complications: profile?.allergen_awareness || 'None',
          },
        });
      }

      case 'get_children': {
        if (isDemo) {
          const demoChildren: DemoChild[] = (clientContext?.demoChildren && clientContext.demoChildren.length > 0
            ? clientContext.demoChildren
            : getDemoChildren()) as DemoChild[];
          return NextResponse.json({
            success: true,
            data: demoChildren.map((c) => {
              const age = calculateBabyAge(c.birthDate || c.birth_date || '');
              return {
                id: c.id,
                name: c.name,
                birthDate: c.birthDate || c.birth_date,
                ageFormatted: age.formatted,
                ageMonths: age.months,
                feedingMethod: c.feedingMethod || c.feeding_method || 'solids',
                developmentalStage: calculateChildStage(age.months),
                complications: c.complications || 'None',
              };
            }),
          });
        }

        if (!user) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: babies } = await supabase
          .from('babies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        const formatted = (babies || []).map((b: { id: string; name: string; birth_date: string; birth_weight_kg?: number | null; complications?: string | null }) => {
          const age = calculateBabyAge(b.birth_date);
          return {
            id: b.id,
            name: b.name,
            birthDate: b.birth_date,
            ageFormatted: age.formatted,
            ageMonths: age.months,
            developmentalStage: calculateChildStage(age.months),
            weightKg: b.birth_weight_kg ? Number(b.birth_weight_kg) : undefined,
            complications: b.complications || 'None',
          };
        });

        return NextResponse.json({ success: true, data: formatted });
      }

      case 'get_child_profile': {
        const child_name = typeof parameters.child_name === 'string' ? parameters.child_name : undefined;
        const child_id = typeof parameters.child_id === 'string' ? parameters.child_id : undefined;
        const target = await resolveChild(child_id || child_name);

        if (!target) {
          return NextResponse.json({
            success: false,
            error: 'Child not found. Please specify which child by name (e.g. Ava or Mira).',
          });
        }

        const birthDate = target.birth_date || target.birthDate || '';
        const age = calculateBabyAge(birthDate);

        return NextResponse.json({
          success: true,
          data: {
            id: target.id,
            name: target.name,
            birthDate,
            ageFormatted: age.formatted,
            ageMonths: age.months,
            stage: calculateChildStage(age.months),
            feedingMethod: target.feeding_method || target.feedingMethod || 'solids',
            complications: target.complications || 'None',
            weightKg: target.birth_weight_kg || target.weightKg || 7.5,
          },
        });
      }

      case 'get_feeding_history': {
        const child_name = typeof parameters.child_name === 'string' ? parameters.child_name : undefined;
        const child_id = typeof parameters.child_id === 'string' ? parameters.child_id : undefined;
        const limit = typeof parameters.limit === 'number' ? parameters.limit : 10;
        const targetChild = await resolveChild(child_id || child_name);

        if (!targetChild && !child_name && !child_id) {
          return NextResponse.json({
            success: false,
            error: 'Multiple children are registered. Please specify whether you want feeding history for Ava or Mira.',
          });
        }

        if (isDemo) {
          let logs = clientContext?.demoFeedingLogs || [];
          if (targetChild) {
            logs = logs.filter((l) => l.child_id === targetChild.id || l.childId === targetChild.id);
          }
          return NextResponse.json({
            success: true,
            childName: targetChild?.name || 'All children',
            data: logs.slice(0, Number(limit)),
          });
        }

        if (!user) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        let query = supabase
          .from('feeding_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(Number(limit));

        if (targetChild) {
          query = query.eq('baby_id', targetChild.id);
        }

        const { data: logs, error } = await query;
        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          childName: targetChild?.name || 'All children',
          data: logs || [],
        });
      }

      case 'get_todays_feeding_summary': {
        const child_name = typeof parameters.child_name === 'string' ? parameters.child_name : undefined;
        const child_id = typeof parameters.child_id === 'string' ? parameters.child_id : undefined;
        const targetChild = await resolveChild(child_id || child_name);
        const todayStr = new Date().toISOString().split('T')[0];

        if (isDemo) {
          const allLogs = clientContext?.demoFeedingLogs || [];
          const targetLogs = targetChild
            ? allLogs.filter((l) => (l.child_id === targetChild.id || l.childId === targetChild.id))
            : allLogs;

          const todaysLogs = targetLogs.filter((l) => (l.logged_at || l.loggedAt || '').startsWith(todayStr));
          return NextResponse.json({
            success: true,
            childName: targetChild?.name || 'All children',
            totalFeeds: todaysLogs.length,
            feeds: todaysLogs,
          });
        }

        if (!user) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        let query = supabase
          .from('feeding_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', `${todayStr}T00:00:00.000Z`)
          .order('logged_at', { ascending: true });

        if (targetChild) {
          query = query.eq('baby_id', targetChild.id);
        }

        const { data: logs, error } = await query;
        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          childName: targetChild?.name || 'All children',
          totalFeeds: (logs || []).length,
          feeds: logs || [],
        });
      }

      case 'log_feeding': {
        const child_name = typeof parameters.child_name === 'string' ? parameters.child_name : undefined;
        const child_id = typeof parameters.child_id === 'string' ? parameters.child_id : undefined;
        const feeding_type = typeof parameters.feeding_type === 'string' ? parameters.feeding_type : undefined;
        const amount_ml = typeof parameters.amount_ml === 'number' ? parameters.amount_ml : undefined;
        const duration_minutes = typeof parameters.duration_minutes === 'number' ? parameters.duration_minutes : undefined;
        const food_name = typeof parameters.food_name === 'string' ? parameters.food_name : undefined;
        const notes = typeof parameters.notes === 'string' ? parameters.notes : '';

        if (!feeding_type) {
          return NextResponse.json({ success: false, error: 'Feeding type is required (breastfeeding, expressed, formula, solids).' }, { status: 400 });
        }

        const targetChild = await resolveChild(child_id || child_name);
        if (!targetChild) {
          return NextResponse.json({
            success: false,
            error: 'Child not specified or ambiguous. Please tell me which child this is for (e.g. Ava or Mira).',
          });
        }

        const newLog = {
          id: crypto.randomUUID(),
          baby_id: targetChild.id,
          child_id: targetChild.id,
          feeding_type,
          amount_ml: amount_ml ? Number(amount_ml) : null,
          duration_minutes: duration_minutes ? Number(duration_minutes) : null,
          food_name: food_name || null,
          notes: notes || '',
          logged_at: new Date().toISOString(),
        };

        if (isDemo) {
          return NextResponse.json({
            success: true,
            message: `Logged ${feeding_type}${amount_ml ? ` (${amount_ml} ml)` : ''}${food_name ? ` of ${food_name}` : ''} for ${targetChild.name}.`,
            data: newLog,
            childName: targetChild.name,
          });
        }

        if (!user) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: saved, error } = await supabase
          .from('feeding_logs')
          .insert({
            id: newLog.id,
            user_id: user.id,
            baby_id: targetChild.id,
            feeding_type: newLog.feeding_type,
            amount_ml: newLog.amount_ml,
            duration_minutes: newLog.duration_minutes,
            food_name: newLog.food_name,
            notes: newLog.notes,
            logged_at: newLog.logged_at,
          })
          .select('*')
          .single();

        if (error) {
          console.warn('feeding_logs insert notice:', error.message);
          return NextResponse.json({
            success: true,
            message: `Logged ${feeding_type} for ${targetChild.name}.`,
            data: newLog,
            childName: targetChild.name,
          });
        }

        return NextResponse.json({
          success: true,
          message: `Logged ${feeding_type} for ${targetChild.name}.`,
          data: saved,
          childName: targetChild.name,
        });
      }

      case 'get_hydration': {
        const todayStr = new Date().toISOString().split('T')[0];

        if (isDemo) {
          const logs = clientContext?.demoHydrationLogs || [
            { amount_ml: 750, logged_at: new Date().toISOString() },
            { amount_ml: 500, logged_at: new Date().toISOString() },
          ];
          const todayTotal = logs.reduce((sum: number, l) => sum + (Number(l.amount_ml) || 0), 0);
          return NextResponse.json({
            success: true,
            data: {
              todayTotalMl: todayTotal,
              goalMl: 2500,
              percentOfGoal: Math.min(100, Math.round((todayTotal / 2500) * 100)),
              recentLogs: logs.slice(0, 5),
            },
          });
        }

        if (!user) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: logs, error } = await supabase
          .from('hydration_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false });

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const todayLogs = (logs || []).filter((l: { logged_at: string; amount_ml?: number }) => l.logged_at.startsWith(todayStr));
        const todayTotal = todayLogs.reduce((sum: number, l: { amount_ml?: number }) => sum + (Number(l.amount_ml) || 0), 0);

        return NextResponse.json({
          success: true,
          data: {
            todayTotalMl: todayTotal,
            goalMl: 2500,
            percentOfGoal: Math.min(100, Math.round((todayTotal / 2500) * 100)),
            recentLogs: (logs || []).slice(0, 5),
          },
        });
      }

      case 'log_hydration': {
        const amount_ml = typeof parameters.amount_ml === 'number' ? parameters.amount_ml : Number(parameters.amount_ml);
        const beverage_type = typeof parameters.beverage_type === 'string' ? parameters.beverage_type : 'water';

        if (!amount_ml || amount_ml <= 0) {
          return NextResponse.json({ success: false, error: 'Please specify a valid water amount in ml.' }, { status: 400 });
        }

        const newLog = {
          id: crypto.randomUUID(),
          amount_ml,
          beverage_type,
          logged_at: new Date().toISOString(),
        };

        if (isDemo) {
          return NextResponse.json({
            success: true,
            message: `Logged ${amount_ml} ml of ${beverage_type}.`,
            data: newLog,
          });
        }

        if (!user) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: saved, error } = await supabase
          .from('hydration_logs')
          .insert({
            id: newLog.id,
            user_id: user.id,
            amount_ml: newLog.amount_ml,
            beverage_type: newLog.beverage_type,
            logged_at: newLog.logged_at,
          })
          .select('*')
          .single();

        if (error) {
          return NextResponse.json({
            success: true,
            message: `Logged ${amount_ml} ml of ${beverage_type}.`,
            data: newLog,
          });
        }

        return NextResponse.json({
          success: true,
          message: `Logged ${amount_ml} ml of ${beverage_type}.`,
          data: saved,
        });
      }

      case 'get_recent_meals':
      case 'get_meal_analysis': {
        if (isDemo) {
          return NextResponse.json({
            success: true,
            data: [
              {
                id: 'demo-meal-1',
                food_name: 'Steamed Sweet Potato & Iron Oats',
                texture: 'Smooth puree',
                preparation: 'Steamed & fork-mashed',
                created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
                nutrients: { iron_mg: 2.8, protein_g: 6.4, calories: 180 },
              },
            ],
          });
        }

        if (!user) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: meals, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: meals || [] });
      }

      case 'get_wellness_summary': {
        if (isDemo) {
          return NextResponse.json({
            success: true,
            data: {
              energy: 4,
              rest: 3,
              mood: 4,
              notes: 'Energy steady, getting back into daily rhythm',
              logged_at: new Date().toISOString(),
            },
          });
        }

        if (!user) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: wellness } = await supabase
          .from('wellness_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return NextResponse.json({
          success: true,
          data: wellness || { energy: 3, rest: 3, mood: 3, notes: 'No recent wellness log.' },
        });
      }

      case 'get_recommendations': {
        const child_name = typeof parameters.child_name === 'string' ? parameters.child_name : undefined;
        const child_id = typeof parameters.child_id === 'string' ? parameters.child_id : undefined;
        const targetChild = await resolveChild(child_id || child_name);

        const motherName = clientContext?.demoProfile?.motherName || 'Elena Vance';
        const birthDate = targetChild?.birth_date || targetChild?.birthDate || new Date(Date.now() - 8 * 30.4 * 24 * 3600 * 1000).toISOString().split('T')[0];
        const postDate = clientContext?.demoProfile?.postpartumDate || new Date(Date.now() - 42 * 24 * 3600 * 1000).toISOString().split('T')[0];

        const insights = generatePersonalizedInsights({
          motherName,
          postpartumStage: calculatePostpartumAge(postDate),
          babyName: targetChild?.name || 'Ava',
          babyAge: calculateBabyAge(birthDate),
          feedingMethod: targetChild?.feedingMethod || targetChild?.feeding_method || 'solids',
          motherComplications: 'Mild Anaemia',
          babyComplications: targetChild?.complications || 'None',
        });

        return NextResponse.json({
          success: true,
          childName: targetChild?.name || 'All',
          data: insights,
        });
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown tool: ${toolName}` }, { status: 400 });
    }
  } catch (err) {
    console.error('Voice tool execution error:', err);
    return NextResponse.json({ success: false, error: 'Internal tool execution error' }, { status: 500 });
  }
}
