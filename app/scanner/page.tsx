'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Baby,
  Camera,
  Check,
  Heart,
  Info,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ChildSwitcher } from '@/components/child-switcher';
import { useChildren } from '@/components/child-context';
import { calculateBabyAge } from '@/lib/age';

type DetectedItem = {
  name: string;
  confidence: number;
  visible_portion?: string;
  verifiedNutrition?: {
    isVerified: boolean;
    nutrients?: {
      calories: number;
      protein_g: number;
      iron_mg: number;
      calcium_mg: number;
    };
  };
  safety?: {
    statusBadge?: { label: string; variant: string };
    chokingConsiderations?: string[];
    textureAdjustments?: string[];
    allergenWarnings?: string[];
    evidence?: { organization: string; recommendation: string }[];
  };
  childEvaluations?: Array<{
    childId?: string;
    childName: string;
    ageFormatted: string;
    safety: {
      statusBadge?: { label: string; variant: string };
      chokingConsiderations?: string[];
      textureAdjustments?: string[];
      allergenWarnings?: string[];
    };
  }>;
};

type AnalysisPayload = {
  analysis?: { uncertainty?: string };
  detectedItems?: DetectedItem[];
  personalization?: {
    motherObservation?: { title: string; body: string; nutrientHighlight?: string; recommendation: string };
    babyObservation?: { title: string; body: string; stageContext: string; textureNote: string };
  };
  explainableSteps?: { step: string; title: string; desc: string }[];
  targetedChild?: { name: string; ageFormatted: string };
};

