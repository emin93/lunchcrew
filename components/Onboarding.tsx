'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ONBOARDING_SLIDES } from '@/lib/types';
import { Badge, Button, Card, Input, Panel } from '@/components/ui';

export function Onboarding({ onComplete }: { onComplete: (name?: string) => void | Promise<void> }) {
  const [name, setName] = useState('');

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="relative overflow-hidden p-8 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,209,102,0.28),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(255,122,89,0.22),transparent_24%)]" />
          <div className="relative grid gap-6">
            <Badge>Welcome to LunchCrew</Badge>
            <div className="grid gap-4">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-6xl">Set your name and walk straight into the lunch vibe.</h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--text-soft)] sm:text-lg">No password maze. No setup fatigue. Just enough identity to make every vote readable, friendly, and easy to reuse.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {ONBOARDING_SLIDES.map((slide) => (
                <Panel key={slide.title} className="grid gap-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(255,209,102,0.22),rgba(255,122,89,0.16))] text-[var(--accent)]"><Sparkles className="h-4 w-4" /></div>
                  <div>
                    <div className="text-base font-semibold text-[var(--text)]">{slide.title}</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{slide.body}</div>
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-8 sm:p-10">
          <div className="grid gap-5">
            <div>
              <div className="text-sm font-medium text-[var(--text-muted)]">Display name</div>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--text)]">How should your crew see you?</h2>
            </div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Emin, Em, Taco Scout…" maxLength={32} />
            <Panel className="p-4 text-sm leading-6 text-[var(--text-muted)]">Optional now, editable later in crew settings. Crew area is optional too, and your group can set or change it later.</Panel>
            <Button onClick={() => onComplete(name)} className="h-12 rounded-2xl">Enter the app <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
