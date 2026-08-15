export type SafetyInput = {
  babyAgeDays: number;
  foodName: string;
  texture: string;
  preparation: string;
  allergenStatus: string;
  introductionHistory: string[];
};

export type SafetyResult = {
  appropriateToExplore: boolean;
  preparationAdjustment: string[];
  textureAdjustment: string[];
  allergenInformation: string[];
  chokingConsideration: string[];
  insufficientEvidence: string[];
};

const HIGH_RISK_FOODS = new Set([
  'grapes',
  'whole grapes',
  'grape',
  'nuts',
  'whole nuts',
  'popcorn',
  'hard candy',
  'raw apple',
  'whole apple',
  'raw carrot',
  'baby carrots',
  'chunks of meat',
  'sausage',
  'hot dog',
  'seeds',
  'raw celery',
]);

export function evaluateFoodSafety(input: SafetyInput): SafetyResult {
  const foodName = input.foodName.toLowerCase();
  const preparations: string[] = [];
  const textures: string[] = [];
  const allergens: string[] = [];
  const choking: string[] = [];
  const insufficient: string[] = [];

  const ageDays = Math.max(0, Number(input.babyAgeDays) || 0);
  const pastIntroductions = input.introductionHistory.map((item) => item.toLowerCase());
  const isIntroduced = pastIntroductions.includes(foodName);

  if (ageDays < 180) {
    insufficient.push('Baby age is under 6 months; complementary foods should be introduced only with professional guidance.');
  }

  if (HIGH_RISK_FOODS.has(foodName) || input.texture === 'whole') {
    choking.push('Whole or hard foods may present choking hazards and should be modified before serving.');
  }

  if (foodName.includes('grape') || foodName.includes('peanut') || foodName.includes('nut')) {
    allergens.push('Check for allergen history and prepare carefully before offering to a baby.');
  }

  if (input.preparation === 'raw') {
    preparations.push('Cooking or gentle steaming may improve texture safety and reduce choking risk.');
  }

  if (input.preparation === 'steamed' || input.preparation === 'cooked' || input.preparation === 'baked') {
    preparations.push('Gentle cooking or steaming helps keep the food soft and easier for a baby to manage.');
  }

  if (input.texture === 'whole' || input.texture === 'chunks') {
    textures.push('Offer a soft, smooth, or mashed texture that is easier for a baby to manage.');
  }

  if (input.texture === 'mashed' || input.texture === 'soft' || input.texture === 'pureed') {
    textures.push('A soft, smooth texture is suitable for this stage when the food is tolerated well.');
  }

  if (input.allergenStatus === 'known') {
    allergens.push('Allergen history is already known; use caution and follow the care plan.');
  }

  if (!isIntroduced && ageDays > 180) {
    insufficient.push('No prior introduction record for this food is available; introduce cautiously and monitor for reactions.');
  }

  const appropriateToExplore = ageDays >= 180 && !choking.length && input.texture !== 'whole';

  return {
    appropriateToExplore,
    preparationAdjustment: preparations,
    textureAdjustment: textures,
    allergenInformation: allergens,
    chokingConsideration: choking,
    insufficientEvidence: insufficient,
  };
}
