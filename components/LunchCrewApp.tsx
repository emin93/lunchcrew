'use client';

import Link from 'next/link';
import { CalendarDays, Clock3, Compass, Crown, ExternalLink, Loader2, MapPinned, Plus, Rocket, Search, Settings2, Share2, Trophy, Users2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { MonetizationModal } from '@/components/MonetizationModal';
import { Onboarding } from '@/components/Onboarding';
import { Badge, Button, Card, Input, Panel } from '@/components/ui';
import { useLunchCrewApp } from '@/hooks/useLunchCrewApp';
import { initialsForName } from '@/lib/helpers';
import type { PlaceSuggestion } from '@/lib/types';
import { cn } from '@/lib/utils';

function priceLabel(priceLevel?: number | null) {
  if (typeof priceLevel !== 'number' || priceLevel < 0) return '';
  return '$'.repeat(Math.max(1, Math.min(4, priceLevel)));
}

export function LunchCrewApp({ initialCode }: { initialCode?: string }) {
  const app = useLunchCrewApp(initialCode);
  const [joinCode, setJoinCode] = useState(initialCode || '');

  if (!app.onboardingReady) {
    return (
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <Card className="w-full p-10 text-center text-slate-300">Loading LunchCrew…</Card>
      </section>
    );
  }
  if (!app.onboardingDone) return <Onboarding onComplete={app.completeOnboarding} />;

  const activeHistory = app.show30DayHistory ? app.history30Days : app.history7Days;
  const totalVotes = app.options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="grid gap-5">
              <Badge className="w-fit">Unified app shell · redesigned for Next.js 15</Badge>
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{app.workspace?.name || 'LunchCrew'}</h1>
                  {app.workspace?.invite_code ? <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-slate-300">{app.workspace.invite_code}</span> : null}
                </div>
                <p className="max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">Realtime lunch voting, place search, history, crew controls, and restoreable invite-based access — now presented like a modern product instead of a rough internal tool.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric icon={Users2} label="Crew build" value={app.BUILD_LABEL} />
                <Metric icon={Clock3} label="Votes cast" value={String(totalVotes)} />
                <Metric icon={Crown} label="Front runner" value={app.topChoice || 'Waiting'} />
              </div>
            </div>

            <Panel className="grid gap-3 p-4 sm:p-5">
              <div className="text-sm font-medium text-slate-400">Crew actions</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Link href="/"><Button variant="secondary" className="w-full justify-start"><Compass className="h-4 w-4" /> Marketing page</Button></Link>
                <Button variant="secondary" className="justify-start" onClick={() => app.shareInvite()}><Share2 className="h-4 w-4" /> Share invite</Button>
                <Button variant="gold" className="justify-start sm:col-span-2 lg:col-span-1 xl:col-span-2" onClick={() => app.createNewCrew()}><Rocket className="h-4 w-4" /> Create new crew</Button>
              </div>
            </Panel>
          </div>
        </Card>

        {!app.workspace ? (
          <Card className="p-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="grid gap-2">
                <div className="text-lg font-semibold text-white">Join a crew</div>
                <p className="text-sm leading-6 text-slate-400">Use an invite code or full invite link. Restore still works automatically if you’ve already been here on this device.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:min-w-[28rem]">
                <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Invite code, e.g. LC-ABCD-EFGH" />
                <Link href={`/app?code=${encodeURIComponent(joinCode)}`} className="sm:w-auto"><Button className="w-full">Join crew</Button></Link>
              </div>
            </div>
          </Card>
        ) : null}

        {app.loadError ? (
          <Card className="border-rose-300/20 bg-rose-400/8 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-200">Something needs attention</div>
                <p className="mt-2 text-sm text-rose-100/90">{app.loadError}</p>
              </div>
              <Button variant="destructive" onClick={() => app.retryLoad()}>Retry</Button>
            </div>
          </Card>
        ) : null}

        {app.configError ? <Card className="p-5 text-sm text-amber-100">{app.configError}</Card> : null}

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-6 sm:p-8">
            <div className="grid gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="grid gap-2">
                  <Badge className="w-fit">Live floor</Badge>
                  <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{app.poll?.title || "Today's Lunch"}</h2>
                  <p className="max-w-2xl text-sm leading-7 text-slate-400">Realtime subscriptions stay active when available. If they drop, the app keeps moving via polling fallback.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Metric icon={CalendarDays} label="Options" value={String(app.options.length)} compact />
                  <Metric icon={Trophy} label="Votes" value={String(totalVotes)} compact />
                </div>
              </div>

              <div className="grid gap-4">
                {app.options.length === 0 ? (
                  <Panel className="grid gap-2 p-8 text-center">
                    <div className="text-lg font-semibold text-white">No places yet</div>
                    <p className="text-sm text-slate-400">Add the first contender below and the board will come alive.</p>
                  </Panel>
                ) : app.options.map((opt, index) => {
                  const mapsUrl = opt.place?.google_maps_url;
                  const menuUrl = opt.menu_url || opt.place?.detected_menu_url || opt.place?.website_url;
                  const isActive = app.myOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      className={cn(
                        'group grid gap-4 rounded-[28px] border p-5 text-left transition duration-200',
                        'border-white/10 bg-white/6 hover:border-white/16 hover:bg-white/8',
                        isActive && 'border-emerald-300/30 bg-emerald-300/10',
                      )}
                      disabled={!!app.votingOptionId}
                      onClick={() => app.vote(opt.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="grid gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {index === 0 ? <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-100">Lead</Badge> : null}
                            {isActive ? <Badge>Your vote</Badge> : null}
                          </div>
                          <div>
                            <div className="text-2xl font-semibold text-white">{opt.name}</div>
                            {opt.place?.formatted_address ? <div className="mt-1 text-sm text-slate-400">{opt.place.formatted_address}</div> : null}
                          </div>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-slate-950/40 px-5 py-3 text-right">
                          <div className="text-3xl font-semibold text-white">{opt.votes}</div>
                          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">votes</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                        {typeof opt.place?.rating === 'number' ? <Pill>★ {opt.place.rating.toFixed(1)}</Pill> : null}
                        {priceLabel(opt.place?.price_level) ? <Pill>{priceLabel(opt.place?.price_level)}</Pill> : null}
                        {mapsUrl ? <ActionLink href={mapsUrl} label="Maps" icon={MapPinned} /> : null}
                        {menuUrl ? <ActionLink href={menuUrl} label="Menu" icon={ExternalLink} /> : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {opt.voters.length ? opt.voters.map((v, i) => <Pill key={`${opt.id}-${i}`}>{initialsForName(v)} · {v}</Pill>) : <span className="text-sm text-slate-500">Still quiet. First vote changes the board.</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Panel className="grid gap-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-400">Add another contender</div>
                    <div className="mt-1 text-lg font-semibold text-white">Search nearby or publish a manual option</div>
                  </div>
                  {app.selectedSuggestion ? <Button variant="secondary" onClick={() => app.setSelectedSuggestion(null)}>Clear selection</Button> : null}
                </div>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input className="pl-10" placeholder="Search nearby or type manually" value={app.newOption} onChange={(e) => app.setNewOption(e.target.value)} />
                  </div>
                  <Button disabled={(!app.selectedSuggestion && !app.newOption.trim()) || app.addingOption} onClick={() => app.addOption()} className="lg:px-6">
                    {app.addingOption ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</> : <><Plus className="h-4 w-4" /> Publish</>}
                  </Button>
                </div>
                {app.selectedSuggestion ? <Pill className="w-fit">Selected place: {app.selectedSuggestion.name}</Pill> : <p className="text-sm text-slate-500">Location only improves suggestions. It isn’t stored.</p>}
                {!app.selectedSuggestion && app.newOption.trim().length >= 2 ? <Suggestions loading={app.loadingSuggestions} suggestions={app.suggestions} onSelect={(s) => { app.setSelectedSuggestion(s); app.setNewOption(s.name); }} /> : null}
              </Panel>
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="p-6 sm:p-8">
              <div className="grid gap-5">
                <div>
                  <Badge className="w-fit">Crew control</Badge>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Settings, identity, and invite access</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Everything required for workspace naming, display-name persistence, and invite sharing stays intact.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric icon={Share2} label="Invite code" value={app.workspace?.invite_code || '—'} />
                  <Metric icon={Settings2} label="Build" value={app.BUILD_LABEL} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-slate-400">Rename crew</label>
                  <Input defaultValue={app.workspace?.name || ''} onBlur={(e) => app.renameCrew(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-slate-400">Your display name</label>
                  <Input defaultValue={app.member?.display_name || ''} onBlur={(e) => app.saveDisplayName(e.target.value)} />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="grid gap-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Badge className="w-fit border-sky-300/20 bg-sky-300/10 text-sky-100">Crew archive</Badge>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Patterns, not just receipts</h2>
                  </div>
                  <div className="flex rounded-full border border-white/10 bg-white/6 p-1">
                    <button className={cn('rounded-full px-4 py-2 text-sm transition', !app.show30DayHistory ? 'bg-white text-slate-950' : 'text-slate-400')} onClick={() => app.setShow30DayHistory(false)}>7 days</button>
                    <button className={cn('rounded-full px-4 py-2 text-sm transition', app.show30DayHistory ? 'bg-white text-slate-950' : 'text-slate-400')} onClick={() => app.setShow30DayHistory(true)}>30 days</button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <Panel className="grid gap-3 p-4">
                    <div className="text-sm font-medium text-slate-400">Leaderboard</div>
                    {app.leaderboard.slice(0, 3).length ? app.leaderboard.slice(0, 3).map((place, i) => <Pill key={place.name}>#{i + 1} · {place.name} · {place.wins} wins</Pill>) : <span className="text-sm text-slate-500">No winners yet.</span>}
                  </Panel>
                  <Metric icon={CalendarDays} label="Window size" value={String(activeHistory.length)} large />
                </div>
                <Panel className="overflow-hidden">
                  <div className="grid grid-cols-[120px_1fr_72px] gap-3 border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                    <span>Date</span><span>Winner</span><span>Votes</span>
                  </div>
                  <div className="max-h-[24rem] overflow-auto">
                    {activeHistory.map((row) => (
                      <div key={row.poll_date} className="grid grid-cols-[120px_1fr_72px] gap-3 border-b border-white/6 px-4 py-3 text-sm text-slate-200 last:border-b-0">
                        <span className="text-slate-400">{row.poll_date}</span>
                        <span>{row.winner_name || 'No winner'}</span>
                        <span>{row.winner_votes || 0}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <MonetizationModal visible={app.showMonetizationModal} workspaceId={app.workspace?.id} deviceId={app.deviceId} onClose={() => app.setShowMonetizationModal(false)} />
    </>
  );
}

function Suggestions({ loading, suggestions, onSelect }: { loading: boolean; suggestions: PlaceSuggestion[]; onSelect: (s: PlaceSuggestion) => void }) {
  return (
    <Panel className="overflow-hidden">
      {loading ? <div className="px-4 py-3 text-sm text-slate-400">Searching places…</div> : null}
      {!loading && suggestions.length === 0 ? <div className="px-4 py-3 text-sm text-slate-500">No suggested places yet. You can still add it manually.</div> : null}
      {suggestions.map((s) => (
        <button key={s.id} onClick={() => onSelect(s)} className="grid w-full gap-1 border-b border-white/8 px-4 py-3 text-left transition hover:bg-white/6 last:border-b-0">
          <span className="text-sm font-semibold text-white">{s.name}</span>
          {s.secondaryText ? <span className="text-sm text-slate-400">{s.secondaryText}</span> : null}
        </button>
      ))}
    </Panel>
  );
}

function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-slate-200', className)}>{children}</span>;
}

function Metric({ icon: Icon, label, value, compact = false, large = false }: { icon: any; label: string; value: string; compact?: boolean; large?: boolean }) {
  return (
    <Panel className={cn('grid gap-2 p-4', compact && 'min-w-[10rem]', large && 'content-center justify-items-start p-5')}>
      <div className="flex items-center gap-2 text-sm text-slate-400"><Icon className="h-4 w-4" /> {label}</div>
      <div className={cn('font-semibold text-white', compact ? 'text-lg' : large ? 'text-5xl' : 'text-2xl')}>{value}</div>
    </Panel>
  );
}

function ActionLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/35 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/8">
      <Icon className="h-3.5 w-3.5" /> {label}
    </a>
  );
}
