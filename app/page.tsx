import Link from 'next/link';
import { ArrowRight, Check, Compass, MapPinned, Sparkles, Users, Vote } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge, Button, Card, Panel } from '@/components/ui';

const features = [
  { icon: Vote, title: 'Live voting that feels effortless', body: 'Votes sync in realtime, with polling fallback underneath so the board keeps moving when the network gets weird.' },
  { icon: MapPinned, title: 'Nearby places with less guesswork', body: 'Suggestions stay location-aware, making it easy to pull in real nearby spots instead of typing the same list again.' },
  { icon: Compass, title: 'Menu and map links built in', body: 'Each contender carries the next click with it, so the crew can sanity-check the choice without derailing the flow.' },
  { icon: Users, title: 'Friendly identity, no account wall', body: 'Names persist locally so everyone can read the room without turning lunch into a login ceremony.' },
  { icon: Sparkles, title: 'Daily rhythm, not daily setup', body: 'Same crew, fresh ballot, familiar patterns — ideal for teams that make this decision all the time.' },
  { icon: Check, title: 'History that actually helps', body: 'See repeat winners and recent trends, so the crew can break ties or spot the places everyone keeps coming back to.' },
];

const steps = [
  ['Start a room in seconds', 'Create a crew once, then keep reusing it with invite-based access that feels lightweight and social.'],
  ['Drop in contenders fast', 'Search nearby spots, add manual picks, and shape today’s shortlist without opening five other tabs.'],
  ['Let the winner emerge', 'Watch the board update live, then use history and leaderboard views to keep the ritual moving tomorrow too.'],
];

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const appHref = code ? `/app?code=${encodeURIComponent(code)}` : '/app';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-10">
        <nav className="relative flex flex-wrap items-center justify-between gap-4 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-3 backdrop-blur-xl">
          <div className="brand-orb left-6 top-1/2 h-12 w-12 -translate-y-1/2 bg-[rgba(255,209,102,0.24)]" />
          <div className="flex items-center gap-3">
            <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-[1.35rem] border border-white/40 bg-[linear-gradient(135deg,#ffd766,#ff8f66_52%,#6bb8ff)] text-xl shadow-[0_16px_30px_rgba(255,122,89,0.28)]">
              <span className="absolute inset-x-1 bottom-1 h-3 rounded-full bg-white/35 blur-sm" />
              🍔
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">LunchCrew</div>
              <div className="text-xs text-[var(--text-muted)]">A brighter lunch ritual for teams</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle className="rounded-full px-4" />
            <Link href={appHref}>
              <Button variant="secondary" className="rounded-full px-5">Open app</Button>
            </Link>
          </div>
        </nav>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        <div className="grid gap-6">
          <Card className="relative overflow-hidden p-8 sm:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,209,102,0.34),transparent_30%),radial-gradient(circle_at_78%_24%,rgba(255,122,89,0.26),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(117,212,139,0.18),transparent_24%)]" />
            <div className="brand-orb -left-6 top-16 h-24 w-24 bg-[rgba(255,209,102,0.26)]" />
            <div className="brand-orb right-12 top-10 h-16 w-16 bg-[rgba(255,122,89,0.22)]" />
            <div className="relative grid gap-7">
              <Badge>Invite-led crews · nearby search · live voting</Badge>
              <div className="grid gap-4">
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-[var(--text)] sm:text-6xl lg:text-7xl">Make lunch feel like a quick group win, not admin.</h1>
                <p className="max-w-2xl text-lg leading-8 text-[var(--text-soft)] sm:text-xl">LunchCrew gives your team one cheerful place to shortlist nearby options, vote together, and move on with the day — without chat-scroll chaos or spreadsheet energy.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={appHref}><Button className="rounded-full px-6">Start today’s vote <ArrowRight className="h-4 w-4" /></Button></Link>
                <a href="#features"><Button variant="secondary" className="rounded-full px-6">See what it includes</Button></a>
              </div>
              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                {['A shared crew room you can keep using', 'Built-in nearby, maps, and menu shortcuts', 'Warm, focused UI in both light and dark'].map((item) => (
                  <Panel key={item} className="px-4 py-4 text-sm text-[var(--text-soft)]">{item}</Panel>
                ))}
              </div>
            </div>
          </Card>

          <section className="grid gap-4 md:grid-cols-3">
            {steps.map(([title, body], index) => (
              <Card key={title} className="relative overflow-hidden p-6">
                <div className="brand-orb right-0 top-0 h-16 w-16 bg-[rgba(255,209,102,0.14)]" />
                <div className="relative grid gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(255,209,102,0.2),rgba(255,122,89,0.16))] text-sm font-semibold text-[var(--text)]">0{index + 1}</div>
                  <div className="grid gap-2">
                    <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
                    <p className="text-sm leading-7 text-[var(--text-muted)]">{body}</p>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        </div>

        <Card className="relative overflow-hidden p-6 sm:p-8 lg:sticky lg:top-6 lg:h-fit">
          <div className="absolute inset-x-6 top-10 h-px brand-dash" />
          <div className="grid gap-5">
            <div className="flex items-center justify-between">
              <Badge className="border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-100">Today’s board</Badge>
              <span className="text-sm text-[var(--text-muted)]">Feels live</span>
            </div>
            <div className="grid gap-4">
              {[
                ['Tacos del Centro', '8 votes · leader', 'Map · Menu'],
                ['Noodle House', '5 votes', 'Map'],
                ['Green Bowl', '3 votes', 'Menu'],
              ].map(([name, votes, meta], index) => (
                <Panel key={name} className={`grid gap-3 p-4 ${index === 0 ? 'border-[rgba(255,122,89,0.28)] bg-[rgba(255,122,89,0.12)]' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-[var(--text)]">{name}</div>
                      <div className="mt-1 text-sm text-[var(--text-muted)]">{votes}</div>
                    </div>
                    <div className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-soft)]">{index === 0 ? 'Winning' : 'Open vote'}</div>
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{meta}</div>
                </Panel>
              ))}
            </div>
            <Panel className="p-4">
              <div className="text-sm font-medium text-[var(--text)]">Made for the everyday lunch moment</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">The landing page sets the tone. The app then turns into a playful, efficient decision surface instead of another productivity dashboard.</p>
            </Panel>
          </div>
        </Card>
      </section>

      <section id="features" className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="relative overflow-hidden p-6">
            <div className="brand-orb -right-4 -top-4 h-20 w-20 bg-[rgba(107,184,255,0.14)]" />
            <div className="relative grid gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(255,209,102,0.22),rgba(255,122,89,0.14))] text-[var(--accent)]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="grid gap-2">
                <h3 className="text-xl font-semibold text-[var(--text)]">{title}</h3>
                <p className="text-sm leading-7 text-[var(--text-muted)]">{body}</p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="mt-14 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6 sm:p-8">
          <div className="grid gap-5">
            <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-100">Why teams keep it around</Badge>
            {[
              ['Less back-and-forth, more momentum', 'The shared board makes the leader visible fast, so the crew can stop negotiating in fragments.'],
              ['The useful links are already there', 'Maps and menu shortcuts sit next to each place, which keeps research tiny and decisions easy.'],
              ['It feels casual in the right way', 'Invite access and saved names make it repeatable without turning lunch into another IT-managed tool.'],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow-soft)]">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                <div>
                  <div className="text-base font-semibold text-[var(--text)]">{title}</div>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="relative flex items-center justify-center overflow-hidden p-8 text-center sm:p-12">
          <div className="absolute inset-x-10 top-10 h-px brand-dash" />
          <div className="grid max-w-2xl gap-5">
            <Badge>Focused product workspace</Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">A consumer-friendly front door. A sharp app when it’s time to choose.</h2>
            <p className="text-base leading-8 text-[var(--text-soft)] sm:text-lg">Open the app when the crew is hungry. Everything inside stays tuned for voting, adding contenders, sharing access, and checking patterns — just with more warmth, color, and personality than a typical internal tool.</p>
            <div>
              <Link href={appHref}><Button className="rounded-full px-6">Open LunchCrew <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