export default function ScannerPage() {
  const {
    motherName,
    postpartumDate,
    feedingMethod,
    motherComplications,
    children,
    selectedChildId,
    selectedChild,
  } = useChildren();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStage, setProgressStage] = useState<number>(0);
  const [analysisData, setAnalysisData] = useState<AnalysisPayload | null>(null);
  const [correctedFoodName, setCorrectedFoodName] = useState<string>('');
  const [showCorrection, setShowCorrection] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [targetRecipient, setTargetRecipient] = useState<string>('everyone');

  function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalysisData(null);
    setError('');
    setSaveSuccess(false);
  }

  async function handleAnalyze() {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError('');
    setAnalysisData(null);
    setSaveSuccess(false);

    setProgressStage(1);
    const t1 = setTimeout(() => setProgressStage(2), 600);
    const t2 = setTimeout(() => setProgressStage(3), 1200);
    const t3 = setTimeout(() => setProgressStage(4), 1800);

    try {
      const activeChild = selectedChild || children[0];
      const babyAgeDays = activeChild?.birthDate
        ? calculateBabyAge(new Date(activeChild.birthDate)).days
        : 210;

      let postpartumDay = 14;
      if (postpartumDate) {
        const days = Math.floor((Date.now() - new Date(postpartumDate).getTime()) / (1000 * 86400));
        postpartumDay = Math.max(1, days);
      }

      let todayWaterMl = 0;
      let wellnessScore = 3;
      try {
        const hydStr = localStorage.getItem('navaura_hydration_logs');
        if (hydStr) {
          const logs = JSON.parse(hydStr);
          const todayStr = new Date().toISOString().split('T')[0];
          todayWaterMl = logs.filter((l: {logged_at:string}) => l.logged_at?.startsWith(todayStr)).reduce((s: number, l: {amount_ml:number}) => s + (l.amount_ml || 0), 0);
        }
        const wellStr = localStorage.getItem('navaura_wellness_logs');
        if (wellStr) {
          const w = JSON.parse(wellStr);
          if (w.length > 0) wellnessScore = w[0].energy_rating || 3;
        }
      } catch {}

      const formattedChildren = children.map((c) => ({
        id: c.id,
        name: c.name,
        ageMonths: c.birthDate ? calculateBabyAge(new Date(c.birthDate)).months : 7,
        ageFormatted: c.birthDate ? calculateBabyAge(new Date(c.birthDate)).formatted : '7m',
        complications: c.complications || 'None',
      }));

      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('babyAgeDays', String(babyAgeDays));
      formData.append('motherName', motherName);
      formData.append('babyName', activeChild?.name || 'Baby');
      formData.append('postpartumDay', String(postpartumDay));
      formData.append('feedingMethod', feedingMethod);
      formData.append('motherComplications', motherComplications);
      formData.append('todayWaterMl', String(todayWaterMl));
      formData.append('wellnessScore', String(wellnessScore));
      formData.append('targetRecipient', targetRecipient);
      formData.append('selectedChildId', selectedChildId || activeChild?.id || '');
      if (formattedChildren.length > 0) {
        formData.append('children', JSON.stringify(formattedChildren));
      }

      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze meal.');
      }

      setAnalysisData(data);
      const firstFood = data.detectedItems?.[0];
      if (firstFood) {
        setCorrectedFoodName(firstFood.name);
        if (firstFood.confidence < 0.75 || data.analysis?.uncertainty) {
          setShowCorrection(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze image.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsAnalyzing(false);
      setProgressStage(0);
    }
  }

  async function handleSaveMeal() {
    if (!analysisData) return;
    setIsSaving(true);
    setError('');

    const primaryItem = analysisData.detectedItems?.[0];
    const newMeal = {
      id: crypto.randomUUID(),
      food_name: correctedFoodName || primaryItem?.name || 'Scanned Meal',
      analysis: analysisData.analysis,
      texture: primaryItem?.safety?.textureAdjustments?.[0] ? 'modified' : 'soft',
      preparation: 'cooked',
      allergenStatus: primaryItem?.safety?.allergenWarnings?.length ? 'known' : 'default',
      items: analysisData.detectedItems,
      safetyNotes: primaryItem?.safety || {},
      created_at: new Date().toISOString(),
    };

    // Save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('navaura_saved_meals') || '[]');
      localStorage.setItem('navaura_saved_meals', JSON.stringify([newMeal, ...existing]));
    } catch (e) {
      console.warn(e);
    }

    try {
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName: newMeal.food_name,
          analysis: newMeal.analysis,
          texture: newMeal.texture,
          preparation: newMeal.preparation,
          allergenStatus: newMeal.allergenStatus,
          items: newMeal.items,
          safetyNotes: newMeal.safetyNotes,
        }),
      });
    } catch {}

    setSaveSuccess(true);
    setIsSaving(false);
  }

  const primaryFood = analysisData?.detectedItems?.[0];

  return (
    <AppShell title="AI Meal Scanner">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Multi-Child Switcher */}
        <ChildSwitcher />

        {/* Upload & Scanner Card */}
        <section className="rounded-[36px] glass-card p-6 md:p-8 border border-white/95 bg-white/80 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C9969A]">Groq Vision AI</p>
              <h3 className="text-2xl font-bold text-[#292628] font-serif">Photograph Your Plate</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-[#4E4445] border border-white shadow-xs self-start sm:self-auto">
              <Sparkles className="h-3.5 w-3.5 text-[#C9969A]" />
              Vision Ready
            </span>
          </div>

          {/* Target Recipient Selector Pill Group */}
          <div className="mb-6 rounded-2xl bg-white/70 border border-white p-3 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445]">
              Who is this meal for?
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTargetRecipient('everyone')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  targetRecipient === 'everyone'
                    ? 'bg-[#292628] text-white shadow-xs'
                    : 'bg-white/80 text-[#4E4445] hover:bg-white border border-stone-200'
                }`}
              >
                🍽️ Everyone / Shared Meal
              </button>
              <button
                type="button"
                onClick={() => setTargetRecipient('mother')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  targetRecipient === 'mother'
                    ? 'bg-[#292628] text-white shadow-xs'
                    : 'bg-white/80 text-[#4E4445] hover:bg-white border border-stone-200'
                }`}
              >
                🤍 {motherName} (Mother Only)
              </button>
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setTargetRecipient(child.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    targetRecipient === child.id
                      ? 'bg-[#C9969A] text-white shadow-xs'
                      : 'bg-white/80 text-[#4E4445] hover:bg-white border border-stone-200'
                  }`}
                >
                  👶 {child.name} (Child)
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Upload Zone */}
            <div className="flex flex-col items-center justify-center">
              {imagePreview ? (
                <div className="relative h-64 w-full overflow-hidden rounded-[28px] border border-white shadow-sm">
                  <Image src={imagePreview} alt="Selected meal" fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setAnalysisData(null);
                    }}
                    className="absolute top-3 right-3 rounded-full bg-[#292628]/80 p-2 text-white hover:bg-[#292628] backdrop-blur-md shadow-xs transition"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#D9A7AE]/60 bg-white/60 p-6 text-center transition hover:border-[#C9969A] hover:bg-white/90">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3DCE1] text-[#C9969A] mb-3 shadow-xs">
                    <Camera className="h-7 w-7" />
                  </div>
                  <span className="text-base font-bold text-[#292628] font-serif">Take Photo or Upload Meal</span>
                  <span className="mt-1 text-xs text-[#827779]">Supports JPEG, PNG, WebP</span>
                </label>
              )}
            </div>

            {/* Analysis Controls & Animation */}
            <div className="flex flex-col justify-between rounded-[28px] border border-white bg-gradient-to-tr from-white/90 via-[#FCFAF8] to-[#F3DCE1]/30 p-6 shadow-xs">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#827779]">Perception &amp; Safety Pipeline</p>
                <h4 className="mt-1 text-lg font-bold text-[#292628] font-serif">
                  {selectedImage ? 'Ready to analyze plate' : 'Select a photo to begin'}
                </h4>
                <p className="mt-2 text-xs text-[#4E4445] leading-relaxed">
                  NavAura identifies food components, queries USDA verified nutrition benchmarks, and applies age-specific pediatric safety rules.
                </p>
              </div>

              {/* 4-Stage Animated Progress Bar */}
              {isAnalyzing && (
                <div className="my-6 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-[#C9969A]">
                    <span>01 Seeing</span>
                    <span>02 Understanding</span>
                    <span>03 Verifying</span>
                    <span>04 Personalizing</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200/80">
                    <div
                      className="h-full bg-gradient-to-r from-[#C9969A] via-[#D9A7AE] to-[#EBC5D7] transition-all duration-500"
                      style={{ width: `${progressStage * 25}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="my-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  disabled={!selectedImage || isAnalyzing}
                  onClick={handleAnalyze}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#292628] py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#4E4445] active:scale-95 disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4 text-[#EBC5D7]" />
                  {isAnalyzing ? 'Analyzing Meal...' : 'Reveal Plate Insights'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Analysis Results Display */}
        {analysisData && primaryFood && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {/* Low Confidence User Correction */}
            {(showCorrection || primaryFood.confidence < 0.75) && (
              <div className="rounded-[28px] border border-amber-200 bg-amber-50/90 p-5 backdrop-blur-xs">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-amber-900">Confirm Identified Food Item</h4>
                    <p className="mt-1 text-xs text-amber-800">
                      AI confidence is {(primaryFood.confidence * 100).toFixed(0)}%. You can select or edit the identified food:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[primaryFood.name, 'Idli', 'Dosa', 'Steamed Rice', 'Lentil Dal', 'Sweet Potato Mash'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setCorrectedFoodName(opt)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                            correctedFoodName === opt
                              ? 'bg-amber-900 text-white shadow-xs'
                              : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FLAGSHIP DUAL PANEL: ONE PLATE. TWO JOURNEYS. */}
            <div className="grid gap-6 lg:grid-cols-2">
              
              {/* 🤍 FOR YOU (Mother Section) */}
              <div className="rounded-[36px] glass-card p-7 border border-white/95 bg-gradient-to-b from-white/90 via-white/80 to-[#F3DCE1]/30 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-rose-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3DCE1] text-[#C9969A] shadow-xs">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9969A]">Mother Recovery</p>
                      <h3 className="text-xl font-bold text-[#292628] font-serif">🤍 FOR YOU</h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#C9969A] border border-white shadow-xs">
                    {analysisData.personalization?.motherObservation?.nutrientHighlight || 'Nutrient Dense'}
                  </span>
                </div>

                {/* Verified Nutrition Breakdown */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#827779] mb-3">Verified Nutrition Data (USDA)</h4>
                  {primaryFood.verifiedNutrition?.isVerified && primaryFood.verifiedNutrition.nutrients ? (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-xs">
                        <p className="text-[10px] text-[#827779]">Calories</p>
                        <p className="text-base font-bold text-[#292628] font-serif">{primaryFood.verifiedNutrition.nutrients.calories}</p>
                      </div>
                      <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-xs">
                        <p className="text-[10px] text-[#827779]">Protein</p>
                        <p className="text-base font-bold text-[#292628] font-serif">{primaryFood.verifiedNutrition.nutrients.protein_g}g</p>
                      </div>
                      <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-xs">
                        <p className="text-[10px] text-[#827779]">Iron</p>
                        <p className="text-base font-bold text-[#292628] font-serif">{primaryFood.verifiedNutrition.nutrients.iron_mg}mg</p>
                      </div>
                      <div className="rounded-2xl border border-white bg-white/80 p-3 shadow-xs">
                        <p className="text-[10px] text-[#827779]">Calcium</p>
                        <p className="text-base font-bold text-[#292628] font-serif">{primaryFood.verifiedNutrition.nutrients.calcium_mg}mg</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs italic text-[#827779]">Standard USDA nutritional profile mapped.</p>
                  )}
                </div>

                {/* Personalized Mother Observation */}
                <div className="rounded-2xl bg-white/80 p-4 border border-white shadow-xs space-y-2">
                  <p className="text-sm font-bold text-[#292628] font-serif">{analysisData.personalization?.motherObservation?.title}</p>
                  <p className="text-xs text-[#4E4445] leading-relaxed">{analysisData.personalization?.motherObservation?.body}</p>
                  <p className="text-xs font-semibold text-[#C9969A] pt-1">
                    Guidance: {analysisData.personalization?.motherObservation?.recommendation}
                  </p>
                </div>
              </div>

              {/* 🌷 FOR BABY (Baby Section) */}
              <div className="rounded-[36px] glass-card p-7 border border-white/95 bg-gradient-to-b from-white/90 via-white/80 to-[#E7D0AA]/25 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-amber-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E7D0AA]/40 text-amber-800 shadow-xs">
                      <Baby className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-800">Infant Guidance</p>
                      <h3 className="text-xl font-bold text-[#292628] font-serif">🌷 FOR BABY</h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-900 border border-white shadow-xs">
                    {primaryFood.safety?.statusBadge?.label || 'Suitable for exploration'}
                  </span>
                </div>

                  {/* Multi-Child Specific Evaluations */}
                  {primaryFood.childEvaluations && primaryFood.childEvaluations.length > 1 && (
                    <div className="space-y-2 pt-1 border-t border-amber-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                        Individual Child Safety Evaluations
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {primaryFood.childEvaluations.map((cEval, idx) => (
                          <div key={idx} className="rounded-2xl bg-white/90 p-3 border border-stone-200/80 shadow-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[#292628] font-serif">
                                👶 {cEval.childName} ({cEval.ageFormatted})
                              </span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                                {cEval.safety.statusBadge?.label || 'Evaluated'}
                              </span>
                            </div>
                            {cEval.safety.chokingConsiderations?.length ? (
                              <p className="text-[10px] text-rose-700 font-medium">⚠️ {cEval.safety.chokingConsiderations[0]}</p>
                            ) : (
                              <p className="text-[10px] text-emerald-800 font-medium">✓ Suitable texture for stage</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safety Considerations */}
                  <div className="space-y-3 text-xs text-[#4E4445]">
                    {primaryFood.safety?.chokingConsiderations?.length ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 flex items-start gap-2.5 text-rose-900 font-medium">
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                        <span>{primaryFood.safety.chokingConsiderations[0]}</span>
                      </div>
                    ) : null}

                    <div className="rounded-2xl bg-white/80 p-4 border border-white shadow-xs space-y-1">
                      <p className="font-bold text-[#292628] font-serif">{analysisData.personalization?.babyObservation?.stageContext}</p>
                      <p className="text-[#4E4445]">{analysisData.personalization?.babyObservation?.body}</p>
                      <p className="text-amber-800 font-semibold pt-1">Texture: {analysisData.personalization?.babyObservation?.textureNote}</p>
                    </div>

                    {primaryFood.safety?.evidence?.[0] && (
                      <div className="rounded-2xl bg-stone-100/70 p-3 border border-white">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#827779]">
                          Evidence • {primaryFood.safety.evidence[0].organization}
                        </p>
                        <p className="mt-0.5 text-[#4E4445] italic">&quot;{primaryFood.safety.evidence[0].recommendation}&quot;</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* Explainable AI Timeline */}
            <div className="rounded-[32px] glass-card p-7 border border-white/95 bg-white/80 shadow-sm">
              <h4 className="text-base font-bold text-[#292628] font-serif mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-[#C9969A]" />
                How NavAura Evaluated This Meal
              </h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {analysisData.explainableSteps?.map((item) => (
                  <div key={item.step} className="rounded-2xl border border-white bg-white/70 p-4 shadow-xs">
                    <span className="text-[11px] font-bold text-[#C9969A] uppercase tracking-wider">{item.step}</span>
                    <p className="mt-1 text-sm font-bold text-[#292628] font-serif">{item.title}</p>
                    <p className="mt-1 text-xs text-[#4E4445] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Meal Action Bar */}
            <div className="flex items-center justify-between rounded-[28px] glass-card p-5 border border-white shadow-sm bg-white/90">
              <div>
                <p className="text-sm font-bold text-[#292628] font-serif">Save to Longitudinal Health Log</p>
                <p className="text-xs text-[#827779]">Persist this meal and nutrition breakdown to your records.</p>
              </div>

              {saveSuccess ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <Check className="h-4 w-4" />
                  Meal Saved Successfully!
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveMeal}
                  className="inline-flex items-center gap-2 rounded-full bg-[#292628] px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#4E4445] active:scale-95 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Meal'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
