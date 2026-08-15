import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NavAura AI Maternal & Infant Nutrition Companion',
    groqModel: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b',
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
  });
}
