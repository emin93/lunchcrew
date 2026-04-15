'use client';

import Link from 'next/link';
import { Suspense, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Compass, History, Loader2, Plus, Sparkles, Users2, UtensilsCrossed } from 'lucide-react';
import { usePathname, useSearchParams, useSelectedLayoutSegments } from 'next/navigation';
import { MonetizationModal } from '@/components/MonetizationModal';
import { Onboarding } from '@/components/Onboarding';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge, Button, Card } from '@/components/ui';
import { CrewView } from '@/components/lunchcrew/CrewView';
import { HistoryView } from '@/components/lunchcrew/HistoryView';
import { PlanView } from '@/components/lunchcrew/PlanView';
import { TodayView } from '@/components/lunchcrew/TodayView';
import type { AppView } from '@/components/lunchcrew/types';
import { useLunchCrewApp } from '@/hooks/useLunchCrewApp';
import { workspacePath } from '@/lib/helpers';
import { cn } from '@/lib/utils';

const VIEWS: Array<{ id: AppView; label: string; short: string; icon: any }> = [
  { id: 'today', label: 'Today', short: 'Today', icon: UtensilsCrossed },
  { id: 'plan', label: 'Plan', short: 'Plan', icon: Plus },
  { id: 'history', label: 'History', short: 'History', icon: History },
  { id: 'crew', label: 'Crew', short: 'Crew', icon: Users2 },
];

export function LunchCrewApp({ initialCode }: { initialCode?: string }) {
  const app = useLunchCrewApp(initialCode);
  const segments = useSelectedLayoutSegments();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [checkoutResult, setCheckoutResult] = useState<'success' | 'cancelled' | null>(null);

  const activeHistory = app.show30DayHistory ? app.history30Days : app.history7Days;
  const totalVotes = useMemo(() => app.options.reduce((sum, opt) => sum + opt.votes, 0), [app.options]);
  const pollReady = !!app.poll;
  const emptyBallot = pollReady && app.pollDataReady && app.options.length === 0;
  const requestedView = (segments[0] as AppView | undefined) || 'today';
  const activeView: AppView = !app.workspace ? 'today' : requestedView === 'today' && emptyBallot ? 'plan' : requestedView;

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    const viewTitle = activeView === 'today' ? 'Today' : activeView === 'plan' ? 'Plan' : activeView === 'history' ? 'History' : 'Crew';
    const crewName = (app.workspace?.name || '').trim();
    const hasMeaningfulCrewName = !!crewName && crewName.toLowerCase() !== 'lunchcrew';
    document.title = hasMeaningfulCrewName ? `${viewTitle} · ${crewName} · LunchCrew` : `${viewTitle} · LunchCrew`;
  }, [pathname, activeView, app.workspace?.name]);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success' || checkout === 'cancelled') {
      setCheckoutResult(checkout);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('checkout');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (checkoutResult !== 'success' || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    void import('canvas-confetti').then(({ default: confetti }) => {
      const originY = window.innerWidth < 640 ? 0.72 : 0.78;
      confetti({ particleCount: 120, spread: 80, startVelocity: 42, origin: { y: originY } });
      window.setTimeout(() => {
        confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0.12, y: originY } });
        confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 0.88, y: originY } });
      }, 180);
    }).catch(() => {});
  }, [checkoutResult]);

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

        {checkoutResult === 'success' ? (
          <Card className="panel-fade relative overflow-hidden border-emerald-500/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(255,209,102,0.18))] p-5">
            <div className="celebration-burst celebration-burst-a" />
            <div className="celebration-burst celebration-burst-b" />
            <div className="relative grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="badge-emerald tada-pop"><Sparkles className="h-3.5 w-3.5" /> Payment successful</Badge>
              </div>
              <div>
                <div className="text-lg font-semibold text-[var(--text)]">This crew just unlocked founding access.</div>
                <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
                  {app.workspace?.pro_enabled
                    ? 'Admin controls and upcoming founder features are now tied to this crew.'
                    : 'Stripe sent us back successfully. If the unlocked state does not appear in a moment, refresh once while the webhook finishes.'}
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        {checkoutResult === 'cancelled' ? (
          <Card className="panel-fade border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-900 dark:text-amber-100">
            Checkout was cancelled. The crew stays on the free plan until you complete payment.
          </Card>
        ) : null}

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
            <div className="grid gap-4 text-center">
              <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" /></div>
              <div>
                <div className="text-lg font-semibold text-[var(--text)]">Loading crew…</div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Resolving the invite link and restoring the current crew.</p>
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
                      'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ease-out',
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
              {activeView === 'today' ? <TodayView app={app} totalVotes={totalVotes} planHref={workspacePath(app.workspace.invite_code, 'plan')} /> : null}
              {activeView === 'plan' ? <PlanView app={app} todayHref={workspacePath(app.workspace.invite_code)} /> : null}
              {activeView === 'history' ? <HistoryView app={app} activeHistory={activeHistory} /> : null}
              {activeView === 'crew' ? <CrewView app={app} totalVotes={totalVotes} /> : null}
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
      <MonetizationModal
        visible={app.showMonetizationModal}
        workspaceName={app.workspace?.name}
        proEnabled={app.workspace?.pro_enabled}
        authReady={app.authReady}
        authUserEmail={app.authUser?.email}
        workspaceRole={app.workspaceRole}
        workspaceHasOwner={app.workspaceHasOwner}
        checkoutBusy={app.checkoutBusy}
        checkoutError={app.checkoutError}
        onStartCheckout={() => void app.startFoundingCheckout()}
        onClose={() => app.dismissMonetizationModal()}
      />
    </>
  );
}
