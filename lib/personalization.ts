import { PostpartumAge, BabyAge } from './age';
import { VerifiedNutrients } from './nutrition-lookup';

export type ChildProfile = {
  name: string;
  ageMonths: number;
  ageFormatted: string;
  complications?: string;
};

export type PersonalizationInput = {
  motherName?: string;
  postpartumStage?: PostpartumAge | null;
  babyName?: string;
  babyAge?: BabyAge | null;
  feedingMethod?: string;
  dietaryRestrictions?: string[];
  motherComplications?: string;
  babyComplications?: string;
  children?: ChildProfile[];
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
  complicationNote?: string;
};

export type BabyPersonalizedObservation = {
  title: string;
  body: string;
  stageContext: string;
  textureNote: string;
  complicationNote?: string;
};

export type PersonalizationResult = {
  motherObservation: MotherPersonalizedObservation;
  babyObservation: BabyPersonalizedObservation;
  hydrationContext: string;
};

export function generatePersonalizedInsights(input: PersonalizationInput): PersonalizationResult {
  const motherName = input.motherName || 'Mama';
  const babyName = input.children?.[0]?.name || input.babyName || 'Baby';
  const postDay = input.postpartumStage?.day ?? 14;
  const babyMonths = input.children?.[0]?.ageMonths ?? input.babyAge?.months ?? 6;
  const feedingMethod = input.feedingMethod || 'mixed';
  const motherComplications = input.motherComplications || 'None';
  const babyComplications = input.children?.[0]?.complications || input.babyComplications || 'None';
  const isMultipleChildren = (input.children?.length ?? 0) > 1;

  // --- MOTHER INSIGHTS ---
  let motherTitle = `${motherName}'s Recovery & Energy`;
  let motherBody = `At day ${postDay} postpartum, your body requires nutrient-dense meals rich in protein, iron, and hydration to support tissue healing${feedingMethod !== 'formula' ? ' and milk production' : ''}.`;
  let nutrientHighlight = 'Protein & Iron';
  let motherRec = 'Include dark leafy greens, legumes, or lean meats alongside Vitamin C sources to enhance iron absorption.';
  let complicationNote: string | undefined;

  // Complication-specific advice
  if (motherComplications && motherComplications !== 'None' && motherComplications !== 'none') {
    const compLower = motherComplications.toLowerCase();
    if (compLower.includes('thyroid')) {
      complicationNote = 'Thyroid support: Prioritize iodine-rich foods (seaweed, fish, dairy) and selenium (Brazil nuts, eggs). Avoid excess raw cruciferous vegetables.';
      nutrientHighlight = 'Iodine & Selenium';
    } else if (compLower.includes('anemi') || compLower.includes('iron')) {
      complicationNote = 'Iron-deficiency support: Pair iron-rich foods with Vitamin C to maximize absorption. Avoid tea/coffee within an hour of meals.';
      nutrientHighlight = 'High Iron + Vitamin C';
    } else if (compLower.includes('diabet') || compLower.includes('gestational diabet')) {
      complicationNote = 'Blood sugar management: Favor low-glycemic foods (legumes, non-starchy vegetables, whole grains). Space carbohydrates evenly throughout the day.';
      nutrientHighlight = 'Low Glycemic Index';
    } else if (compLower.includes('c-section') || compLower.includes('caesarean') || compLower.includes('cesarean')) {
      complicationNote = 'C-section recovery: Extra Vitamin C (citrus, bell peppers) and Zinc (pumpkin seeds, meat) speed wound healing. Increase fiber to ease constipation.';
      nutrientHighlight = 'Vitamin C & Zinc';
    } else if (compLower.includes('preeclamps') || compLower.includes('blood pressure')) {
      complicationNote = 'Blood pressure support: Prioritize potassium-rich foods (bananas, sweet potato) and reduce sodium intake. Magnesium from leafy greens helps.';
      nutrientHighlight = 'Potassium & Magnesium';
    } else if (compLower.includes('depress') || compLower.includes('anxiety') || compLower.includes('mood')) {
      complicationNote = 'Mood support: Omega-3 fatty acids (salmon, walnuts, flaxseed) support brain health. Consistent meals and blood sugar stability reduce anxiety.';
      nutrientHighlight = 'Omega-3 & B-Vitamins';
    } else {
      complicationNote = `Given ${motherComplications}, consult your healthcare provider for specific dietary modifications alongside these general postpartum nutrition guidelines.`;
    }
  }

  // Multiple children extra caloric note
  if (isMultipleChildren) {
    const numChildren = input.children?.length ?? 2;
    motherBody += ` As a mother of ${numChildren === 2 ? 'twins' : `${numChildren} children`}, your caloric and nutritional needs are significantly higher — ensure adequate protein, iron, and caloric intake to support recovery and multiple feeds.`;
    nutrientHighlight = 'High Protein & Iron (Multiple Children)';
  }

  const foods = input.detectedFoods || [];
  const hasIronRich = foods.some((f) => {
    const name = f.name.toLowerCase();
    return name.includes('spinach') || name.includes('lentil') || name.includes('dal') ||
           name.includes('meat') || name.includes('egg') || name.includes('oat');
  });

  if (hasIronRich) {
    motherTitle = 'Nutrient-Dense Meal Choice';
    motherBody = `This meal contains iron-rich ingredients that actively support blood recovery and energy replenishment for ${motherName} during day ${postDay} postpartum${feedingMethod !== 'formula' ? ' and help maintain healthy milk supply' : ''}.`;
    nutrientHighlight = 'High Iron & Protein';
  } else if ((input.recentMealIronTotalMg || 0) < 15) {
    motherTitle = 'Low Recent Iron Balance';
    motherBody = `Based on recent meal log history for ${motherName}, iron intake has been below typical postpartum target suggestions.`;
    motherRec = 'Consider adding iron-dense foods like lentils, spinach, or pumpkin seeds to your next meal.';
  }

  // Feeding method specific advice
  if (feedingMethod === 'exclusive-breastfeeding') {
    motherRec = `${motherRec} As you're exclusively breastfeeding, ensure you consume an extra 400–500 kcal/day and stay well hydrated (2.5 L minimum).`;
  }

  // --- BABY / CHILDREN INSIGHTS ---
  let babyTitle = `${babyName}'s Feeding Stage`;
  let stageContext = '0–6 Months (Exclusive Milk Phase)';
  let babyBody = `At ${input.children?.[0]?.ageFormatted || 'under 6 months'}, ${babyName}'s digestive system is designed exclusively for breast milk or formula. Complementary solid foods are not yet recommended.`;
  let textureNote = 'Liquid feed (breast milk or formula) only.';
  let babyComplicationNote: string | undefined;

  if (babyComplications && babyComplications !== 'None' && babyComplications !== 'none') {
    const bcLower = babyComplications.toLowerCase();
    if (bcLower.includes('gerd') || bcLower.includes('reflux')) {
      babyComplicationNote = 'GERD/Reflux: Offer smaller, more frequent feeds. Keep baby upright for 20–30 min after feeds. Thickened feeds may help — consult your pediatrician.';
    } else if (bcLower.includes('cow milk') || bcLower.includes('cmpa') || bcLower.includes('dairy allerg')) {
      babyComplicationNote = 'CMPA: Avoid all cow milk proteins. If breastfeeding, mother should eliminate dairy. Discuss hypoallergenic formula options with your pediatrician.';
    } else if (bcLower.includes('premature') || bcLower.includes('preterm')) {
      babyComplicationNote = 'Premature baby: Adjust developmental milestones to corrected age. Consult your neonatologist before introducing solids — corrected age should be 6+ months.';
    } else if (bcLower.includes('lactose')) {
      babyComplicationNote = 'Lactose sensitivity: Lactase drops or lactose-free formula may help. Breastfed babies rarely have true lactose intolerance — consult your pediatrician.';
    }
  }

  if (babyMonths >= 6 && babyMonths < 9) {
    stageContext = '6–8 Months (Early Solid Exploration)';
    babyBody = `At ${babyMonths} months, ${babyName} is exploring early complementary foods. Focus on single-ingredient smooth purees or soft mashes — sweet potato, banana, avocado, and iron-fortified cereals.`;
    textureNote = 'Smooth puree or soft fork-mashed texture.';
  } else if (babyMonths >= 9 && babyMonths < 12) {
    stageContext = '9–11 Months (Soft Finger Foods)';
    babyBody = `At ${babyMonths} months, ${babyName} can practice pincer grasp with soft, bite-sized pieces and mashed table foods. Introduce family foods (modified texture) alongside breast milk or formula.`;
    textureNote = 'Soft, diced finger foods or thick mashes.';
  } else if (babyMonths >= 12) {
    stageContext = '12–24 Months (Toddler Table Foods)';
    babyBody = `At ${babyMonths} months, ${babyName} can share modified family meals with balanced grains, vegetables, and proteins. Limit added salt, sugar, and honey.`;
    textureNote = 'Small soft bite-sized table portions.';
  }

  // Multiple children in baby observation
  if (isMultipleChildren && (input.children?.length ?? 0) > 1) {
    const allNames = input.children!.map((c) => c.name).join(' & ');
    babyTitle = `${allNames}'s Feeding Stages`;
    const differentStages = new Set(input.children!.map((c) => (c.ageMonths < 6 ? 'milk' : c.ageMonths < 9 ? 'puree' : c.ageMonths < 12 ? 'finger' : 'toddler'))).size > 1;
    if (differentStages) {
      babyBody = `Your children are at different developmental stages — each needs age-appropriate textures and portions. Check the Baby Journey page for individual profiles.`;
    }
  }

  // --- HYDRATION ---
  const waterMl = input.recentWaterTotalMl || 0;
  let hydrationContext = `Aim for 2.5 L of water daily to support ${feedingMethod !== 'formula' ? 'milk production and ' : ''}recovery.`;
  if (waterMl > 0) {
    hydrationContext = `${motherName} has logged ${(waterMl / 1000).toFixed(1)} L today. ${waterMl >= 2500 ? 'Hydration goal achieved! 🎉' : `${Math.max(0, 2500 - waterMl)} mL remaining — warm herbal teas and coconut water count.`}`;
  }
  if (isMultipleChildren) {
    hydrationContext += ' Breastfeeding multiple babies requires extra fluid intake — aim for closer to 3 L/day.';
  }

  return {
    motherObservation: {
      title: motherTitle,
      body: motherBody,
      nutrientHighlight,
      recommendation: motherRec,
      complicationNote,
    },
    babyObservation: {
      title: babyTitle,
      body: babyBody,
      stageContext,
      textureNote,
      complicationNote: babyComplicationNote,
    },
    hydrationContext,
  };
}
