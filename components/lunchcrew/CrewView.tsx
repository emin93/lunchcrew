'use client';

import { Clock3, Crown, Loader2, LogOut, Mail, Rocket, Share2, Shield, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, Input, Panel, Textarea } from '@/components/ui';
import type { LunchCrewAppModel } from './types';
import { Metric, Pill } from './ui';

export function CrewView({ app, totalVotes }: { app: LunchCrewAppModel; totalVotes: number }) {
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  async function handleFeedbackSubmit() {
    if (feedbackStatus === 'saving') return;
    setFeedbackStatus('saving');
    setFeedbackError(null);
    const result = await app.submitFeedback({ email: feedbackEmail, message: feedbackMessage });
    if (!result.ok) {
      setFeedbackStatus('error');
      setFeedbackError(result.error || 'Could not send feedback.');
      return;
    }
    setFeedbackStatus('saved');
    setFeedbackMessage('');
    setFeedbackEmail('');
  }

  async function handleMagicLink(mode: 'claim' | 'signin' = 'signin') {
    setAuthNotice(null);
    app.setAuthError(null);
    const result = await app.requestMagicLink(loginEmail, mode);
    if (!result.ok) {
      app.setAuthError(result.error || 'Could not send magic link.');
      return;
    }
    setAuthNotice(mode === 'claim'
      ? 'Magic link sent. Open the email on this device to claim the crew.'
      : 'Magic link sent. Open the email on this device to sign back in as the crew owner.');
  }

  async function handleClaimCrew() {
    setAuthNotice(null);
    app.setAuthError(null);
    const result = await app.claimWorkspace();
    if (!result.ok) {
      app.setAuthError(result.error || 'Could not claim this crew.');
      return;
    }
    setAuthNotice('This crew is now claimed by your account.');
  }

  return (
    <section className="grid gap-4 sm:gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="panel-fade p-6 sm:p-8">
        <div className="grid gap-5">
          <div>
            <Badge>Crew</Badge>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">Settings, identity, and invite access</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">Workspace maintenance lives here instead of crowding the daily ballot.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-1">
            <Metric icon={Share2} label="Invite code" value={app.workspace?.invite_code || '—'} />
          </div>
          {app.workspace?.pro_enabled ? (
            <div className="grid gap-3">
              <Button variant="secondary" className="justify-start sm:w-fit" onClick={() => app.shareInvite()}><Share2 className="h-4 w-4" /> Share invite</Button>
              <Panel className="grid gap-2 border-emerald-500/24 bg-emerald-500/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="badge-emerald"><Sparkles className="h-3.5 w-3.5" /> Founding access enabled</Badge>
                  <Pill className="pill-amber">Unlocked by crew admin</Pill>
                </div>
                <p className="text-sm leading-6 text-[var(--text-soft)]">This crew has already been upgraded during evaluation, so founder features now belong to the whole crew.</p>
              </Panel>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
              <Button variant="secondary" className="justify-start" onClick={() => app.shareInvite()}><Share2 className="h-4 w-4" /> Share invite</Button>
              <Button variant="gold" className="justify-start" onClick={() => app.setShowMonetizationModal(true)}><Sparkles className="h-4 w-4" /> Founding access</Button>
            </div>
          )}
          {!app.workspace?.pro_enabled ? (
            <Panel className="grid gap-3 p-4">
              <div className="text-sm font-medium text-[var(--text)]">Evaluation pricing</div>
              <p className="text-sm leading-6 text-[var(--text-muted)]">Upgrade this crew to founding access during evaluation and lock in early pricing for this specific crew.</p>
              <div>
                <Button variant="default" className="sm:w-fit" onClick={() => app.setShowMonetizationModal(true)}><Sparkles className="h-4 w-4" /> See founding access</Button>
              </div>
            </Panel>
          ) : null}
          <Panel className="grid gap-4 p-4 sm:p-5">
            <div className="grid gap-1">
              <div className="text-sm font-semibold text-[var(--text)]">Crew ownership</div>
              <p className="text-sm leading-6 text-[var(--text-muted)]">Admins will log in with a magic link. Regular voters can keep using LunchCrew without an account.</p>
            </div>
            {app.authUser ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill className="pill-sky">Signed in as {app.authUser.email || 'account owner'}</Pill>
                  {app.workspaceRole ? <Pill className="pill-amber">{app.workspaceRole === 'owner' ? 'Crew owner' : 'Crew admin'}</Pill> : null}
                  {!app.workspaceRole && app.workspaceHasOwner ? <Pill>This crew has already been claimed</Pill> : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  {!app.workspaceRole && !app.workspaceHasOwner ? (
                    <Button disabled={app.authBusy} onClick={handleClaimCrew}><Shield className="h-4 w-4" /> Claim this crew</Button>
                  ) : null}
                  <Button variant="secondary" disabled={app.authBusy} onClick={() => app.signOutAuthUser()}><LogOut className="h-4 w-4" /> Sign out</Button>
                </div>
                {!app.workspaceRole && app.workspaceHasOwner ? <p className="text-sm text-[var(--text-muted)]">This crew is already managed by its owner, so claiming is no longer available from other devices.</p> : null}
              </>
            ) : app.workspaceHasOwner ? (
              <>
                <Panel className="grid gap-2 p-4">
                  <div className="text-sm font-medium text-[var(--text)]">This crew has already been claimed</div>
                  <p className="text-sm leading-6 text-[var(--text-muted)]">Admin and founding-access controls belong to the crew owner. Sign back in with the owner email to manage this crew.</p>
                </Panel>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setAuthNotice(null); app.setAuthError(null); }} placeholder="owner@company.com" />
                  <Button disabled={!loginEmail.trim() || app.authBusy} onClick={() => handleMagicLink('signin')}><Mail className="h-4 w-4" /> {app.authBusy ? 'Sending…' : 'Email sign-in link'}</Button>
                </div>
                <p className="text-sm text-[var(--text-muted)]">Use the same owner email that claimed this crew. Other people can still join and vote normally without signing in.</p>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setAuthNotice(null); app.setAuthError(null); }} placeholder="you@company.com" />
                  <Button disabled={!loginEmail.trim() || app.authBusy} onClick={() => handleMagicLink('claim')}><Mail className="h-4 w-4" /> {app.authBusy ? 'Sending…' : 'Email magic link'}</Button>
                </div>
                <p className="text-sm text-[var(--text-muted)]">Once you’re signed in, you can claim this crew and later manage payments and admin controls.</p>
              </>
            )}
            {authNotice ? <Pill className="pill-emerald w-fit">{authNotice}</Pill> : null}
            {app.authError ? <p className="text-sm text-rose-700 dark:text-rose-300">{app.authError}</p> : null}
          </Panel>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-sm text-[var(--text-muted)]">Need a brand-new invite code and a clean ballot?</p>
            <Button variant="ghost" className="min-h-9 rounded-full px-3 text-sm" onClick={() => app.createNewCrew()}><Rocket className="h-4 w-4" /> Create fresh crew</Button>
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-[var(--text-muted)]">Rename crew</label>
            <Input key={`workspace-name-${app.workspace?.id || 'none'}`} defaultValue={app.workspace?.name || ''} onBlur={(e) => app.renameCrew(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-[var(--text-muted)]">Your display name</label>
            <Input key={`member-name-${app.workspace?.id || 'none'}-${app.member?.device_id || 'anon'}`} defaultValue={app.member?.display_name || ''} onBlur={(e) => app.saveDisplayName(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="panel-fade p-6 sm:p-8">
        <div className="grid gap-4">
          <Badge className="badge-fuchsia">Snapshot</Badge>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Metric icon={Clock3} label="Votes cast" value={totalVotes} compact />
            <Metric icon={Crown} label="Front runner" value={app.topChoice || 'Waiting'} compact />
          </div>
          <Panel className="panel-fade p-4">
            <div className="text-sm font-medium text-[var(--text)]">Restore and invite flows stay intact</div>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">This redesign changes the information architecture, not the existing workspace logic, persistence, or realtime/polling behavior.</p>
          </Panel>
          <Panel className="grid gap-4 p-4 sm:p-5">
            <div className="grid gap-1">
              <div className="text-sm font-semibold text-[var(--text)]">Send feedback</div>
              <p className="text-sm leading-6 text-[var(--text-muted)]">Seen something odd or have an idea? Send it straight from here.</p>
            </div>
            <Input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" value={feedbackEmail} onChange={(e) => { setFeedbackEmail(e.target.value); setFeedbackStatus('idle'); setFeedbackError(null); }} placeholder="Email (optional)" />
            <Textarea value={feedbackMessage} onChange={(e) => { setFeedbackMessage(e.target.value); setFeedbackStatus('idle'); setFeedbackError(null); }} placeholder="What should change, what felt confusing, or what would make this better?" rows={5} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-[var(--text-muted)]">We’ll attach the current crew context automatically.</div>
              <Button disabled={!feedbackMessage.trim() || feedbackStatus === 'saving'} onClick={handleFeedbackSubmit}>
                {feedbackStatus === 'saving' ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : 'Send feedback'}
              </Button>
            </div>
            {feedbackStatus === 'saved' ? <Pill className="pill-emerald w-fit">Feedback sent. Thank you.</Pill> : null}
            {feedbackStatus === 'error' && feedbackError ? <p className="text-sm text-rose-700 dark:text-rose-300">{feedbackError}</p> : null}
          </Panel>
        </div>
      </Card>
    </section>
  );
}
