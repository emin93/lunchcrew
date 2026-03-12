'use client';

import Link from 'next/link';
import { CalendarDays, Clock3, Compass, Crown, ExternalLink, History, Loader2, MapPinned, Plus, Rocket, Search, Share2, Trophy, Users2, UtensilsCrossed } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { MonetizationModal } from '@/components/MonetizationModal';
import { Onboarding } from '@/components/Onboarding';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge, Button, Card, Input, Panel } from '@/components/ui';
import { useLunchCrewApp } from '@/hooks/useLunchCrewApp';
import { initialsForName, workspacePath } from '@/lib/helpers';
import type { PlaceSuggestion } from '@/lib/types';
import { cn } from '@/lib/utils';

type AppView = 'today' | 'plan' | 'history' | 'crew';

const VIEWS: Array<{ id: AppView; label: string; short: string; icon: any }> = [
  { id: 'today', label: 'Today', short: 'Today', icon: UtensilsCrossed },
  { id: 'plan', label: 'Plan', short: 'Plan', icon: Plus },
  { id: 'history', label: 'History', short: 'History', icon: History },
  { id: 'crew', label: 'Crew', short: 'Crew', icon: Users2 },
];

function priceLabel(priceLevel?: number | null) {
  if (typeof priceLevel !== 'number' || priceLevel < 0) return '';
  return '$'.repeat(Math.max(1, Math.min(4, priceLevel)));
}

