'use client';

import { useState } from 'react';
import { ONBOARDING_SLIDES } from '@/lib/types';

export function Onboarding({ onComplete }: { onComplete: (name?: string) => void | Promise<void> }) {
  const [name, setName] = useState('');
  return (
    <section className="container" style={{ padding: '48px 0 80px' }}>
      <div className="card" style={{ padding: 28, display: 'grid', gap: 20 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="badge">Welcome to LunchCrew</span>
          <h1 style={{ margin: 0, fontSize: 40 }}>Set your name, then start lunch diplomacy.</h1>
          <p className="dim" style={{ margin: 0, maxWidth: 720 }}>No account flow, no password detour. Just enough identity for your crew to know who voted.</p>
        </div>
        <div className="grid grid-3">
          {ONBOARDING_SLIDES.map((slide) => (
            <article key={slide.title} className="panel" style={{ padding: 18, display: 'grid', gap: 8 }}>
              <strong>{slide.title}</strong>
              <span className="dim">{slide.body}</span>
            </article>
          ))}
        </div>
        <div className="panel" style={{ padding: 18, display: 'grid', gap: 12 }}>
          <label htmlFor="display-name" className="muted">Display name</label>
          <input id="display-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="How your crew should see you" maxLength={32} />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span className="muted">Optional now, editable later in settings.</span>
            <button className="button button-primary" onClick={() => onComplete(name)}>Enter the app</button>
          </div>
        </div>
      </div>
    </section>
  );
}
