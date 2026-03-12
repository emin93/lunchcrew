'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Button({ className, variant = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'secondary' | 'ghost' | 'gold' | 'destructive' }) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60',
        variant === 'default' && 'bg-emerald-300 text-slate-950 shadow-[0_12px_40px_rgba(110,231,183,0.22)] hover:bg-emerald-200',
        variant === 'secondary' && 'border border-white/12 bg-white/6 text-white hover:bg-white/10',
        variant === 'ghost' && 'text-slate-300 hover:bg-white/6 hover:text-white',
        variant === 'gold' && 'border border-amber-300/20 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15',
        variant === 'destructive' && 'border border-rose-300/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15',
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-[28px] border border-white/10 bg-white/8 shadow-[0_24px_80px_rgba(2,8,23,0.45)] backdrop-blur-xl', className)} {...props} />;
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-3xl border border-white/8 bg-slate-950/40 backdrop-blur-sm', className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white placeholder:text-slate-500 focus:border-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-300/20', className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-300/20', className)} {...props} />;
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100', className)} {...props} />;
}
