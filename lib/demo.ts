import { ChildProfile, saveChildrenToStorage, PROFILE_STORAGE_KEY } from './children';

export const DEMO_AVA_ID = 'demo-child-ava-001';
export const DEMO_MIRA_ID = 'demo-child-mira-002';

export function getDemoChildren(): ChildProfile[] {
  const now = new Date();
  
  // Ava: 8 months old
  const avaBirth = new Date(now);
  avaBirth.setMonth(avaBirth.getMonth() - 8);
  const avaBirthStr = avaBirth.toISOString().split('T')[0];

  // Mira: 2 months old
  const miraBirth = new Date(now);
  miraBirth.setMonth(miraBirth.getMonth() - 2);
  const miraBirthStr = miraBirth.toISOString().split('T')[0];

  return [
    {
      id: DEMO_AVA_ID,
      name: 'Ava',
      birthDate: avaBirthStr,
      weightKg: 8.2,
      feedingMethod: 'solids',
      complications: 'None',
      allergies: [],
      dietaryRestrictions: [],
      developmentalStage: '6–8m Complementary Solids Exploration',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: DEMO_MIRA_ID,
      name: 'Mira',
      birthDate: miraBirthStr,
      weightKg: 5.1,
      feedingMethod: 'exclusive-breastfeeding',
      complications: 'GERD / Mild reflux',
      allergies: [],
      dietaryRestrictions: [],
      developmentalStage: '0–6m Exclusive Milk Phase',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function initializeDemoData() {
  if (typeof window === 'undefined') return;

  const children = getDemoChildren();
  const motherPostpartumDate = new Date(Date.now() - 42 * 24 * 3600 * 1000).toISOString().split('T')[0];

  const profileData = {
    motherName: 'Elena Vance',
    postpartumDate: motherPostpartumDate,
    feedingMethod: 'mixed',
    dietaryRestrictions: 'Focusing on iron, choline, and gentle recovery foods',
    motherComplications: 'Mild Anaemia',
    children,
    babyName: children[0].name,
    birthDate: children[0].birthDate,
    weightKg: children[0].weightKg,
  };

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
  saveChildrenToStorage(children, children[0].id);

  // Seed Ava's feeding logs
  const avaLogs = [
    {
      id: 'demo-log-ava-1',
      child_id: DEMO_AVA_ID,
      feeding_type: 'solids',
      amount_ml: undefined,
      duration_minutes: undefined,
      food_name: 'Steamed Sweet Potato Puree (smooth)',
      notes: 'Ate 3 tablespoons, loved natural sweetness.',
      logged_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'demo-log-ava-2',
      child_id: DEMO_AVA_ID,
      feeding_type: 'breastfeeding',
      duration_minutes: 18,
      notes: 'Morning nursing session',
      logged_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    },
  ];

  // Seed Mira's feeding logs
  const miraLogs = [
    {
      id: 'demo-log-mira-1',
      child_id: DEMO_MIRA_ID,
      feeding_type: 'expressed',
      amount_ml: 90,
      notes: 'Kept upright for 25 mins after feed to help reflux.',
      logged_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    },
    {
      id: 'demo-log-mira-2',
      child_id: DEMO_MIRA_ID,
      feeding_type: 'breastfeeding',
      duration_minutes: 15,
      notes: 'Gentle feed on left side',
      logged_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    },
  ];

  localStorage.setItem('navaura_feeding_logs', JSON.stringify([...avaLogs, ...miraLogs]));

  // Seed Ava's food introductions (Mira has none as she is 2 months old)
  const avaIntros = [
    {
      id: 'intro-1',
      child_id: DEMO_AVA_ID,
      food_name: 'Sweet Potato',
      status: 'introduced',
      preparation: 'Steamed & fork-mashed',
      texture: 'Smooth puree',
      reaction_notes: 'Well tolerated, clear skin, normal bowel movement.',
      introduced_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    },
    {
      id: 'intro-2',
      child_id: DEMO_AVA_ID,
      food_name: 'Banana',
      status: 'introduced',
      preparation: 'Fresh ripe mashed',
      texture: 'Soft mash',
      reaction_notes: 'Loved taste, no digestive discomfort.',
      introduced_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    },
    {
      id: 'intro-3',
      child_id: DEMO_AVA_ID,
      food_name: 'Iron-Fortified Oats',
      status: 'recently_introduced',
      preparation: 'Cooked with water',
      texture: 'Thin oatmeal',
      reaction_notes: 'Day 1 of 3-day rule, watching for skin reaction.',
      introduced_date: new Date().toISOString().split('T')[0],
    },
  ];

  localStorage.setItem('navaura_food_introductions', JSON.stringify(avaIntros));

  // Seed Hydration & Wellness
  localStorage.setItem(
    'navaura_hydration_logs',
    JSON.stringify([
      { amount_ml: 750, logged_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
      { amount_ml: 500, logged_at: new Date(Date.now() - 7 * 3600 * 1000).toISOString() },
    ])
  );

  localStorage.setItem(
    'navaura_wellness_logs',
    JSON.stringify([{ energy_rating: 4, rest_rating: 3, mood_rating: 4, logged_at: new Date().toISOString() }])
  );
}
