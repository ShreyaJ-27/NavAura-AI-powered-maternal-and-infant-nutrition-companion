import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/voice/config
 * Returns Vapi client-safe configuration to the browser.
 * VAPI_ASSISTANT_ID stays server-side; only the public key (already NEXT_PUBLIC_)
 * is truly needed client-side, but we expose the assistant ID from the server
 * so the private assistant ID never has to be a NEXT_PUBLIC_ variable.
 */
export async function GET() {
  const assistantId = process.env.VAPI_ASSISTANT_ID || '';
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

  if (!publicKey || !assistantId) {
    // Return empty strings — client will fall back to demo/speech mode
    return NextResponse.json({
      publicKey: publicKey,
      assistantId: '',
      configured: false,
    });
  }

  return NextResponse.json({
    publicKey,
    assistantId,
    configured: true,
  });
}
