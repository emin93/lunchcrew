'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Panel } from '@/components/ui';
import { cn } from '@/lib/utils';

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
  const [isSettled, setIsSettled] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIsSettled(false);
      window.setTimeout(() => {
        setFrameIndex((current) => (current + 1) % FRAMES.length);
        window.setTimeout(() => setIsSettled(true), 90);
      }, 260);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  const frame = FRAMES[frameIndex];
  const maxVotes = useMemo(() => Math.max(...frame.items.map((item) => item.votes), 1), [frame]);

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <Badge className="border-fuchsia-500/25 bg-fuchsia-500/14">Today’s board</Badge>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] transition-opacity duration-300">
          <span className="live-dot h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          Live voting now
        </div>
      </div>

      <Panel className={cn('panel-fade p-3 text-sm text-[var(--text-soft)]', !isSettled && 'translate-y-1 opacity-70')}>
        {frame.event}
      </Panel>

      <div className="grid gap-4">
        {frame.items.map((item, index) => {
          const isLeader = index === 0;
          const isHot = frame.hot === item.name;
          const width = Math.max(34, Math.round((item.votes / maxVotes) * 100));
          const dots = Math.max(2, Math.min(4, item.votes - 1));

          return (
            <Panel
              key={item.name}
              className={cn(
                'vote-card vote-card-polish grid gap-3 p-4 transition-all duration-500',
                isLeader && 'border-[rgba(255,122,89,0.28)] bg-[rgba(255,122,89,0.12)]',
                isHot && 'ring-1 ring-[rgba(255,122,89,0.16)]',
              )}
              style={{ animationDelay: `${index * 180}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-[var(--text)] transition-colors duration-300">{item.name}</div>
                  <div className="mt-1 text-sm text-[var(--text-muted)]"><AnimatedNumber value={item.votes} /> votes</div>
                </div>
                <div
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs text-[var(--text-soft)] transition-all duration-500',
                    isLeader ? 'border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-100' : 'border-[var(--border)]',
                    isHot && !isLeader && 'border-[rgba(255,122,89,0.22)] bg-[rgba(255,122,89,0.1)]',
                  )}
                >
                  {isLeader ? 'Leading' : isHot ? 'Just voted' : 'Open vote'}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="vote-track flex-1">
                  <div className="vote-fill" style={{ width: `${width}%`, animationDelay: `${index * 220}ms` }} />
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: dots }).map((_, dotIndex) => (
                    <span key={dotIndex} className="vote-dot" style={{ animationDelay: `${index * 160 + dotIndex * 120}ms` }} />
                  ))}
                </div>
              </div>

              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] transition-opacity duration-300">{item.meta}</div>
            </Panel>
          );
        })}
      </div>

      <Panel className="panel-fade p-4">
        <div className="text-sm font-medium text-[var(--text)]">Made for the everyday lunch moment</div>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">The landing page sets the tone. The app then turns into a playful, efficient decision surface instead of another productivity dashboard.</p>
      </Panel>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const delta = value - startValue;
    if (!delta) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const duration = 520;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + delta * eased));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        previousValueRef.current = value;
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <span className="tabular-nums">{displayValue}</span>;
}
