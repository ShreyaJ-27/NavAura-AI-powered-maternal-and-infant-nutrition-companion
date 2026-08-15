export type EvidenceReference = {
  organization: string;
  topic: string;
  recommendation: string;
  sourceUrl?: string;
};

export type SafetyEvaluationInput = {
  babyAgeDays: number;
  foodName: string;
  texture?: string;
  preparation?: string;
  knownAllergens?: string[];
  pastIntroductions?: string[];
};

export type SafetyEvaluationOutput = {
  status: 'safe-context' | 'caution' | 'needs-review' | 'insufficient-data';
  appropriateToExplore: boolean;
  statusBadge: {
    label: string;
    variant: 'emerald' | 'amber' | 'rose' | 'stone';
  };
  chokingConsiderations: string[];
  textureAdjustments: string[];
  preparationTips: string[];
  allergenWarnings: string[];
  insufficientEvidence: string[];
  evidence: EvidenceReference[];
};

const HIGH_CHOKING_RISK_FOODS = [
  'grapes',
  'whole grapes',
  'nuts',
  'whole nuts',
  'peanuts',
  'popcorn',
  'hard candy',
  'raw apple',
  'raw carrot',
  'whole cherry tomatoes',
  'hot dog',
  'sausage',
  'large chunks of meat',
  'sticky peanut butter',
];

const MAJOR_ALLERGENS = [
  'egg',
  'peanuts',
  'tree nuts',
  'cow milk',
  'dairy',
  'soy',
  'wheat',
  'fish',
  'shellfish',
  'sesame',
];

