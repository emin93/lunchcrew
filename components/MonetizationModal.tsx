'use client';

import { useEffect } from 'react';
import { Gem, Shield, Sparkles } from 'lucide-react';
import { Badge, Button, Card, Panel } from '@/components/ui';

export function MonetizationModal({
  visible,
  workspaceName,
  proEnabled,
  authReady,
  authUserEmail,
  workspaceRole,
  workspaceHasOwner,
  checkoutBusy,
  checkoutError,
  onStartCheckout,
  onClose,
}: {
  visible: boolean;
  workspaceName?: string;
  proEnabled?: boolean;
  authReady: boolean;
  authUserEmail?: string | null;
  workspaceRole?: 'owner' | 'admin' | null;
  workspaceHasOwner: boolean;
  checkoutBusy: boolean;
  checkoutError?: string | null;
  onStartCheckout: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!visible || typeof document === 'undefined') return;
    const { body, documentElement } = document;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevHtmlOverflow = documentElement.style.overflow;
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    documentElement.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  const canCheckout = !!authUserEmail && workspaceRole === 'owner' && !proEnabled;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/55 p-4 backdrop-blur-md">
      <div className="grid h-full place-items-center">
        <Card className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain p-6 sm:max-h-[calc(100dvh-3rem)] sm:p-8 lg:p-10">
          <div className="grid gap-5">
            <Badge className="w-fit"><Sparkles className="h-3.5 w-3.5" /> Founding Crew Access</Badge>

            <div className="grid gap-2">
              <h3 className="text-3xl font-semibold tracking-tight text-[var(--text)]">Upgrade this crew during evaluation</h3>
              <p className="text-sm leading-7 text-[var(--text-soft)]">One-time payment, tied to one crew. Early buyers help shape LunchCrew, unlock upcoming Pro features for this crew, and get grandfathered as pricing evolves.</p>
            </div>

            <Panel className="grid gap-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[var(--text-muted)]">Founding price</div>
                  <div className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text)]">$29 <span className="text-base font-medium text-[var(--text-muted)]">one-time / crew</span></div>
                </div>
                {workspaceName ? <Badge className="badge-sky">{workspaceName}</Badge> : null}
              </div>
              <div className="grid gap-2 text-sm leading-6 text-[var(--text-soft)]">
                <div>• one-time payment tied to this crew only</div>
                <div>• admin controls, decision rules, recurring defaults, and richer history</div>
                <div>• founders get grandfathered if pricing changes later</div>
              </div>
            </Panel>

            {proEnabled ? (
              <Panel className="grid gap-2 p-4 sm:p-5">
                <div className="text-sm font-semibold text-[var(--text)]">This crew already has founding access</div>
                <p className="text-sm leading-6 text-[var(--text-muted)]">No further purchase is needed for this crew.</p>
              </Panel>
            ) : !authReady ? (
              <Panel className="grid gap-2 p-4 sm:p-5">
                <div className="text-sm font-semibold text-[var(--text)]">Checking owner access…</div>
                <p className="text-sm leading-6 text-[var(--text-muted)]">Give me a second to confirm who can unlock this crew.</p>
              </Panel>
            ) : !authUserEmail ? (
              <Panel className="grid gap-2 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><Shield className="h-4 w-4" /> Sign in as the crew owner first</div>
                <p className="text-sm leading-6 text-[var(--text-muted)]">Open Crew settings, use the magic-link login, and claim the crew. Once you’re the owner, this button will turn into real checkout.</p>
              </Panel>
            ) : workspaceRole !== 'owner' ? (
              <Panel className="grid gap-2 p-4 sm:p-5">
                <div className="text-sm font-semibold text-[var(--text)]">Only the crew owner can unlock founding access</div>
                <p className="text-sm leading-6 text-[var(--text-muted)]">
                  {workspaceHasOwner
                    ? 'This crew is already owned from another device/account. Sign in as that owner account to continue.'
                    : 'Claim this crew first from Crew settings, then come back here to pay.'}
                </p>
              </Panel>
            ) : (
              <Panel className="grid gap-4 p-4 sm:p-5">
                <div className="text-sm leading-6 text-[var(--text-muted)]">Signed in as <span className="font-semibold text-[var(--text)]">{authUserEmail}</span>. This purchase will unlock founding access for this crew.</div>
                <div className="grid gap-2">
                  <Button
                    disabled={!canCheckout || checkoutBusy}
                    onClick={onStartCheckout}
                    className="min-h-14 rounded-[22px] border border-emerald-400/40 bg-[linear-gradient(135deg,#3ecf72,#28b463)] px-6 text-white shadow-[0_20px_44px_rgba(34,197,94,0.2)] hover:-translate-y-1 hover:bg-[linear-gradient(135deg,#48d579,#30bb69)] hover:shadow-[0_24px_52px_rgba(34,197,94,0.26)]"
                  >
                    {checkoutBusy ? 'Opening checkout…' : <><Gem className="h-5 w-5" /> <span className="text-[17px] font-black tracking-normal [text-shadow:0_1px_1px_rgba(0,0,0,0.18)]">Make this a founding crew · $29</span></>}
                  </Button>
                  <p className="text-xs leading-6 text-[var(--text-muted)]">One payment. One crew. Founder pricing locked in during evaluation.</p>
                </div>
              </Panel>
            )}

            {checkoutError ? <p className="text-sm text-rose-600 dark:text-rose-300">{checkoutError}</p> : null}

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs leading-6 text-[var(--text-muted)]">
              Founding Crew Access is tied to a single crew during the evaluation phase. Long-term access depends on LunchCrew continuing to operate, so it cannot be guaranteed if the product is discontinued.
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
