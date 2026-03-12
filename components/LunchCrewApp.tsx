'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MonetizationModal } from '@/components/MonetizationModal';
import { Onboarding } from '@/components/Onboarding';
import { useLunchCrewApp } from '@/hooks/useLunchCrewApp';
import { initialsForName } from '@/lib/helpers';
import type { PlaceSuggestion } from '@/lib/types';

function priceLabel(priceLevel?: number | null) {
  if (typeof priceLevel !== 'number' || priceLevel < 0) return '';
  return '$'.repeat(Math.max(1, Math.min(4, priceLevel)));
}

export function LunchCrewApp({ initialCode }: { initialCode?: string }) {
  const app = useLunchCrewApp(initialCode);
  const [joinCode, setJoinCode] = useState(initialCode || '');

  if (!app.onboardingReady) return <section className="container" style={{ padding: '64px 0' }}><div className="card" style={{ padding: 24 }}>Loading LunchCrew…</div></section>;
  if (!app.onboardingDone) return <Onboarding onComplete={app.completeOnboarding} />;

  return (
    <>
      <section className="container" style={{ padding: '24px 0 80px', display: 'grid', gap: 18 }}>
        <div className="card" style={{ padding: 22, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="kicker">Single Next.js app</span>
            <h1 style={{ margin: 0, fontSize: 38 }}>{app.workspace?.name || 'LunchCrew'}</h1>
            <p className="dim" style={{ margin: 0 }}>Realtime daily lunch voting, history, crew settings, and smart place search.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/" className="button button-secondary">Marketing page</Link>
            <button className="button button-secondary" onClick={() => app.shareInvite()}>Share invite</button>
            <button className="button button-gold" onClick={() => app.createNewCrew()}>Create new crew</button>
          </div>
        </div>

        {!app.workspace ? (
          <div className="card" style={{ padding: 24, display: 'grid', gap: 14 }}>
            <strong>Join a crew</strong>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input className="input" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Invite code, e.g. LC-ABCD-EFGH" style={{ flex: 1, minWidth: 260 }} />
              <Link className="button button-primary" href={`/app?code=${encodeURIComponent(joinCode)}`}>Join</Link>
            </div>
          </div>
        ) : null}

        {app.loadError ? (
          <div className="card" style={{ padding: 18, borderColor: 'rgba(255,176,184,.35)' }}>
            <strong style={{ display: 'block', marginBottom: 6 }}>Something needs attention</strong>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span className="dim">{app.loadError}</span>
              <button className="button button-secondary" onClick={() => app.retryLoad()}>Retry</button>
            </div>
          </div>
        ) : null}

        {app.configError ? <div className="card" style={{ padding: 18 }}>{app.configError}</div> : null}

        <div className="grid grid-2">
          <section className="card" style={{ padding: 24, display: 'grid', gap: 18 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <span className="kicker">Live floor</span>
              <h2 style={{ margin: 0, fontSize: 30 }}>{app.poll?.title || "Today's Lunch"}</h2>
              <p className="dim" style={{ margin: 0 }}>Votes sync in realtime. If websockets drop, the app falls back to polling.</p>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="panel" style={{ padding: 14 }}><div className="muted">Votes cast</div><strong>{app.options.reduce((sum, o) => sum + o.votes, 0)}</strong></div>
              <div className="panel" style={{ padding: 14 }}><div className="muted">Front runner</div><strong>{app.topChoice || 'Waiting for first vote'}</strong></div>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {app.options.length === 0 ? <div className="panel" style={{ padding: 18 }}>No places yet. Add the first option below.</div> : app.options.map((opt, index) => {
                const mapsUrl = opt.place?.google_maps_url;
                const menuUrl = opt.menu_url || opt.place?.detected_menu_url || opt.place?.website_url;
                const isActive = app.myOptionId === opt.id;
                return (
                  <button key={opt.id} className="panel" style={{ textAlign: 'left', padding: 18, cursor: 'pointer', borderColor: isActive ? 'rgba(246,212,122,.3)' : undefined }} disabled={!!app.votingOptionId} onClick={() => app.vote(opt.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'grid', gap: 6 }}>
                        <strong style={{ fontSize: 22 }}>{index === 0 ? 'Lead · ' : ''}{opt.name}</strong>
                        {opt.place?.formatted_address ? <span className="dim">{opt.place.formatted_address}</span> : null}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: 24 }}>{opt.votes}</strong>
                        <div className="muted">votes</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      {isActive ? <span className="badge">Your vote</span> : null}
                      {typeof opt.place?.rating === 'number' ? <span className="badge">★ {opt.place.rating.toFixed(1)}</span> : null}
                      {priceLabel(opt.place?.price_level) ? <span className="badge">{priceLabel(opt.place?.price_level)}</span> : null}
                      {mapsUrl ? <a className="button button-secondary" href={mapsUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Maps</a> : null}
                      {menuUrl ? <a className="button button-secondary" href={menuUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Menu</a> : null}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      {opt.voters.length ? opt.voters.map((v, i) => <span key={`${opt.id}-${i}`} className="badge">{initialsForName(v)} · {v}</span>) : <span className="muted">Still quiet. First vote changes the whole board.</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="panel" style={{ padding: 18, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div className="muted">Assignment desk</div>
                  <strong>Add another contender</strong>
                </div>
                {app.selectedSuggestion ? <button className="button button-secondary" onClick={() => app.setSelectedSuggestion(null)}>Clear</button> : null}
              </div>
              <input className="input" placeholder="Search nearby or type manually" value={app.newOption} onChange={(e) => app.setNewOption(e.target.value)} />
              {app.selectedSuggestion ? <div className="badge">Selected place: {app.selectedSuggestion.name}</div> : <span className="muted">Location is only used to improve suggestions and is never stored.</span>}
              <button className="button button-primary" disabled={(!app.selectedSuggestion && !app.newOption.trim()) || app.addingOption} onClick={() => app.addOption()}>{app.addingOption ? 'Publishing…' : 'Publish to ballot'}</button>
              {(!app.selectedSuggestion && app.newOption.trim().length >= 2) ? <Suggestions loading={app.loadingSuggestions} suggestions={app.suggestions} onSelect={(s) => { app.setSelectedSuggestion(s); app.setNewOption(s.name); }} /> : null}
            </div>
          </section>

          <div style={{ display: 'grid', gap: 16 }}>
            <section className="card" style={{ padding: 24, display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <span className="kicker">Crew control</span>
                <h2 style={{ margin: 0, fontSize: 28 }}>{app.workspace?.name || 'Workspace'}</h2>
                <p className="dim" style={{ margin: 0 }}>Invite access, workspace naming, and the display identity attached to votes.</p>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div className="panel" style={{ padding: 14 }}><div className="muted">Invite code</div><strong>{app.workspace?.invite_code || '—'}</strong></div>
                <div className="panel" style={{ padding: 14 }}><div className="muted">Build</div><strong>{app.BUILD_LABEL}</strong></div>
              </div>
              <label className="muted">Rename crew</label>
              <input className="input" defaultValue={app.workspace?.name || ''} onBlur={(e) => app.renameCrew(e.target.value)} />
              <label className="muted">Your display name</label>
              <input className="input" defaultValue={app.member?.display_name || ''} onBlur={(e) => app.saveDisplayName(e.target.value)} />
            </section>

            <section className="card" style={{ padding: 24, display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <span className="kicker">Crew archive</span>
                  <h2 style={{ margin: '6px 0 0', fontSize: 28 }}>Patterns, not just receipts</h2>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`button ${!app.show30DayHistory ? 'button-primary' : 'button-secondary'}`} onClick={() => app.setShow30DayHistory(false)}>7 days</button>
                  <button className={`button ${app.show30DayHistory ? 'button-primary' : 'button-secondary'}`} onClick={() => app.setShow30DayHistory(true)}>30 days</button>
                </div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1.1fr .9fr' }}>
                <div className="panel" style={{ padding: 16, display: 'grid', gap: 10 }}>
                  <div className="muted">Podium</div>
                  {app.leaderboard.slice(0, 3).length ? app.leaderboard.slice(0, 3).map((place, i) => <div key={place.name} className="badge">#{i + 1} · {place.name} · {place.wins} wins</div>) : <span className="muted">No winners yet.</span>}
                </div>
                <div className="panel" style={{ padding: 16 }}>
                  <div className="muted">Window</div>
                  <strong style={{ fontSize: 44 }}>{(app.show30DayHistory ? app.history30Days : app.history7Days).length}</strong>
                </div>
              </div>
              <div className="panel" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 64px', gap: 12, padding: 14, borderBottom: '1px solid var(--stroke)' }}>
                  <strong className="muted">Date</strong><strong className="muted">Winner</strong><strong className="muted">Votes</strong>
                </div>
                {(app.show30DayHistory ? app.history30Days : app.history7Days).map((row) => (
                  <div key={row.poll_date} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 64px', gap: 12, padding: 14, borderBottom: '1px solid var(--stroke)' }}>
                    <span>{row.poll_date}</span><span>{row.winner_name || 'No winner'}</span><span>{row.winner_votes || 0}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
      <MonetizationModal visible={app.showMonetizationModal} workspaceId={app.workspace?.id} deviceId={app.deviceId} onClose={() => app.setShowMonetizationModal(false)} />
    </>
  );
}

function Suggestions({ loading, suggestions, onSelect }: { loading: boolean; suggestions: PlaceSuggestion[]; onSelect: (s: PlaceSuggestion) => void }) {
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      {loading ? <div style={{ padding: 12 }} className="muted">Searching places…</div> : null}
      {!loading && suggestions.length === 0 ? <div style={{ padding: 12 }} className="muted">No suggested places yet. You can still add it manually.</div> : null}
      {suggestions.map((s) => (
        <button key={s.id} onClick={() => onSelect(s)} style={{ width: '100%', textAlign: 'left', padding: 14, background: 'transparent', border: 0, borderBottom: '1px solid var(--stroke)', color: 'var(--text)', cursor: 'pointer' }}>
          <strong>{s.name}</strong>
          {s.secondaryText ? <div className="muted" style={{ marginTop: 2 }}>{s.secondaryText}</div> : null}
        </button>
      ))}
    </div>
  );
}
