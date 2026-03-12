'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Button({ className, variant = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'secondary' | 'ghost' | 'gold' | 'destructive' }) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        variant === 'default' && 'border border-transparent bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white shadow-[0_16px_40px_rgba(255,122,89,0.28)] hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(255,122,89,0.34)]',
        variant === 'secondary' && 'border border-[var(--border)] bg-[color:var(--surface-strong)] text-[var(--text)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:bg-[var(--surface)]',
        variant === 'ghost' && 'text-[var(--text-soft)] hover:bg-[var(--surface)] hover:text-[var(--text)]',
        variant === 'gold' && 'border border-amber-400/30 bg-[linear-gradient(135deg,rgba(255,209,102,0.28),rgba(255,153,102,0.18))] text-[var(--text)] hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,rgba(255,209,102,0.38),rgba(255,153,102,0.24))]',
        variant === 'destructive' && 'border border-rose-500/20 bg-rose-500/12 text-rose-700 hover:bg-rose-500/18 dark:text-rose-100',
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-[32px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow)] backdrop-blur-xl', className)} {...props} />;
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-[26px] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-soft)] backdrop-blur-sm', className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] shadow-[var(--shadow-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]', className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] shadow-[var(--shadow-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]', className)} {...props} />;
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center gap-2 rounded-full border border-[rgba(255,122,89,0.22)] bg-[rgba(255,122,89,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)] dark:text-[var(--accent-2)]', className)} {...props} />;
}
