'use client';

import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import { CalendarDays, Clock3, Compass, Crown, ExternalLink, History, Loader2, MapPinned, Plus, Rocket, Search, Share2, Trophy, Users2, UtensilsCrossed } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MonetizationModal } from '@/components/MonetizationModal';
import { Onboarding } from '@/components/Onboarding';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge, Button, Card, Input, Panel, Textarea } from '@/components/ui';
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

export function LunchCrewApp({ initialCode }: { initialCode?: string }) {
  const app = useLunchCrewApp(initialCode);
  const segments = useSelectedLayoutSegments();
  const [joinCode, setJoinCode] = useState(initialCode || '');

  const activeHistory = app.show30DayHistory ? app.history30Days : app.history7Days;
  const totalVotes = useMemo(() => app.options.reduce((sum, opt) => sum + opt.votes, 0), [app.options]);
  const pollReady = !!app.poll;
  const emptyBallot = pollReady && app.pollDataReady && app.options.length === 0;
  const requestedView = (segments[0] as AppView | undefined) || 'today';
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
        <header className="panel-fade flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:px-5">
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
          <Card className="panel-fade border-rose-500/20 bg-rose-500/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-800 dark:text-rose-100">Something needs attention</div>
                <p className="mt-2 text-sm text-rose-900/90 dark:text-rose-100/90">{app.loadError}</p>
              </div>
              <Button variant="destructive" onClick={() => app.retryLoad()}>Retry</Button>
            </div>
          </Card>
        ) : null}

        {app.configError ? <Card className="panel-fade p-5 text-sm text-amber-900 dark:text-amber-100">{app.configError}</Card> : null}

        {!app.workspace ? (
          <Card className="panel-fade p-6">
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
                      'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5',
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

            <div key={activeView} className="view-stage">
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
            </div>
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
                    'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition-all duration-300 ease-out active:scale-[0.98]',
                    isActive
                      ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-[var(--nav-active-text)] shadow-[0_12px_30px_rgba(255,122,89,0.22)]'
                      : 'text-[var(--nav-inactive-text)] hover:bg-[var(--surface)]/70',
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
      <MonetizationModal visible={app.showMonetizationModal} workspaceId={app.workspace?.id} deviceId={app.deviceId} onClose={() => app.dismissMonetizationModal()} />
    </>
  );
}

