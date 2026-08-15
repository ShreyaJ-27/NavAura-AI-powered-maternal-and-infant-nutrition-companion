'use client';

import { AppShell } from '@/components/app-shell';
import { VoiceClient } from '@/components/voice/voice-client';

export default function VoicePage() {
  return (
    <AppShell title="Talk to NavAura">
      <div className="max-w-6xl mx-auto py-2">
        <VoiceClient />
      </div>
    </AppShell>
  );
}
