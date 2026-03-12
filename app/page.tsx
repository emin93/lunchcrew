import Link from 'next/link';

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const appHref = code ? `/app?code=${encodeURIComponent(code)}` : '/app';
  return (
    <main>
      <header style={{ padding: '20px 0 72px' }}>
        <div className="container">
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 48 }}>
            <div style={{ fontWeight: 900, fontSize: 20 }}>🍽️ LunchCrew</div>
            <Link className="button button-secondary" href={appHref}>Open app</Link>
          </nav>
          <section className="card" style={{ padding: 32, display: 'grid', gap: 18 }}>
            <span className="badge">Live on web · realtime voting + smart place search</span>
            <h1 style={{ margin: 0, fontSize: 'clamp(40px, 8vw, 76px)', lineHeight: .95 }}>Decide lunch in minutes, not message threads.</h1>
            <p className="dim" style={{ margin: 0, maxWidth: 760, fontSize: 18 }}>Create a crew, share one invite link, and vote in realtime. Add nearby restaurants with smart search, then open maps and menu links in one tap.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link className="button button-primary" href={appHref}>Start your crew</Link>
              <a className="button button-secondary" href="#features">See features</a>
            </div>
            <p className="muted" style={{ margin: 0 }}>Web-first now. Native shells can come later if they’re still worth it.</p>
          </section>
        </div>
      </header>
      <section id="features" className="container" style={{ paddingBottom: 24 }}>
        <div className="grid grid-3">
          {[
            ['⚡', 'Realtime voting', 'Votes sync live across devices, with fallback polling when realtime drops.'],
            ['📍', 'Nearby place suggestions', 'Autocomplete stays location-aware via the existing Supabase edge-function proxy pattern.'],
            ['🧭', 'Maps + menu links', 'Open directions fast and check menus directly from each option card.'],
            ['🙋', 'Optional identity, no login', 'Display names make votes readable without adding auth friction.'],
            ['🗓️', 'Daily reset, persistent workspace', 'Keep the same crew and carry forward options while resetting votes each day.'],
            ['📊', 'History + leaderboard', 'Track recent winners and long-run favorites without leaving the app.'],
          ].map(([icon, title, body]) => (
            <article key={title} className="card" style={{ padding: 22, display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 28 }}>{icon}</div>
              <h3 style={{ margin: 0 }}>{title}</h3>
              <p className="dim" style={{ margin: 0 }}>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="container" style={{ padding: '24px 0' }}>
        <div className="card" style={{ padding: 28, display: 'grid', gap: 18 }}>
          <h2 style={{ margin: 0, fontSize: 34 }}>How LunchCrew works</h2>
          <div className="grid grid-3">
            {[
              ['1', 'Create or join your crew', 'Open the app and share one invite link with your team.'],
              ['2', 'Add places with smart suggestions', 'Search nearby restaurants, then open maps or menu links instantly.'],
              ['3', 'Vote and decide in realtime', 'Everyone votes live. New day, fresh poll — same workspace.'],
            ].map(([n, title, body]) => (
              <article key={n} className="panel" style={{ padding: 18, display: 'grid', gap: 8 }}>
                <strong>{n}</strong>
                <h3 style={{ margin: 0 }}>{title}</h3>
                <p className="dim" style={{ margin: 0 }}>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="container" style={{ padding: '24px 0 64px' }}>
        <div className="card" style={{ padding: 28, display: 'grid', gap: 12, textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 34 }}>Start your next lunch vote now</h2>
          <p className="dim" style={{ margin: 0 }}>Create your crew in seconds, add nearby restaurant options, and let everyone vote live.</p>
          <div><Link className="button button-primary" href={appHref}>Launch LunchCrew</Link></div>
        </div>
      </section>
      <footer className="container" style={{ paddingBottom: 40, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span className="muted">© 2026 Emin Khateeb</span>
        <span className="muted">Built for teams that like lunch and speed.</span>
      </footer>
    </main>
  );
}
