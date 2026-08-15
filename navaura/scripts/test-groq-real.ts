import { callGroqVision } from '../lib/groq';
import fs from 'fs';
import path from 'path';

async function testWithRealImage() {
  const imgPath = path.join(process.cwd(), 'node_modules', '@supabase', 'phoenix', 'priv', 'static', 'phoenix-orange.png');
  const buffer = fs.readFileSync(imgPath);
  const file = new File([buffer], 'plate.png', { type: 'image/png' });

  try {
    const result = await callGroqVision(file);
    console.log('✅ Groq Vision Recognized Real Image Successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error('Groq test result:', err.message);
  }
}

testWithRealImage();
