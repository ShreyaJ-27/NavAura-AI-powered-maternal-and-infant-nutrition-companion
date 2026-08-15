import normalizedDataset from '../data/normalized_foods.json';

export type VerifiedNutrients = {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  iron_mg: number;
  calcium_mg: number;
  vitamin_c_mg: number;
};

export type NutritionLookupResult = {
  isVerified: boolean;
  foodName: string;
  matchedName?: string;
  category?: string;
  source?: string;
  nutrients?: VerifiedNutrients;
  message?: string;
};

export function lookupVerifiedNutrition(foodName: string): NutritionLookupResult {
  if (!foodName || typeof foodName !== 'string') {
    return {
      isVerified: false,
      foodName: foodName || '',
      message: 'Verified nutrition data unavailable.',
    };
  }

  const query = foodName.toLowerCase().trim();
  const foods = normalizedDataset.foods || [];

  // 1. Exact match
  let match = foods.find((f: { name: string }) => f.name.toLowerCase() === query);

  // 2. Partial word match
  if (!match) {
    match = foods.find((f: { name: string }) => {
      const nameLower = f.name.toLowerCase();
      return query.split(/\s+/).some((word) => word.length > 3 && nameLower.includes(word));
    });
  }

  if (match && match.nutrients) {
    return {
      isVerified: true,
      foodName,
      matchedName: match.name,
      category: match.category,
      source: match.source || 'USDA FoodData Central / NavAura Verified',
      nutrients: match.nutrients,
    };
  }

  return {
    isVerified: false,
    foodName,
    message: 'Verified nutrition data unavailable.',
  };
}
