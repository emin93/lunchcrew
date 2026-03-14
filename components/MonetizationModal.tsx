'use client';

import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { Badge, Button, Card, Input, Panel, Textarea } from '@/components/ui';
import { MONETIZATION_LAST_PROMPT_AT_KEY, MONETIZATION_WAITLIST_JOINED_KEY, storage } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';

export function MonetizationModal({ visible, workspaceId, deviceId, onClose }: { visible: boolean; workspaceId?: string; deviceId?: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const canSubmit = useMemo(() => /^\S+@\S+\.\S+$/.test(email.trim()), [email]);
  if (!visible) return null;

  async function submit() {
    if (!canSubmit || status === 'saving') return;
    const cleanEmail = email.trim().toLowerCase();
    setStatus('saving');
    await trackEvent('upgrade_cta_clicked', { placement: 'return_modal', workspace_id: workspaceId ?? null }, deviceId);
    if (!supabase) {
      storage.set(MONETIZATION_WAITLIST_JOINED_KEY, '1');
      storage.set(MONETIZATION_LAST_PROMPT_AT_KEY, String(Date.now()));
      setStatus('saved');
      return;
    }
    const { error } = await supabase.from('monetization_waitlist').insert({ email: cleanEmail, note: note.trim() || null, workspace_id: workspaceId ?? null, source: 'return_modal' });
    if (error && error.code !== '23505') {
      setStatus('error');
      return;
    }
    storage.set(MONETIZATION_WAITLIST_JOINED_KEY, '1');
    storage.set(MONETIZATION_LAST_PROMPT_AT_KEY, String(Date.now()));
    setStatus('saved');
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-md">
      <div className="grid min-h-full place-items-center py-4 sm:py-6">
        <Card className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto p-6 sm:max-h-[calc(100vh-3rem)] sm:p-8 lg:p-10">
          <div className="grid gap-5">
          <Badge className="w-fit"><Sparkles className="h-3.5 w-3.5" /> Founding Crew Access</Badge>
          <div className="grid gap-2">
            <h3 className="text-3xl font-semibold tracking-tight text-[var(--text)]">Upgrade this crew during evaluation</h3>
            <p className="text-sm leading-7 text-[var(--text-soft)]">The plan is a one-time upgrade per crew. Early buyers help shape LunchCrew, unlock upcoming Pro features for this crew, and get grandfathered as pricing evolves.</p>
          </div>
          <Panel className="grid gap-2 p-4 text-sm leading-6 text-[var(--text-soft)]">
            <div className="font-semibold text-[var(--text)]">What this is shaping toward</div>
            <div>• one-time payment tied to one crew</div>
            <div>• admin controls, decision rules, recurring defaults, and richer history</div>
            <div>• evaluation-phase access with future grandfathering for founding crews</div>
          </Panel>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for founding access updates" />
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything you’d want included in Founding Crew Access?" rows={4} />
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs leading-6 text-[var(--text-muted)]">
            Founding Crew Access is tied to a single crew during the evaluation phase. Long-term access depends on LunchCrew continuing to operate, so it cannot be guaranteed if the product is discontinued.
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Not now</Button>
            <Button disabled={!canSubmit || status === 'saving'} onClick={submit}>{status === 'saving' ? 'Saving…' : 'Get founding access updates'}</Button>
          </div>
          {status === 'saved' ? <p className="text-sm text-emerald-600 dark:text-emerald-300">Saved — I’ll treat this crew as interested in founding access.</p> : null}
          {status === 'error' ? <p className="text-sm text-rose-600 dark:text-rose-300">Couldn’t save right now. Please try again.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
