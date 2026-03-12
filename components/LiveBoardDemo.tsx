'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Panel } from '@/components/ui';

const FRAMES = [
  {
    event: 'Maya just voted for Tacos del Centro',
    items: [
      { name: 'Tacos del Centro', votes: 8, meta: 'Map · Menu' },
      { name: 'Noodle House', votes: 5, meta: 'Map' },
      { name: 'Green Bowl', votes: 3, meta: 'Menu' },
    ],
    hot: 'Tacos del Centro',
  },
  {
    event: 'Jon just voted for Noodle House',
    items: [
      { name: 'Tacos del Centro', votes: 8, meta: 'Map · Menu' },
      { name: 'Noodle House', votes: 6, meta: 'Map' },
      { name: 'Green Bowl', votes: 3, meta: 'Menu' },
    ],
    hot: 'Noodle House',
  },
  {
    event: 'Nina just voted for Tacos del Centro',
    items: [
      { name: 'Tacos del Centro', votes: 9, meta: 'Map · Menu' },
      { name: 'Noodle House', votes: 6, meta: 'Map' },
      { name: 'Green Bowl', votes: 3, meta: 'Menu' },
    ],
    hot: 'Tacos del Centro',
  },
  {
    event: 'Leo just voted for Green Bowl',
    items: [
      { name: 'Tacos del Centro', votes: 9, meta: 'Map · Menu' },
      { name: 'Noodle House', votes: 6, meta: 'Map' },
      { name: 'Green Bowl', votes: 4, meta: 'Menu' },
    ],
    hot: 'Green Bowl',
  },
] as const;

export function LiveBoardDemo() {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % FRAMES.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  const frame = FRAMES[frameIndex];
  const maxVotes = useMemo(() => Math.max(...frame.items.map((item) => item.votes), 1), [frame]);

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <Badge className="border-fuchsia-500/25 bg-fuchsia-500/14">Today’s board</Badge>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
          Live voting now
        </div>
      </div>

      <Panel className="p-3 text-sm text-[var(--text-soft)]">
        {frame.event}
      </Panel>

      <div className="grid gap-4">
        {frame.items.map((item, index) => {
          const isLeader = index === 0;
          const isHot = frame.hot === item.name;
          const width = `${Math.max(34, Math.round((item.votes / maxVotes) * 100))}%`;
          const dots = Math.max(2, Math.min(4, item.votes - 1));

          return (
            <Panel
              key={item.name}
              className={`vote-card grid gap-3 p-4 ${isLeader ? 'border-[rgba(255,122,89,0.28)] bg-[rgba(255,122,89,0.12)]' : ''}`}
              style={{ animationDelay: `${index * 180}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--text)]">{item.name}</div>
                  <div className="mt-1 text-sm text-[var(--text-muted)]">{item.votes} votes</div>
                </div>
                <div className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-soft)]">
                  {isLeader ? 'Leading' : isHot ? 'Just voted' : 'Open vote'}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="vote-track flex-1">
                  <div className="vote-fill" style={{ width, animationDelay: `${index * 220}ms` }} />
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: dots }).map((_, dotIndex) => (
                    <span key={dotIndex} className="vote-dot" style={{ animationDelay: `${index * 160 + dotIndex * 120}ms` }} />
                  ))}
                </div>
              </div>

              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{item.meta}</div>
            </Panel>
          );
        })}
      </div>

      <Panel className="p-4">
        <div className="text-sm font-medium text-[var(--text)]">Made for the everyday lunch moment</div>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">The landing page sets the tone. The app then turns into a playful, efficient decision surface instead of another productivity dashboard.</p>
      </Panel>
    </div>
  );
}
