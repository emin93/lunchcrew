'use client';

import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { Badge, Button, Card, Input, Textarea } from '@/components/ui';
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl p-8 sm:p-10">
        <div className="grid gap-5">
          <Badge className="w-fit"><Sparkles className="h-3.5 w-3.5" /> LunchCrew Pro · coming soon</Badge>
          <div className="grid gap-2">
            <h3 className="text-3xl font-semibold tracking-tight text-white">Want a more opinionated control room for team lunch?</h3>
            <p className="text-sm leading-7 text-slate-400">Join the early-access waitlist for richer analytics, recurring rules, and admin controls that go beyond the current daily board.</p>
          </div>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work email" />
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What would make Pro worth paying for?" rows={4} />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Not now</Button>
            <Button disabled={!canSubmit || status === 'saving'} onClick={submit}>{status === 'saving' ? 'Joining…' : 'Join waitlist'}</Button>
          </div>
          {status === 'saved' ? <p className="text-sm text-emerald-300">You’re on the list.</p> : null}
          {status === 'error' ? <p className="text-sm text-rose-300">Couldn’t save right now. Please try again.</p> : null}
        </div>
      </Card>
    </div>
  );
}