export function evaluateSafetyEngine(input: SafetyEvaluationInput): SafetyEvaluationOutput {
  const foodLower = (input.foodName || '').toLowerCase();
  const ageDays = Math.max(0, Number(input.babyAgeDays) || 0);
  const ageMonths = Math.floor(ageDays / 30.4375);
  const texture = (input.texture || 'unclear').toLowerCase();
  const preparation = (input.preparation || 'unclear').toLowerCase();
  const pastIntroductions = (input.pastIntroductions || []).map((s) => s.toLowerCase());

  const chokingConsiderations: string[] = [];
  const textureAdjustments: string[] = [];
  const preparationTips: string[] = [];
  const allergenWarnings: string[] = [];
  const insufficientEvidence: string[] = [];
  const evidence: EvidenceReference[] = [];

  // Age Context & Evidence
  if (ageMonths < 6) {
    insufficientEvidence.push(
      'Baby is under 6 months old. World Health Organization (WHO) and UNICEF guidelines recommend exclusive breastfeeding or formula until approximately 6 months of age.',
    );
    evidence.push({
      organization: 'WHO / UNICEF',
      topic: 'Infant Feeding Guidelines',
      recommendation: 'Exclusive breastfeeding is recommended for the first 6 months of life. Complementary feeding should begin at 6 months alongside continued feeding.',
    });
  } else {
    evidence.push({
      organization: 'UNICEF / WHO IYCF',
      topic: 'Complementary Feeding (6-24 Months)',
      recommendation: 'At 6 months, introduce nutrient-dense complementary foods with appropriate textures (smooth purees progressing to mashed, soft finger foods).',
    });
  }

  // Choking Hazard Rules
  const isChokingRisk = HIGH_CHOKING_RISK_FOODS.some((item) => foodLower.includes(item)) || texture === 'whole' || texture === 'hard';
  if (isChokingRisk) {
    chokingConsiderations.push(
      'High Choking Hazard: Whole round, hard, or sticky foods present choking risks for infants and toddlers.',
    );
    if (foodLower.includes('grape') || foodLower.includes('cherry tomato')) {
      preparationTips.push('Always slice grapes or cherry tomatoes lengthwise into quarters before serving.');
    } else if (foodLower.includes('apple') || foodLower.includes('carrot')) {
      preparationTips.push('Steam or boil until soft, or grate finely. Never serve raw, hard chunks.');
    } else if (foodLower.includes('nut') || foodLower.includes('peanut')) {
      preparationTips.push('Never offer whole nuts. Thin smooth nut butters with warm water or puree into oatmeals.');
    }
    evidence.push({
      organization: 'USDA / American Academy of Pediatrics',
      topic: 'Choking Hazard Prevention',
      recommendation: 'Modify round or hard foods by slicing lengthwise into small pieces or cooking until mashable with a fork.',
    });
  }

  // Texture Progression Rules
  if (ageMonths >= 6 && ageMonths < 9) {
    if (texture === 'chunks' || texture === 'lumpy' || texture === 'whole') {
      textureAdjustments.push('At 6–8 months, foods should be smooth purees or well-mashed soft single-ingredient textures.');
    }
  } else if (ageMonths >= 9 && ageMonths < 12) {
    if (texture === 'pureed') {
      textureAdjustments.push('At 9–11 months, encourage soft finger foods and finely chopped table foods to promote chewing development.');
    }
  }

  // Preparation Rules
  if (preparation === 'raw' && (foodLower.includes('meat') || foodLower.includes('egg') || foodLower.includes('fish'))) {
    preparationTips.push('Raw or undercooked animal products must not be fed to infants due to bacterial infection risk.');
  } else if (preparation === 'fried') {
    preparationTips.push('Deep-fried or heavily spiced foods are hard on an infant digestive system. Choose gentle steaming or baking.');
  }

  // Allergen Awareness Rules
  const isMajorAllergen = MAJOR_ALLERGENS.some((alg) => foodLower.includes(alg));
  if (isMajorAllergen) {
    const isAlreadyIntroduced = pastIntroductions.includes(foodLower);
    if (!isAlreadyIntroduced) {
      allergenWarnings.push(
        'Common Allergen: Introduce major allergens one at a time in small amounts during daylight hours, observing for 3–5 days without introducing other new foods.',
      );
      evidence.push({
        organization: 'National Institute of Allergy and Infectious Diseases (NIAID)',
        topic: 'Early Allergen Introduction',
        recommendation: 'Early introduction of potential allergens (such as egg and peanut) after 6 months can reduce the risk of developing food allergies.',
      });
    } else {
      allergenWarnings.push('Previously introduced allergen record found. Continue monitoring overall tolerance.');
    }
  }

  // Honey Warning (Infant Botulism)
  if (foodLower.includes('honey') && ageMonths < 12) {
    chokingConsiderations.push('CRITICAL SAFETY ALERT: Do not give honey to infants under 12 months due to risk of infant botulism.');
    evidence.push({
      organization: 'CDC / AAP',
      topic: 'Infant Botulism Prevention',
      recommendation: 'Honey can contain Clostridium botulinum spores that produce toxin in an infant’s intestine. Never offer honey before age 1.',
    });
  }

  // Salt & Sugar Warning
  if ((foodLower.includes('salt') || foodLower.includes('sugar') || foodLower.includes('candy')) && ageMonths < 24) {
    preparationTips.push('Avoid added salt or refined sugars in infant meals to protect developing kidneys and dental health.');
  }

  // Status derivation
  let status: SafetyEvaluationOutput['status'] = 'safe-context';
  if (foodLower.includes('honey') && ageMonths < 12) {
    status = 'needs-review';
  } else if (isChokingRisk || ageMonths < 6) {
    status = 'caution';
  } else if (insufficientEvidence.length > 0) {
    status = 'insufficient-data';
  }

  let statusBadge: SafetyEvaluationOutput['statusBadge'] = { label: 'Suitable for exploration', variant: 'emerald' };
  if (status === 'needs-review') {
    statusBadge = { label: 'Avoid / High Risk', variant: 'rose' };
  } else if (status === 'caution') {
    statusBadge = { label: 'Modify texture / Caution', variant: 'amber' };
  } else if (status === 'insufficient-data') {
    statusBadge = { label: 'Consult Care Guidance', variant: 'stone' };
  }

  const appropriateToExplore = ageMonths >= 6 && !foodLower.includes('honey') && !isChokingRisk;

  return {
    status,
    appropriateToExplore,
    statusBadge,
    chokingConsiderations,
    textureAdjustments,
    preparationTips,
    allergenWarnings,
    insufficientEvidence,
    evidence,
  };
}