export function LunchCrewApp({ initialCode, initialView = 'today' }: { initialCode?: string; initialView?: AppView }) {
  const app = useLunchCrewApp(initialCode);
  const [joinCode, setJoinCode] = useState(initialCode || '');

  const activeHistory = app.show30DayHistory ? app.history30Days : app.history7Days;
  const totalVotes = useMemo(() => app.options.reduce((sum, opt) => sum + opt.votes, 0), [app.options]);
  const pollReady = !!app.poll;
  const emptyBallot = pollReady && app.pollDataReady && app.options.length === 0;
  const requestedView = initialView;
  const activeView: AppView = !app.workspace ? 'today' : requestedView === 'today' && emptyBallot ? 'plan' : requestedView;

  if (!app.onboardingReady) {
    return (
      <section className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <Card className="w-full p-10 text-center text-[var(--text-soft)]">Loading LunchCrew…</Card>
      </section>
    );
  }
  if (!app.onboardingDone) return <Onboarding onComplete={app.completeOnboarding} />;

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 pb-28 pt-4 sm:gap-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:px-5">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">LunchCrew</div>
            <div className="mt-1 truncate text-lg font-semibold text-[var(--text)] sm:text-xl">{app.workspace?.name || 'Pick today’s lunch'}</div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle className="rounded-full px-3 sm:px-4" />
            <Link href="/"><Button variant="secondary" className="rounded-full px-4"><Compass className="h-4 w-4" /> <span className="hidden sm:inline">Landing</span></Button></Link>
          </div>
        </header>

        {app.loadError ? (
          <Card className="border-rose-500/20 bg-rose-500/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-800 dark:text-rose-100">Something needs attention</div>
                <p className="mt-2 text-sm text-rose-900/90 dark:text-rose-100/90">{app.loadError}</p>
              </div>
              <Button variant="destructive" onClick={() => app.retryLoad()}>Retry</Button>
            </div>
          </Card>
        ) : null}

        {app.configError ? <Card className="p-5 text-sm text-amber-900 dark:text-amber-100">{app.configError}</Card> : null}

        {!app.workspace ? (
          <Card className="p-6">
            <div className="grid gap-4">
              <div>
                <div className="text-lg font-semibold text-[var(--text)]">Join or restore a crew</div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Use an invite code or full invite link. If this device already knows the crew, the restore flow still works automatically.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Invite code, e.g. LC-ABCD-EFGH" />
                <Link href={workspacePath(joinCode)} className="sm:w-auto"><Button className="w-full">Join crew</Button></Link>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <nav className="hidden lg:grid lg:grid-cols-4 lg:gap-3">
              {VIEWS.map(({ id, label, icon: Icon }) => {
                const href = workspacePath(app.workspace!.invite_code, id);
                const isActive = activeView === id;
                return (
                  <Link
                    key={id}
                    href={href}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                      isActive
                        ? 'border-transparent bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white shadow-[0_16px_36px_rgba(255,122,89,0.24)]'
                        : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text-soft)] hover:bg-[var(--surface)]',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {activeView === 'today' ? (
              <TodayView app={app} totalVotes={totalVotes} planHref={workspacePath(app.workspace.invite_code, 'plan')} />
            ) : null}
            {activeView === 'plan' ? (
              <PlanView app={app} todayHref={workspacePath(app.workspace.invite_code)} />
            ) : null}
            {activeView === 'history' ? (
              <HistoryView app={app} activeHistory={activeHistory} />
            ) : null}
            {activeView === 'crew' ? (
              <CrewView app={app} totalVotes={totalVotes} />
            ) : null}
          </>
        )}

        {app.workspace ? (
          <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-2 rounded-[28px] border border-[var(--border)] bg-[var(--nav-bar-bg)] p-2 shadow-[var(--shadow)] backdrop-blur-xl lg:hidden">
            {VIEWS.map(({ id, short, icon: Icon }) => {
              const href = workspacePath(app.workspace!.invite_code, id);
              const isActive = activeView === id;
              return (
                <Link
                  key={id}
                  href={href}
                  className={cn(
                    'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition',
                    isActive
                      ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-[var(--nav-active-text)] shadow-[0_12px_30px_rgba(255,122,89,0.22)]'
                      : 'text-[var(--nav-inactive-text)]',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{short}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}
      </main>
      <MonetizationModal visible={app.showMonetizationModal} workspaceId={app.workspace?.id} deviceId={app.deviceId} onClose={() => app.setShowMonetizationModal(false)} />
    </>
  );
}

function TodayView({ app, totalVotes, planHref }: { app: ReturnType<typeof useLunchCrewApp>; totalVotes: number; planHref: string }) {
  return (
    <section className="grid gap-4 sm:gap-5">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="text-rose-900 dark:text-amber-100">Today’s ballot</Badge>
              {app.workspace?.invite_code ? <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-soft)]">{app.workspace.invite_code}</span> : null}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">{app.poll?.title || "Today's Lunch"}</h1>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Vote first. Planning, history, and crew admin all have their own pages now.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => app.shareInvite()}><Share2 className="h-4 w-4" /> Share</Button>
            <Link href={planHref}><Button variant="gold"><Plus className="h-4 w-4" /> Plan</Button></Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={CalendarDays} label="Options" value={String(app.options.length)} compact />
        <Metric icon={Trophy} label="Votes" value={String(totalVotes)} compact />
        <Metric icon={Crown} label="Leader" value={app.topChoice || 'Waiting'} compact />
      </div>

      <Card className="p-4 sm:p-6">
        <div className="grid gap-4">
          {app.options.length === 0 ? (
            <Panel className="grid gap-3 p-8 text-center">
              <div className="text-lg font-semibold text-[var(--text)]">No places yet</div>
              <p className="text-sm text-[var(--text-muted)]">Start in Plan mode to shape the shortlist before the votes roll in.</p>
              <div>
                <Link href={planHref}><Button><Plus className="h-4 w-4" /> Open plan</Button></Link>
              </div>
            </Panel>
          ) : app.options.map((opt, index) => {
            const mapsUrl = opt.place?.google_maps_url;
            const menuUrl = opt.menu_url || opt.place?.detected_menu_url || opt.place?.website_url;
            const isActive = app.myOptionId === opt.id;
            return (
              <button
                key={opt.id}
                className={cn(
                  'group relative grid gap-4 rounded-[30px] border p-4 text-left transition duration-200 sm:p-5',
                  'border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]',
                  isActive && 'border-[rgba(255,122,89,0.32)] bg-[rgba(255,122,89,0.11)]',
                )}
                disabled={!!app.votingOptionId}
                onClick={() => app.vote(opt.id)}
              >
                <div className="absolute inset-y-4 left-0 w-1 rounded-full bg-transparent transition group-hover:bg-[rgba(255,122,89,0.26)]" />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {index === 0 ? <Badge className="border-amber-500/30 bg-amber-500/18 text-amber-950 dark:text-amber-100">Lead</Badge> : null}
                      {isActive ? <Badge>Your vote</Badge> : null}
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-[var(--text)] sm:text-2xl">{opt.name}</div>
                      {opt.place?.formatted_address ? <div className="mt-1 text-sm text-[var(--text-muted)]">{opt.place.formatted_address}</div> : null}
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-right shadow-[var(--shadow-soft)] sm:px-5">
                    <div className="text-2xl font-semibold text-[var(--text)] sm:text-3xl">{opt.votes}</div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)] sm:text-xs">votes</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]">
                  {typeof opt.place?.rating === 'number' ? <Pill>★ {opt.place.rating.toFixed(1)}</Pill> : null}
                  {priceLabel(opt.place?.price_level) ? <Pill>{priceLabel(opt.place?.price_level)}</Pill> : null}
                  {mapsUrl ? <ActionLink href={mapsUrl} label="Maps" icon={MapPinned} /> : null}
                  {menuUrl ? <ActionLink href={menuUrl} label="Menu" icon={ExternalLink} /> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {opt.voters.length ? opt.voters.map((v, i) => <Pill key={`${opt.id}-${i}`}>{initialsForName(v)} · {v}</Pill>) : <span className="text-sm text-[var(--text-muted)]">Still quiet. First vote changes the board.</span>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

function PlanView({ app, todayHref }: { app: ReturnType<typeof useLunchCrewApp>; todayHref: string }) {
  const [manualAdded, setManualAdded] = useState(false);

  async function handleSuggestionSelect(suggestion: PlaceSuggestion) {
    app.setSelectedSuggestion(suggestion);
    app.setNewOption(suggestion.name);
    const added = await app.addOption(suggestion);
    if (added) setManualAdded(false);
  }

  return (
    <section className="grid gap-4 sm:gap-5">
      <Card className="p-6 sm:p-8">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge className="text-sky-950 dark:text-sky-100">Plan mode</Badge>
              <div className="mt-2 text-2xl font-semibold text-[var(--text)]">Shape today’s shortlist</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Search nearby spots, drop in manual ideas, and tee up the ballot before everyone starts voting.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {app.selectedSuggestion ? <Button variant="secondary" onClick={() => app.setSelectedSuggestion(null)}>Clear selection</Button> : null}
              {app.options.length > 0 ? <Link href={todayHref}><Button variant="secondary">Back to today’s ballot</Button></Link> : null}
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input className="pl-10" placeholder="Search nearby or type manually" value={app.newOption} onChange={(e) => { setManualAdded(false); app.setSelectedSuggestion(null); app.setNewOption(e.target.value); }} />
            </div>
            <Button disabled={!app.newOption.trim() || app.addingOption} onClick={async () => { const added = await app.addOption(); setManualAdded(added); }} className="lg:px-6">
              {app.addingOption ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : <><Plus className="h-4 w-4" /> Add manual option</>}
            </Button>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Tap a search result to add it instantly. The button is only for manual entries you type yourself.</p>
          {!app.selectedSuggestion && app.newOption.trim().length >= 2 ? <Suggestions loading={app.loadingSuggestions} suggestions={app.suggestions} onSelect={handleSuggestionSelect} /> : null}
          {manualAdded ? <Pill className="w-fit border-emerald-500/25 bg-emerald-500/12 text-emerald-900 dark:text-emerald-100">Added to today’s ballot.</Pill> : null}
        </div>
      </Card>
    </section>
  );
}

function HistoryView({ app, activeHistory }: { app: ReturnType<typeof useLunchCrewApp>; activeHistory: ReturnType<typeof useLunchCrewApp>['history7Days'] }) {
  return (
    <section className="grid gap-4 sm:gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="p-6 sm:p-8">
        <div className="grid gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="border-sky-500/25 bg-sky-500/14 text-sky-950 dark:text-sky-100">History</Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">Patterns, not just receipts</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Recent winners and repeat favorites live here instead of competing with today’s main task.</p>
            </div>
            <div className="flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-soft)]">
              <button className={cn('rounded-full px-4 py-2 text-sm transition', !app.show30DayHistory ? 'bg-[var(--text)] text-[var(--bg)]' : 'text-[var(--text-muted)]')} onClick={() => app.setShow30DayHistory(false)}>7 days</button>
              <button className={cn('rounded-full px-4 py-2 text-sm transition', app.show30DayHistory ? 'bg-[var(--text)] text-[var(--bg)]' : 'text-[var(--text-muted)]')} onClick={() => app.setShow30DayHistory(true)}>30 days</button>
            </div>
          </div>
          <Panel className="grid gap-3 p-4">
            <div className="text-sm font-medium text-[var(--text-muted)]">Leaderboard</div>
            {app.leaderboard.slice(0, 5).length ? app.leaderboard.slice(0, 5).map((place, i) => <Pill key={place.name}>#{i + 1} · {place.name} · {place.wins} wins</Pill>) : <span className="text-sm text-[var(--text-muted)]">No winners yet.</span>}
          </Panel>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[120px_1fr_72px] gap-3 border-b border-[var(--border)] px-4 py-3 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
          <span>Date</span><span>Winner</span><span>Votes</span>
        </div>
        <div className="max-h-[36rem] overflow-auto">
          {activeHistory.map((row) => (
            <div key={row.poll_date} className="grid grid-cols-[120px_1fr_72px] gap-3 border-b border-[var(--border)] px-4 py-3 text-sm text-[var(--text-soft)] last:border-b-0">
              <span className="text-[var(--text-muted)]">{row.poll_date}</span>
              <span>{row.winner_name || 'No winner'}</span>
              <span>{row.winner_votes || 0}</span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function CrewView({ app, totalVotes }: { app: ReturnType<typeof useLunchCrewApp>; totalVotes: number }) {
  return (
    <section className="grid gap-4 sm:gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="p-6 sm:p-8">
        <div className="grid gap-5">
          <div>
            <Badge className="text-violet-950 dark:text-violet-100">Crew</Badge>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">Settings, identity, and invite access</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">Workspace maintenance lives here instead of crowding the daily ballot.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-1">
            <Metric icon={Share2} label="Invite code" value={app.workspace?.invite_code || '—'} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" className="justify-start" onClick={() => app.shareInvite()}><Share2 className="h-4 w-4" /> Share invite</Button>
            <Button variant="gold" className="justify-start" onClick={() => app.createNewCrew()}><Rocket className="h-4 w-4" /> Create new crew</Button>
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-[var(--text-muted)]">Rename crew</label>
            <Input defaultValue={app.workspace?.name || ''} onBlur={(e) => app.renameCrew(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-[var(--text-muted)]">Your display name</label>
            <Input defaultValue={app.member?.display_name || ''} onBlur={(e) => app.saveDisplayName(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <div className="grid gap-4">
          <Badge className="border-fuchsia-500/25 bg-fuchsia-500/14 text-fuchsia-900 dark:text-fuchsia-100">Snapshot</Badge>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Metric icon={Clock3} label="Votes cast" value={String(totalVotes)} compact />
            <Metric icon={Crown} label="Front runner" value={app.topChoice || 'Waiting'} compact />
          </div>
          <Panel className="p-4">
            <div className="text-sm font-medium text-[var(--text)]">Restore and invite flows stay intact</div>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">This redesign changes the information architecture, not the existing workspace logic, persistence, or realtime/polling behavior.</p>
          </Panel>
        </div>
      </Card>
    </section>
  );
}

function Suggestions({ loading, suggestions, onSelect }: { loading: boolean; suggestions: PlaceSuggestion[]; onSelect: (s: PlaceSuggestion) => void }) {
  return (
    <Panel className="overflow-hidden">
      {loading ? <div className="px-4 py-3 text-sm text-[var(--text-muted)]">Searching places…</div> : null}
      {!loading && suggestions.length === 0 ? <div className="px-4 py-3 text-sm text-[var(--text-muted)]">No suggested places yet. You can still add it manually.</div> : null}
      {suggestions.map((s) => (
        <button key={s.id} onClick={() => onSelect(s)} className="grid w-full gap-1 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-[var(--surface)] last:border-b-0">
          <span className="text-sm font-semibold text-[var(--text)]">{s.name}</span>
          {s.secondaryText ? <span className="text-sm text-[var(--text-muted)]">{s.secondaryText}</span> : null}
        </button>
      ))}
    </Panel>
  );
}

function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-soft)] shadow-[var(--shadow-soft)]', className)}>{children}</span>;
}

function Metric({ icon: Icon, label, value, compact = false }: { icon: any; label: string; value: string; compact?: boolean }) {
  return (
    <Panel className={cn('grid gap-2 p-4', compact && 'min-w-[9rem]')}>
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Icon className="h-4 w-4" /> {label}</div>
      <div className={cn('font-semibold text-[var(--text)] break-words', compact ? 'text-lg' : 'text-2xl')}>{value}</div>
    </Panel>
  );
}

function ActionLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:bg-[var(--surface)]">
      <Icon className="h-3.5 w-3.5" /> {label}
    </a>
  );
}
