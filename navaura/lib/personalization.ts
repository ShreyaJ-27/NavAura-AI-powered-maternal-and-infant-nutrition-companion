import { PostpartumAge, BabyAge } from './age';
import { VerifiedNutrients } from './nutrition-lookup';

export type PersonalizationInput = {
  motherName?: string;
  postpartumStage?: PostpartumAge | null;
  babyName?: string;
  babyAge?: BabyAge | null;
  dietaryRestrictions?: string[];
  recentMealIronTotalMg?: number;
  recentWaterTotalMl?: number;
  recentWellnessEnergy?: number;
  detectedFoods?: { name: string; nutrients?: VerifiedNutrients | null }[];
};

export type MotherPersonalizedObservation = {
  title: string;
  body: string;
  nutrientHighlight?: string;
  recommendation: string;
};

export type BabyPersonalizedObservation = {
  title: string;
  body: string;
  stageContext: string;
  textureNote: string;
};

export type PersonalizationResult = {
  motherObservation: MotherPersonalizedObservation;
  babyObservation: BabyPersonalizedObservation;
  hydrationContext: string;
};

export function generatePersonalizedInsights(input: PersonalizationInput): PersonalizationResult {
  const motherName = input.motherName || 'Mama';
  const babyName = input.babyName || 'Baby';
  const postDay = input.postpartumStage?.day ?? 14;
  const babyMonths = input.babyAge?.months ?? 6;

  // Mother Insights
  let motherTitle = `${motherName}’s Recovery & Energy`;
  let motherBody = `At day ${postDay} postpartum, your body requires nutrient-dense meals rich in protein, iron, and hydration to support tissue healing and overall stamina.`;
  let nutrientHighlight = 'Protein & Iron';
  let motherRec = 'Include dark leafy greens, legumes, or lean meats alongside Vitamin C sources to enhance iron absorption.';

  const foods = input.detectedFoods || [];
  const hasIronRich = foods.some((f) => {
    const name = f.name.toLowerCase();
    return (
      name.includes('spinach') ||
      name.includes('lentil') ||
      name.includes('dal') ||
      name.includes('meat') ||
      name.includes('egg') ||
      name.includes('oat')
    );
  });

  if (hasIronRich) {
    motherTitle = 'Nutrient-Dense Meal Choice';
    motherBody = `This meal contains iron-rich ingredients that actively support blood recovery and energy replenishment for ${motherName} during day ${postDay} postpartum.`;
    nutrientHighlight = 'High Iron & Protein';
  } else if ((input.recentMealIronTotalMg || 0) < 15) {
    motherTitle = 'Low Recent Iron Balance';
    motherBody = `Based on recent meal log history for ${motherName}, iron intake has been below typical postpartum target suggestions.`;
    motherRec = 'Consider adding iron-dense foods like lentils, spinach, or pumpkin seeds to your next meal.';
  }

  // Baby Insights
  const babyTitle = `${babyName}’s Feeding Stage`;
  let stageContext = '0–6 Months (Exclusive Milk Phase)';
  let babyBody = `At ${input.babyAge?.formatted || 'under 6 months'}, ${babyName}'s digestive system is designed exclusively for breast milk or formula. Complementary solid foods are not yet recommended.`;
  let textureNote = 'Liquid feed (breast milk or formula) only.';

  if (babyMonths >= 6 && babyMonths < 9) {
    stageContext = '6–8 Months (Early Solid Exploration)';
    babyBody = `At ${babyMonths} months, ${babyName} is exploring early complementary foods. Focus on single-ingredient smooth purees or soft mashes.`;
    textureNote = 'Smooth puree or soft fork-mashed texture.';
  } else if (babyMonths >= 9 && babyMonths < 12) {
    stageContext = '9–11 Months (Soft Finger Foods)';
    babyBody = `At ${babyMonths} months, ${babyName} can practice pincer grasp with soft, bite-sized pieces and mashed table foods.`;
    textureNote = 'Soft, diced finger foods or thick mashes.';
  } else if (babyMonths >= 12) {
    stageContext = '12–24 Months (Toddler Table Foods)';
    babyBody = `At ${babyMonths} months, ${babyName} can share modified family meals with balanced grains, vegetables, and proteins.`;
    textureNote = 'Small soft bite-sized table portions.';
  }

  // Hydration Context
  const waterMl = input.recentWaterTotalMl || 0;
  let hydrationContext = 'Maintain a target of 2.0 to 2.5 L of water throughout the day to support recovery and hydration.';
  if (waterMl > 0) {
    hydrationContext = `Logged ${(waterMl / 1000).toFixed(1)} L of water today. Staying hydrated supports daily energy and recovery.`;
  }

  return {
    motherObservation: {
      title: motherTitle,
      body: motherBody,
      nutrientHighlight,
      recommendation: motherRec,
    },
    babyObservation: {
      title: babyTitle,
      body: babyBody,
      stageContext,
      textureNote,
    },
    hydrationContext,
  };
}
