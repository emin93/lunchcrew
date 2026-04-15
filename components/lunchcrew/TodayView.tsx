'use client';

import Link from 'next/link';
import { CalendarDays, Crown, ExternalLink, Loader2, MapPinned, Plus, Share2, Trophy } from 'lucide-react';
import { initialsForName } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Badge, Button, Card, Panel } from '@/components/ui';
import type { LunchCrewAppModel } from './types';
import { ActionLink, AnimatedNumber, Metric, Pill, priceLabel } from './ui';

export function TodayView({ app, totalVotes, planHref }: { app: LunchCrewAppModel; totalVotes: number; planHref: string }) {
  const displayedOptions = app.options;
  const leaderOptionId = [...app.options].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name))[0]?.id;
  const maxVotes = Math.max(...displayedOptions.map((opt) => opt.votes), 1);

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
          {!app.pollDataReady ? (
            <Panel className="grid gap-3 p-8 text-center">
              <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" /></div>
              <div className="text-lg font-semibold text-[var(--text)]">Loading today’s ballot…</div>
              <p className="text-sm text-[var(--text-muted)]">Pulling in the current shortlist and votes.</p>
            </Panel>
          ) : app.options.length === 0 ? (
            <Panel className="grid gap-3 p-8 text-center">
              <div className="text-lg font-semibold text-[var(--text)]">No places yet</div>
              <p className="text-sm text-[var(--text-muted)]">Start in Plan mode to shape the shortlist before the votes roll in.</p>
              <div>
                <Link href={planHref}><Button><Plus className="h-4 w-4" /> Open plan</Button></Link>
              </div>
            </Panel>
          ) : displayedOptions.map((opt, index) => {
            const mapsUrl = opt.place?.google_maps_url;
            const menuUrl = opt.menu_url || opt.place?.detected_menu_url || opt.place?.website_url;
            const isActive = app.myOptionId === opt.id;
            const isLeader = opt.id === leaderOptionId && opt.votes > 0;
            const isVoting = app.votingOptionId === opt.id;
            const width = Math.max(34, Math.round((opt.votes / maxVotes) * 100));
            const activityDots = Math.max(2, Math.min(4, opt.voters.length || opt.votes || 1));
            return (
              <button
                key={opt.id}
                className={cn(
                  'group relative grid cursor-pointer gap-4 overflow-hidden rounded-[30px] border p-4 text-left transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] sm:p-5',
                  'border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)] hover:shadow-[0_22px_48px_rgba(0,0,0,0.08)] active:scale-[0.995]',
                  (isLeader || isActive) && 'border-[rgba(255,122,89,0.32)] bg-[rgba(255,122,89,0.11)]',
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
                    <div className="flex min-h-7 flex-wrap items-center gap-2">
                      {isLeader ? <Badge className="pill-amber normal-case tracking-normal shadow-[var(--shadow-soft)]">Leading</Badge> : null}
                      {isActive ? <Badge className="normal-case tracking-normal shadow-[var(--shadow-soft)]">Your vote</Badge> : null}
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
