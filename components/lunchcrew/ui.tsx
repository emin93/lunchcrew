'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Badge, Panel } from '@/components/ui';
import { cn } from '@/lib/utils';

export function priceLabel(priceLevel?: number | null) {
  if (typeof priceLevel !== 'number' || priceLevel < 0) return '';
  return '$'.repeat(Math.max(1, Math.min(4, priceLevel)));
}

export function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text)] shadow-[var(--shadow-soft)] transition-all duration-300', className)}>{children}</span>;
}

export function Metric({ icon: Icon, label, value, compact = false, className }: { icon: any; label: string; value: string | number; compact?: boolean; className?: string }) {
  const numericValue = typeof value === 'number' ? value : Number.NaN;
  return (
    <Panel className={cn('panel-fade grid gap-1.5 p-3 sm:gap-2 sm:p-4', compact && 'min-w-[9rem]', className)}>
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Icon className="h-4 w-4" /> {label}</div>
      <div className={cn('font-semibold text-[var(--text)] break-words', compact ? 'text-lg' : 'text-2xl')}>
        {Number.isFinite(numericValue) ? <AnimatedNumber value={numericValue} /> : value}
      </div>
    </Panel>
  );
}

export function ActionLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--surface)]">
      <Icon className="h-3.5 w-3.5" /> {label}
    </a>
  );
}

export function AnimatedBadge({ visible, className, children }: { visible: boolean; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center overflow-hidden rounded-full transition-all duration-400 ease-out',
        visible ? 'max-w-[10rem] scale-100 opacity-100' : 'pointer-events-none max-w-0 scale-95 opacity-0',
      )}
      aria-hidden={!visible}
    >
      <Badge className={className}>{children}</Badge>
    </span>
  );
}

export function AnimatedNumber({ value }: { value: number }) {
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
    const duration = 560;

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