function TodayView({ app, totalVotes, planHref }: { app: ReturnType<typeof useLunchCrewApp>; totalVotes: number; planHref: string }) {
  const sortedOptions = [...app.options].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
  const maxVotes = Math.max(...sortedOptions.map((opt) => opt.votes), 1);

  return (
    <section className="grid gap-3 sm:gap-5">
      <Card className="panel-fade p-3 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="grid gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Today’s ballot</Badge>
              {app.workspace?.invite_code ? <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-soft)] transition-colors duration-300">{app.workspace.invite_code}</span> : null}
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">{app.poll?.title || "Today's Lunch"}</h1>
              <p className="mt-1 hidden text-sm leading-6 text-[var(--text-muted)] sm:block">Vote first. Planning, history, and crew admin all have their own pages now.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="px-3 sm:px-4" onClick={() => app.shareInvite()}><Share2 className="h-4 w-4" /> Share</Button>
            <Link href={planHref}><Button variant="gold" className="px-3 sm:px-4"><Plus className="h-4 w-4" /> Plan</Button></Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <Metric icon={CalendarDays} label="Options" value={app.options.length} compact className="hidden sm:grid" />
        <Metric icon={Trophy} label="Votes" value={totalVotes} compact />
        <Metric icon={Crown} label="Leader" value={app.topChoice || 'Waiting'} compact />
      </div>

      <Card className="panel-fade p-4 sm:p-6">
        <div className="grid gap-4">
          {app.options.length === 0 ? (
            <Panel className="grid gap-3 p-8 text-center">
              <div className="text-lg font-semibold text-[var(--text)]">No places yet</div>
              <p className="text-sm text-[var(--text-muted)]">Start in Plan mode to shape the shortlist before the votes roll in.</p>
              <div>
                <Link href={planHref}><Button><Plus className="h-4 w-4" /> Open plan</Button></Link>
              </div>
            </Panel>
          ) : sortedOptions.map((opt, index) => {
            const mapsUrl = opt.place?.google_maps_url;
            const menuUrl = opt.menu_url || opt.place?.detected_menu_url || opt.place?.website_url;
            const isActive = app.myOptionId === opt.id;
            const isLeader = index === 0 && opt.votes > 0;
            const isVoting = app.votingOptionId === opt.id;
            const width = Math.max(34, Math.round((opt.votes / maxVotes) * 100));
            const activityDots = Math.max(2, Math.min(4, opt.voters.length || opt.votes || 1));
            return (
              <button
                key={opt.id}
                className={cn(
                  'group relative grid gap-4 overflow-hidden rounded-[30px] border p-4 text-left transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] sm:p-5',
                  'border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] hover:-translate-y-1 hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)] hover:shadow-[0_22px_48px_rgba(0,0,0,0.08)] active:scale-[0.995]',
                  (isLeader || isActive) && 'border-[rgba(255,122,89,0.32)] bg-[rgba(255,122,89,0.11)]',
                  isVoting && 'pointer-events-none scale-[0.995] opacity-85',
                )}
                disabled={!!app.votingOptionId}
                onClick={() => app.vote(opt.id)}
              >
                <div className={cn('pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500', (isLeader || isActive) && 'opacity-100')}>
                  <div className="absolute inset-x-10 top-0 h-16 rounded-full bg-[rgba(255,209,102,0.18)] blur-2xl" />
                  <div className="absolute -right-6 bottom-0 h-20 w-20 rounded-full bg-[rgba(255,122,89,0.14)] blur-2xl" />
                </div>

                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <AnimatedBadge visible={isLeader} className="border-amber-500/30 bg-amber-500/18">Leading</AnimatedBadge>
                      <AnimatedBadge visible={isActive}>Your vote</AnimatedBadge>
                      <AnimatedBadge visible={isVoting} className="border-sky-500/25 bg-sky-500/14 text-sky-900 dark:text-sky-100">Casting…</AnimatedBadge>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-[var(--text)] transition-colors duration-300 sm:text-2xl">{opt.name}</div>
                      {opt.place?.formatted_address ? <div className="mt-1 text-sm text-[var(--text-muted)] transition-opacity duration-300">{opt.place.formatted_address}</div> : null}
                    </div>
                  </div>
                  <div className={cn('rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-right shadow-[var(--shadow-soft)] transition-all duration-500 sm:px-5', isLeader && 'border-amber-500/20 bg-amber-500/10')}>
                    <div className="text-2xl font-semibold text-[var(--text)] sm:text-3xl"><AnimatedNumber value={opt.votes} /></div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)] sm:text-xs">votes</div>
                  </div>
                </div>

                <div className="relative flex items-center justify-between gap-3">
                  <div className="vote-track flex-1">
                    <div className="vote-fill" style={{ width: `${width}%`, animationDelay: `${index * 160}ms` }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: activityDots }).map((_, dotIndex) => (
                      <span key={dotIndex} className="vote-dot" style={{ animationDelay: `${index * 140 + dotIndex * 120}ms` }} />
                    ))}
                  </div>
                </div>

                <div className="relative flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]">
                  {typeof opt.place?.rating === 'number' ? <Pill>★ {opt.place.rating.toFixed(1)}</Pill> : null}
                  {priceLabel(opt.place?.price_level) ? <Pill>{priceLabel(opt.place?.price_level)}</Pill> : null}
                  {mapsUrl ? <ActionLink href={mapsUrl} label="Maps" icon={MapPinned} /> : null}
                  {menuUrl ? <ActionLink href={menuUrl} label="Menu" icon={ExternalLink} /> : null}
                </div>

                <div className="relative flex flex-wrap gap-2">
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
  const [recentlyAddedName, setRecentlyAddedName] = useState<string | null>(null);
  const [showAreaDialog, setShowAreaDialog] = useState(false);
  const sortedShortlist = [...app.options].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
  const shortlistCountLabel = `${app.options.length} ${app.options.length === 1 ? 'place' : 'places'}`;
  const areaButtonLabel = app.activeSearchAreaLabel ? (app.usingManualSearchArea ? `Near ${app.activeSearchAreaLabel}` : app.activeSearchAreaLabel) : 'Set area';

  async function handleSuggestionSelect(suggestion: PlaceSuggestion) {
    app.setSelectedSuggestion(suggestion);
    app.setNewOption(suggestion.name);
    const added = await app.addOption(suggestion);
    if (added) {
      setManualAdded(false);
      setRecentlyAddedName(suggestion.name);
    }
  }

  async function handleManualAdd() {
    const name = app.newOption.trim();
    const added = await app.addOption();
    setManualAdded(added);
    if (added) setRecentlyAddedName(name);
  }

  async function handleApplyArea() {
    const applied = await app.applySearchArea();
    if (applied) {
      app.clearSearchAreaError();
      setShowAreaDialog(false);
    }
  }

  function handleOpenAreaDialog() {
    app.clearSearchAreaError();
    setShowAreaDialog(true);
  }

  function handleCloseAreaDialog() {
    app.clearSearchAreaError();
    setShowAreaDialog(false);
  }

  function handleClearAreaOverride() {
    app.clearSearchArea();
    app.clearSearchAreaError();
    setShowAreaDialog(false);
  }

  return (
    <>
      <section className="grid gap-4 sm:gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <Card className="panel-fade p-6 sm:p-8">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge>Plan mode</Badge>
                <div className="mt-2 text-2xl font-semibold text-[var(--text)]">Build today’s shortlist</div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Add places here, keep an eye on the shortlist below, then jump back to voting when the list feels right.</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" onClick={handleOpenAreaDialog}><MapPinned className="h-4 w-4" /> {areaButtonLabel}</Button>
                {app.selectedSuggestion ? <Button variant="secondary" onClick={() => app.setSelectedSuggestion(null)}>Clear selection</Button> : null}
                {app.options.length > 0 ? <Link href={todayHref}><Button variant="secondary">Go to today’s ballot</Button></Link> : null}
              </div>
            </div>

            <Panel className="grid gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill className={cn(app.usingManualSearchArea ? 'border-sky-500/25 bg-sky-500/12 text-sky-900 dark:text-sky-100' : 'border-[var(--border)]')}>
                  {app.activeSearchAreaLabel ? (app.usingManualSearchArea ? `Manual area: ${app.activeSearchAreaLabel}` : `Detected area: ${app.activeSearchAreaLabel}`) : 'No area set'}
                </Pill>
              </div>

              <div className="grid gap-1">
                <div className="text-sm font-semibold text-[var(--text)]">Search & add</div>
                <p className="text-sm leading-6 text-[var(--text-muted)]">Tap a suggested place to add it instantly, or type your own and use the button.</p>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    className="pl-10"
                    placeholder="Search nearby or type a place"
                    value={app.newOption}
                    onChange={(e) => {
                      setManualAdded(false);
                      setRecentlyAddedName(null);
                      app.setSelectedSuggestion(null);
                      app.setNewOption(e.target.value);
                    }}
                  />
                </div>
                <Button disabled={!app.newOption.trim() || app.addingOption} onClick={handleManualAdd} className="lg:px-6">
                  {app.addingOption ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : <><Plus className="h-4 w-4" /> Add typed place</>}
                </Button>
              </div>

              {!app.selectedSuggestion && app.newOption.trim().length >= 2 ? <Suggestions loading={app.loadingSuggestions} suggestions={app.suggestions} onSelect={handleSuggestionSelect} /> : null}

              {recentlyAddedName ? (
                <Panel className="border-emerald-500/28 bg-emerald-500/14 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--text)]">Added to today’s shortlist</div>
                      <p className="mt-1 text-sm text-[var(--text-soft)]">{recentlyAddedName} is now in the shortlist and ready for votes.</p>
                    </div>
                    <Pill className="border-emerald-500/30 bg-emerald-500/18 text-emerald-950 dark:bg-emerald-500/12 dark:text-emerald-100">{shortlistCountLabel}</Pill>
                  </div>
                </Panel>
              ) : null}

              {manualAdded && !recentlyAddedName ? <Pill className="w-fit border-emerald-500/30 bg-emerald-500/18 text-emerald-950 dark:text-emerald-100">Added to today’s shortlist.</Pill> : null}
            </Panel>
          </div>
        </Card>

        <Card className="panel-fade p-6 sm:p-8">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className="border-sky-500/25 bg-sky-500/14">Today’s shortlist</Badge>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">What’s already in</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">This stays visible while you plan, so duplicates make sense and the flow feels grounded.</p>
              </div>
              <Pill>{shortlistCountLabel}</Pill>
            </div>

            {app.options.length === 0 ? (
              <Panel className="grid gap-3 p-5">
                <div className="text-base font-semibold text-[var(--text)]">Start the list with the first place</div>
                <p className="text-sm leading-6 text-[var(--text-muted)]">Search nearby or type a custom idea. As soon as you add one, it will stay visible here.</p>
              </Panel>
            ) : (
              <div className="grid gap-2.5">
                {sortedShortlist.map((opt, index) => {
                  const isRecentlyAdded = !!recentlyAddedName && opt.name.trim().toLowerCase() === recentlyAddedName.trim().toLowerCase();
                  return (
                    <Panel
                      key={opt.id}
                      className={cn(
                        'grid gap-2 p-3.5 transition-all duration-300',
                        isRecentlyAdded && 'border-emerald-500/25 bg-emerald-500/10 ring-1 ring-emerald-500/20',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {index === 0 ? <Pill className="border-amber-500/25 bg-amber-500/12 text-amber-900 dark:text-amber-100">Top voted</Pill> : null}
                            {isRecentlyAdded ? <Pill className="border-emerald-500/25 bg-emerald-500/12 text-emerald-900 dark:text-emerald-100">Just added</Pill> : null}
                          </div>
                          <div className="mt-1.5 text-sm font-semibold text-[var(--text)] sm:text-base">{opt.name}</div>
                          {opt.place?.formatted_address ? <div className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)]">{opt.place.formatted_address}</div> : null}
                        </div>
                        <div className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-sm font-semibold text-[var(--text)]">
                          <AnimatedNumber value={opt.votes} />
                        </div>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </section>

      {showAreaDialog ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-md">
          <Card className="w-full max-w-lg p-6 sm:p-8">
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Badge className="w-fit border-sky-500/25 bg-sky-500/14">Area settings</Badge>
                <h3 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Choose where nearby search should focus</h3>
                <p className="text-sm leading-7 text-[var(--text-soft)]">By default LunchCrew uses your detected area. If you’d rather search near somewhere else, set a manual area here.</p>
              </div>

              <Panel className="grid gap-3 p-4">
                <div className="text-sm font-medium text-[var(--text)]">Current search area</div>
                <Pill className={cn(app.usingManualSearchArea ? 'border-sky-500/25 bg-sky-500/12 text-sky-900 dark:text-sky-100' : 'border-[var(--border)]')}>
                  {app.activeSearchAreaLabel ? (app.usingManualSearchArea ? `Manual area: ${app.activeSearchAreaLabel}` : `Detected area: ${app.activeSearchAreaLabel}`) : 'No detected area yet'}
                </Pill>
                <p className="text-sm text-[var(--text-muted)]">Try a city, neighbourhood, or fuller address if the detected area isn’t the one you want.</p>
              </Panel>

              <div className="grid gap-3">
                <Input
                  placeholder="Tulum Centro, Aldea Zama, or a full address"
                  value={app.searchAreaInput}
                  onChange={(e) => {
                    app.clearSearchAreaError();
                    app.setSearchAreaInput(e.target.value);
                  }}
                />
                {app.searchAreaError ? <p className="text-sm text-rose-700 dark:text-rose-300">{app.searchAreaError}</p> : null}
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                {app.usingManualSearchArea ? <Button variant="ghost" onClick={handleClearAreaOverride}>Use detected area</Button> : null}
                <Button variant="secondary" onClick={handleCloseAreaDialog}>Close</Button>
                <Button disabled={!app.searchAreaInput.trim() || app.searchAreaLoading} onClick={handleApplyArea}>
                  {app.searchAreaLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Use this area'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}

function HistoryView({ app, activeHistory }: { app: ReturnType<typeof useLunchCrewApp>; activeHistory: ReturnType<typeof useLunchCrewApp>['history7Days'] }) {
  return (
    <section className="grid gap-4 sm:gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="panel-fade p-6 sm:p-8">
        <div className="grid gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="border-sky-500/25 bg-sky-500/14">History</Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">Patterns, not just receipts</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Recent winners and repeat favorites live here instead of competing with today’s main task.</p>
            </div>
            <div className="flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-soft)]">
              <button className={cn('rounded-full px-4 py-2 text-sm transition-all duration-300', !app.show30DayHistory ? 'bg-[var(--text)] text-[var(--bg)] shadow-[var(--shadow-soft)]' : 'text-[var(--text-muted)]')} onClick={() => app.setShow30DayHistory(false)}>7 days</button>
              <button className={cn('rounded-full px-4 py-2 text-sm transition-all duration-300', app.show30DayHistory ? 'bg-[var(--text)] text-[var(--bg)] shadow-[var(--shadow-soft)]' : 'text-[var(--text-muted)]')} onClick={() => app.setShow30DayHistory(true)}>30 days</button>
            </div>
          </div>
          <Panel className="panel-fade grid gap-3 p-4">
            <div className="text-sm font-medium text-[var(--text-muted)]">Leaderboard</div>
            {app.leaderboard.slice(0, 5).length ? app.leaderboard.slice(0, 5).map((place, i) => <Pill key={place.name}>#{i + 1} · {place.name} · {place.wins} wins</Pill>) : <span className="text-sm text-[var(--text-muted)]">No winners yet.</span>}
          </Panel>
        </div>
      </Card>

      <Card className="panel-fade overflow-hidden">
        <div className="grid grid-cols-[120px_1fr_72px] gap-3 border-b border-[var(--border)] px-4 py-3 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
          <span>Date</span><span>Winner</span><span>Votes</span>
        </div>
        <div className="max-h-[36rem] overflow-auto">
          {activeHistory.map((row, index) => (
            <div key={row.poll_date} className="grid grid-cols-[120px_1fr_72px] gap-3 border-b border-[var(--border)] px-4 py-3 text-sm text-[var(--text-soft)] transition-colors duration-300 last:border-b-0 hover:bg-[var(--surface)]/65" style={{ animationDelay: `${index * 40}ms` }}>
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
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

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
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" className="justify-start" onClick={() => app.shareInvite()}><Share2 className="h-4 w-4" /> Share invite</Button>
            <Button variant="gold" className="justify-start" onClick={() => app.createNewCrew()}><Rocket className="h-4 w-4" /> Create fresh crew</Button>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Fresh crew makes a new invite code and an empty ballot. It does not just clear votes inside the current crew.</p>
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
          <Badge className="border-fuchsia-500/25 bg-fuchsia-500/14">Snapshot</Badge>
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
            <Input value={feedbackEmail} onChange={(e) => { setFeedbackEmail(e.target.value); setFeedbackStatus('idle'); setFeedbackError(null); }} placeholder="Email (optional)" />
            <Textarea value={feedbackMessage} onChange={(e) => { setFeedbackMessage(e.target.value); setFeedbackStatus('idle'); setFeedbackError(null); }} placeholder="What should change, what felt confusing, or what would make this better?" rows={5} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-[var(--text-muted)]">We’ll attach the current crew context automatically.</div>
              <Button disabled={!feedbackMessage.trim() || feedbackStatus === 'saving'} onClick={handleFeedbackSubmit}>
                {feedbackStatus === 'saving' ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : 'Send feedback'}
              </Button>
            </div>
            {feedbackStatus === 'saved' ? <Pill className="w-fit border-emerald-500/25 bg-emerald-500/12 text-emerald-900 dark:text-emerald-100">Feedback sent. Thank you.</Pill> : null}
            {feedbackStatus === 'error' && feedbackError ? <p className="text-sm text-rose-700 dark:text-rose-300">{feedbackError}</p> : null}
          </Panel>
        </div>
      </Card>
    </section>
  );
}

function Suggestions({ loading, suggestions, onSelect }: { loading: boolean; suggestions: PlaceSuggestion[]; onSelect: (s: PlaceSuggestion) => void }) {
  return (
    <Panel className="panel-fade overflow-hidden">
      {loading ? <div className="shimmer px-4 py-3 text-sm text-[var(--text-muted)]">Searching places…</div> : null}
      {!loading && suggestions.length === 0 ? <div className="px-4 py-3 text-sm text-[var(--text-muted)]">No suggested places yet. You can still add it manually.</div> : null}
      {suggestions.map((s, index) => (
        <button key={s.id} onClick={() => onSelect(s)} className="grid w-full gap-1 border-b border-[var(--border)] px-4 py-3 text-left transition-all duration-300 hover:bg-[var(--surface)] hover:pl-5 last:border-b-0" style={{ animationDelay: `${index * 45}ms` }}>
          <span className="text-sm font-semibold text-[var(--text)]">{s.name}</span>
          {s.secondaryText ? <span className="text-sm text-[var(--text-muted)]">{s.secondaryText}</span> : null}
        </button>
      ))}
    </Panel>
  );
}

function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-soft)] shadow-[var(--shadow-soft)] transition-all duration-300', className)}>{children}</span>;
}

function Metric({ icon: Icon, label, value, compact = false, className }: { icon: any; label: string; value: string | number; compact?: boolean; className?: string }) {
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

function ActionLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--surface)]">
      <Icon className="h-3.5 w-3.5" /> {label}
    </a>
  );
}

function AnimatedBadge({ visible, className, children }: { visible: boolean; className?: string; children: ReactNode }) {
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
