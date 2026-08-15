export function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY ?? '';
  const model = process.env.GROQ_VISION_MODEL ?? 'qwen/qwen3.6-27b';

  return { apiKey, model };
}

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  };
}
