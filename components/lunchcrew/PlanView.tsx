'use client';

import Link from 'next/link';
import { Loader2, MapPinned, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, Input, Panel } from '@/components/ui';
import type { PlaceSuggestion } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { LunchCrewAppModel } from './types';
import { AnimatedNumber, Pill } from './ui';

function Suggestions({ loading, suggestions, onSelect }: { loading: boolean; suggestions: PlaceSuggestion[]; onSelect: (s: PlaceSuggestion) => void }) {
  return (
    <Panel className="panel-fade overflow-hidden">
      {loading ? <div className="shimmer px-4 py-3 text-sm text-[var(--text-muted)]">Searching places…</div> : null}
      {!loading && suggestions.length === 0 ? <div className="px-4 py-3 text-sm text-[var(--text-muted)]">No suggested places yet. You can still add it manually.</div> : null}
      {suggestions.map((suggestion, index) => (
        <button key={suggestion.id} onClick={() => onSelect(suggestion)} className="grid w-full gap-1 border-b border-[var(--border)] px-4 py-3 text-left transition-all duration-300 hover:bg-[var(--surface)] hover:pl-5 last:border-b-0" style={{ animationDelay: `${index * 45}ms` }}>
          <span className="text-sm font-semibold text-[var(--text)]">{suggestion.name}</span>
          {suggestion.secondaryText ? <span className="text-sm text-[var(--text-muted)]">{suggestion.secondaryText}</span> : null}
        </button>
      ))}
    </Panel>
  );
}

export function PlanView({ app, todayHref }: { app: LunchCrewAppModel; todayHref: string }) {
  const [manualAdded, setManualAdded] = useState(false);
  const [recentlyAddedName, setRecentlyAddedName] = useState<string | null>(null);
  const [showAreaDialog, setShowAreaDialog] = useState(false);
  const sortedShortlist = [...app.options].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
  const shortlistCountLabel = `${app.options.length} ${app.options.length === 1 ? 'place' : 'places'}`;
  const areaButtonLabel = app.activeSearchAreaLabel || 'Set crew area';

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

  async function handleClearAreaOverride() {
    const cleared = await app.clearSearchArea();
    app.clearSearchAreaError();
    if (cleared) setShowAreaDialog(false);
  }

  async function handleUseCurrentLocation() {
    const applied = await app.useCurrentLocationForCrewArea();
    if (applied) {
      app.clearSearchAreaError();
      setShowAreaDialog(false);
    }
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
                <Pill className={cn(app.hasCrewSearchArea ? 'pill-sky' : 'border-[var(--border)] text-[var(--text)]')}>
                  {app.activeSearchAreaLabel ? `Crew area: ${app.activeSearchAreaLabel}` : 'No crew area set'}
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
                    <Pill className="pill-emerald">{shortlistCountLabel}</Pill>
                  </div>
                </Panel>
              ) : null}

              {manualAdded && !recentlyAddedName ? <Pill className="pill-emerald w-fit">Added to today’s shortlist.</Pill> : null}
            </Panel>
          </div>
        </Card>

        <Card className="panel-fade p-6 sm:p-8">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className="badge-sky">Today’s shortlist</Badge>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">What’s already in</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">This stays visible while you plan, so duplicates make sense and the flow feels grounded.</p>
              </div>
              <Pill>{shortlistCountLabel}</Pill>
            </div>

            {!app.pollDataReady ? (
              <Panel className="grid gap-3 p-5">
                <div className="flex items-center gap-2 text-base font-semibold text-[var(--text)]"><Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" /> Loading shortlist…</div>
                <p className="text-sm leading-6 text-[var(--text-muted)]">Fetching today’s places before we decide whether the list is empty.</p>
              </Panel>
            ) : app.options.length === 0 ? (
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
                            {index === 0 ? <Pill className="pill-amber">Top voted</Pill> : null}
                            {isRecentlyAdded ? <Pill className="pill-emerald">Just added</Pill> : null}
                          </div>
                          <div className="mt-1.5 text-sm font-semibold text-[var(--text)] sm:text-base">{opt.name}</div>
                          {opt.place?.formatted_address ? <div className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)]">{opt.place.formatted_address}</div> : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-sm font-semibold text-[var(--text)]">
                            <AnimatedNumber value={opt.votes} />
                          </div>
                          <Button
                            variant="ghost"
                            className="min-h-9 rounded-full px-3 text-rose-700 hover:bg-rose-500/12 hover:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-500/18 dark:hover:text-rose-100"
                            disabled={app.removingOptionId === opt.id}
                            onClick={() => void app.removeOption(opt.id)}
                            aria-label={`Remove ${opt.name}`}
                          >
                            {app.removingOptionId === opt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
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
                <Badge className="badge-sky w-fit">Crew area</Badge>
                <h3 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Choose where nearby search should focus</h3>
                <p className="text-sm leading-7 text-[var(--text-soft)]">This area belongs to the crew, so everyone searches around the same place. You can type an area manually or use the current GPS location from this device.</p>
              </div>

              <Panel className="grid gap-3 p-4">
                <div className="text-sm font-medium text-[var(--text)]">Current crew area</div>
                <Pill className={cn(app.hasCrewSearchArea ? 'pill-sky' : 'border-[var(--border)] text-[var(--text)]')}>
                  {app.activeSearchAreaLabel ? `Crew area: ${app.activeSearchAreaLabel}` : 'No crew area yet'}
                </Pill>
                <p className="text-sm text-[var(--text-muted)]">Try a city, neighbourhood, or fuller address if the crew should search somewhere else.</p>
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

              <div className="flex flex-wrap justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" disabled={!app.geolocationAvailable || app.usingCurrentLocation || app.searchAreaLoading} onClick={handleUseCurrentLocation}>
                    {app.usingCurrentLocation ? <><Loader2 className="h-4 w-4 animate-spin" /> Locating…</> : <><MapPinned className="h-4 w-4" /> Use current location</>}
                  </Button>
                  {app.hasCrewSearchArea ? <Button variant="ghost" onClick={handleClearAreaOverride}>Clear crew area</Button> : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={handleCloseAreaDialog}>Close</Button>
                  <Button disabled={!app.searchAreaInput.trim() || app.searchAreaLoading || app.usingCurrentLocation} onClick={handleApplyArea}>
                    {app.searchAreaLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Use this area'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
