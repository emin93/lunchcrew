'use client';

import { Loader2 } from 'lucide-react';
import { Badge, Card, Panel } from '@/components/ui';
import type { LunchCrewAppModel } from './types';
import { Pill } from './ui';
import { cn } from '@/lib/utils';

export function HistoryView({ app, activeHistory }: { app: LunchCrewAppModel; activeHistory: LunchCrewAppModel['history7Days'] }) {
  return (
    <section className="grid gap-4 sm:gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="panel-fade p-6 sm:p-8">
        <div className="grid gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="badge-sky">History</Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">Patterns, not just receipts</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Recent winners and repeat favorites live here instead of competing with today’s main task.</p>
            </div>
            <div className="flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-soft)]">
              <button className={cn('cursor-pointer rounded-full px-4 py-2 text-sm transition-all duration-300', !app.show30DayHistory ? 'bg-[var(--text)] text-[var(--bg)] shadow-[var(--shadow-soft)]' : 'text-[var(--text-muted)]')} onClick={() => app.setShow30DayHistory(false)}>7 days</button>
              <button className={cn('cursor-pointer rounded-full px-4 py-2 text-sm transition-all duration-300', app.show30DayHistory ? 'bg-[var(--text)] text-[var(--bg)] shadow-[var(--shadow-soft)]' : 'text-[var(--text-muted)]')} onClick={() => app.setShow30DayHistory(true)}>30 days</button>
            </div>
          </div>
          <Panel className="panel-fade grid gap-3 p-4">
            <div className="text-sm font-medium text-[var(--text-muted)]">Leaderboard</div>
            {!app.historyDataReady ? (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading history…</div>
            ) : app.leaderboard.slice(0, 5).length ? app.leaderboard.slice(0, 5).map((place, index) => <Pill key={place.name}>#{index + 1} · {place.name} · {place.wins} wins</Pill>) : <span className="text-sm text-[var(--text-muted)]">No winners yet.</span>}
          </Panel>
        </div>
      </Card>

      <Card className="panel-fade overflow-hidden">
        <div className="grid grid-cols-[120px_1fr_72px] gap-3 border-b border-[var(--border)] px-4 py-3 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
          <span>Date</span><span>Winner</span><span>Votes</span>
        </div>
        <div className="max-h-[36rem] overflow-auto">
          {!app.historyDataReady ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-[var(--text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading recent lunches…</div>
          ) : activeHistory.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[var(--text-muted)]">No history yet.</div>
          ) : activeHistory.map((row, index) => (
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
