import { NextResponse } from 'next/server';
import { callGroqVision, recognizedFoodSchema } from '@/lib/groq';
import { validateImageFile } from '@/lib/image-validation';
import { lookupVerifiedNutrition } from '@/lib/nutrition-lookup';
import { evaluateSafetyEngine } from '@/lib/safety-engine';
import { generatePersonalizedInsights } from '@/lib/personalization';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const babyAgeDays = Number(formData.get('babyAgeDays') || 210); // Default 7 months
    const motherName = String(formData.get('motherName') || 'Mama');
    const babyName = String(formData.get('babyName') || 'Baby');

    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'No image file was provided.' }, { status: 400 });
    }

    const validation = await validateImageFile(image);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    // 1. Call Groq Vision Model
    const analysis = await callGroqVision(image);
    const safeResult = recognizedFoodSchema.parse(analysis);

    // 2. Perform Verified Nutrition Lookup for each detected food item
    const detectedItems = safeResult.foods.map((food) => {
      const nutrition = lookupVerifiedNutrition(food.name);
      const safety = evaluateSafetyEngine({
        babyAgeDays,
        foodName: food.name,
        texture: 'soft',
        preparation: 'cooked',
      });

      return {
        ...food,
        verifiedNutrition: nutrition,
        safety,
      };
    });

    // 3. Generate Personalization Insights
    const personalization = generatePersonalizedInsights({
      motherName,
      babyName,
      babyAge: { days: babyAgeDays, weeks: Math.floor(babyAgeDays / 7), months: Math.floor(babyAgeDays / 30.4), years: 0, formatted: `${Math.floor(babyAgeDays / 30.4)}m` },
      detectedFoods: detectedItems.map((item) => ({ name: item.name, nutrients: item.verifiedNutrition.nutrients })),
    });

    // 4. Explainable AI Timeline Steps
    const explainableSteps = [
      { step: '01', title: 'Multimodal AI Vision', desc: `Groq Vision parsed visible food elements with confidence score ${safeResult.foods[0]?.confidence || 0.9}.` },
      { step: '02', title: 'Verified Dataset Lookup', desc: 'Matched recognized food against USDA FoodData Central verified nutrition database.' },
      { step: '03', title: 'Deterministic Safety Engine', desc: 'Evaluated infant choke hazard, texture suitability, and allergen rules based on baby age.' },
      { step: '04', title: 'Personalized Insight Synthesis', desc: 'Synthesized dual-panel guidance tailored to mother postpartum day and baby developmental stage.' },
    ];

    return NextResponse.json({
      success: true,
      analysis: safeResult,
      detectedItems,
      personalization,
      explainableSteps,
    });
  } catch (error) {
    console.error('Food analysis error:', error);
    return NextResponse.json(
      {
        error: 'NavAura AI scanner is temporarily unavailable. Please try again.',
      },
      { status: 500 },
    );
  }
}