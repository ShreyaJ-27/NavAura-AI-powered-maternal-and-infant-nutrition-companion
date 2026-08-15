import { calculateBabyAge } from './age.ts';

export type ChildProfile = {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  weightKg?: number;
  feedingMethod?: 'exclusive-breastfeeding' | 'mixed' | 'formula' | 'solids';
  allergies?: string[];
  dietaryRestrictions?: string[];
  complications?: string;
  developmentalStage?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const PROFILE_STORAGE_KEY = 'navaura_profile_data';
export const SELECTED_CHILD_KEY = 'navaura_selected_child_id';

export function generateChildId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'child_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

export function calculateChildStage(ageMonths: number): string {
  if (ageMonths < 6) return 'Exclusive milk phase (breast milk or formula)';
  if (ageMonths < 9) return 'Early solid exploration (6–8m purees & mashes)';
  if (ageMonths < 12) return 'Soft finger foods stage (9–11m dices & pieces)';
  return 'Toddler table foods (12–24m modified family meals)';
}

export function ensureChildIds(rawChildren: Partial<ChildProfile>[]): ChildProfile[] {
  if (!Array.isArray(rawChildren) || rawChildren.length === 0) return [];
  return rawChildren.map((c, index) => ({
    id: c.id && c.id.trim() !== '' ? c.id : generateChildId(),
    name: c.name && c.name.trim() !== '' ? c.name : `Child ${index + 1}`,
    birthDate: c.birthDate || new Date(Date.now() - 7 * 30.4 * 24 * 3600 * 1000).toISOString().split('T')[0],
    weightKg: typeof c.weightKg === 'number' ? c.weightKg : Number(c.weightKg) || 7.5,
    complications: c.complications || 'None',
    feedingMethod: c.feedingMethod,
    allergies: Array.isArray(c.allergies) ? c.allergies : [],
    dietaryRestrictions: Array.isArray(c.dietaryRestrictions) ? c.dietaryRestrictions : [],
    developmentalStage: c.developmentalStage,
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt || new Date().toISOString(),
  }));
}

export function migrateLegacyProfile(raw: any): {
  motherName: string;
  postpartumDate: string;
  feedingMethod: string;
  dietaryRestrictions: string;
  motherComplications: string;
  children: ChildProfile[];
  selectedChildId: string;
} {
  const motherName = raw?.motherName || 'Mama';
  const postpartumDate = raw?.postpartumDate || new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const feedingMethod = raw?.feedingMethod || 'mixed';
  const dietaryRestrictions = raw?.dietaryRestrictions || '';
  const motherComplications = raw?.motherComplications || 'None';

  let children: ChildProfile[] = [];

  if (raw?.children && Array.isArray(raw.children) && raw.children.length > 0) {
    children = ensureChildIds(raw.children);
  } else if (raw?.babyName || raw?.birthDate) {
    children = [
      {
        id: generateChildId(),
        name: raw.babyName || 'Little One',
        birthDate: raw.birthDate || new Date(Date.now() - 7 * 30.4 * 24 * 3600 * 1000).toISOString().split('T')[0],
        weightKg: Number(raw.weightKg) || 7.5,
        complications: raw.babyComplications || 'None',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  const savedSelectedId = typeof window !== 'undefined' ? localStorage.getItem(SELECTED_CHILD_KEY) : null;
  const validSelectedId = savedSelectedId && children.some((c) => c.id === savedSelectedId)
    ? savedSelectedId
    : children[0]?.id || '';

  return {
    motherName,
    postpartumDate,
    feedingMethod,
    dietaryRestrictions,
    motherComplications,
    children,
    selectedChildId: validSelectedId,
  };
}

export function loadChildrenFromStorage(): { children: ChildProfile[]; selectedChildId: string } {
  if (typeof window === 'undefined') {
    return { children: [], selectedChildId: '' };
  }
  try {
    const rawStr = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!rawStr) return { children: [], selectedChildId: '' };
    const raw = JSON.parse(rawStr);
    const migrated = migrateLegacyProfile(raw);
    return { children: migrated.children, selectedChildId: migrated.selectedChildId };
  } catch {
    return { children: [], selectedChildId: '' };
  }
}

export function saveChildrenToStorage(children: ChildProfile[], selectedChildId?: string) {
  if (typeof window === 'undefined') return;
  try {
    const existingStr = localStorage.getItem(PROFILE_STORAGE_KEY);
    const existing = existingStr ? JSON.parse(existingStr) : {};
    const updated = {
      ...existing,
      children: children.map((c) => ({
        ...c,
        id: c.id || generateChildId(),
      })),
      // Update legacy single-child fields to first child for backwards compatibility
      babyName: children[0]?.name || 'Little One',
      birthDate: children[0]?.birthDate || '',
      weightKg: children[0]?.weightKg || 7.5,
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));

    if (selectedChildId && children.some((c) => c.id === selectedChildId)) {
      localStorage.setItem(SELECTED_CHILD_KEY, selectedChildId);
    } else if (children.length > 0) {
      localStorage.setItem(SELECTED_CHILD_KEY, children[0].id);
    }
  } catch (err) {
    console.error('Failed to save children to storage:', err);
  }
}

export function getSelectedChild(children: ChildProfile[], selectedChildId: string): ChildProfile | null {
  if (!children || children.length === 0) return null;
  return children.find((c) => c.id === selectedChildId) || children[0];
}
