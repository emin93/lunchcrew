'use client';

import { useMemo, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
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
    if (!supabase) { storage.set(MONETIZATION_WAITLIST_JOINED_KEY, '1'); storage.set(MONETIZATION_LAST_PROMPT_AT_KEY, String(Date.now())); setStatus('saved'); return; }
    const { error } = await supabase.from('monetization_waitlist').insert({ email: cleanEmail, note: note.trim() || null, workspace_id: workspaceId ?? null, source: 'return_modal' });
    if (error && error.code !== '23505') { setStatus('error'); return; }
    storage.set(MONETIZATION_WAITLIST_JOINED_KEY, '1');
    storage.set(MONETIZATION_LAST_PROMPT_AT_KEY, String(Date.now()));
    setStatus('saved');
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 50 }}>
      <div className="card" style={{ width: 'min(560px, 100%)', padding: 24, display: 'grid', gap: 14 }}>
        <span className="badge">LunchCrew Pro · Coming soon</span>
        <h3 style={{ margin: 0, fontSize: 28 }}>Want smarter lunch planning for your team?</h3>
        <p className="dim" style={{ margin: 0 }}>Join the early access waitlist for richer analytics, recurring rules, and admin controls.</p>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work email" />
        <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What would make Pro worth paying for? (optional)" rows={4} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="button button-secondary" onClick={onClose}>Not now</button>
          <button className="button button-primary" disabled={!canSubmit || status === 'saving'} onClick={submit}>Join waitlist</button>
        </div>
        {status === 'saved' ? <p style={{ margin: 0, color: 'var(--accent)' }}>You’re on the list.</p> : null}
        {status === 'error' ? <p style={{ margin: 0, color: 'var(--danger)' }}>Couldn’t save right now. Please try again.</p> : null}
      </div>
    </div>
  );
}
