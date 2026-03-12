import Link from 'next/link';
import { ArrowRight, Check, Compass, MapPinned, Sparkles, Users, Vote } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge, Button, Card, Panel } from '@/components/ui';

const features = [
  { icon: Vote, title: 'Realtime voting', body: 'Votes sync live across devices with polling fallback when realtime drops.' },
  { icon: MapPinned, title: 'Nearby place suggestions', body: 'Google Places autocomplete and details stay location-aware through the existing Supabase proxy pattern.' },
  { icon: Compass, title: 'Maps and menu links', body: 'Jump straight into directions or menu research from every option card.' },
  { icon: Users, title: 'Identity without auth drag', body: 'Display names persist locally so the crew can read votes without a login wall.' },
  { icon: Sparkles, title: 'Daily carry-forward polls', body: 'Fresh votes every day, same crew workspace, with prior options rolled ahead automatically.' },
  { icon: Check, title: 'History and leaderboard', body: 'See winners over the last week or month and spot the crew’s repeat favorites.' },
];

const steps = [
  ['Create or join your crew', 'Open the app, create a workspace, or restore/join using an invite code.'],
  ['Add contenders fast', 'Use nearby place suggestions or type a restaurant manually and publish it to the ballot.'],
  ['Vote and review patterns', 'Watch the board update in realtime, then use history and leaderboard views to see repeat winners.'],
];

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const appHref = code ? `/app?code=${encodeURIComponent(code)}` : '/app';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-10">
        <nav className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/12 text-xl">🍽️</div>
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">LunchCrew</div>
              <div className="text-xs text-[var(--text-muted)]">A calmer lunch workflow for teams</div>
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(110,231,183,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.15),transparent_30%)]" />
            <div className="relative grid gap-7">
              <Badge>Invite-led crews · nearby search · live voting</Badge>
              <div className="grid gap-4">
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-[var(--text)] sm:text-6xl lg:text-7xl">Stop turning lunch into a project.</h1>
                <p className="max-w-2xl text-lg leading-8 text-[var(--text-soft)] sm:text-xl">Create one shared lunch room, shortlist nearby spots, and let the crew decide quickly without group-chat chaos, spreadsheet sprawl, or re-explaining the plan every day.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={appHref}><Button className="rounded-full px-6">Launch LunchCrew <ArrowRight className="h-4 w-4" /></Button></Link>
                <a href="#features"><Button variant="secondary" className="rounded-full px-6">See the product</Button></a>
              </div>
              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                {['Create, join, or restore instantly', 'Realtime updates with fallback polling', 'Maps, menus, history, and leaderboard'].map((item) => (
                  <Panel key={item} className="px-4 py-4 text-sm text-[var(--text-soft)]">{item}</Panel>
                ))}
              </div>
            </div>
          </Card>

          <section className="grid gap-4 md:grid-cols-3">
            {steps.map(([title, body], index) => (
              <Card key={title} className="p-6">
                <div className="grid gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface)] text-sm font-semibold text-[var(--text)]">0{index + 1}</div>
                  <div className="grid gap-2">
                    <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
                    <p className="text-sm leading-7 text-[var(--text-muted)]">{body}</p>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        </div>

        <Card className="p-6 sm:p-8 lg:sticky lg:top-6 lg:h-fit">
          <div className="grid gap-5">
            <div className="flex items-center justify-between">
              <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-100">Today’s board</Badge>
              <span className="text-sm text-[var(--text-muted)]">Realtime</span>
            </div>
            <div className="grid gap-4">
              {[
                ['Tacos del Centro', '8 votes · leader', 'Maps · Menu'],
                ['Noodle House', '5 votes', 'Maps'],
                ['Green Bowl', '3 votes', 'Menu'],
              ].map(([name, votes, meta], index) => (
                <Panel key={name} className={`grid gap-3 p-4 ${index === 0 ? 'border-emerald-500/25 bg-emerald-500/10' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-[var(--text)]">{name}</div>
                      <div className="mt-1 text-sm text-[var(--text-muted)]">{votes}</div>
                    </div>
                    <div className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-soft)]">{index === 0 ? 'Front runner' : 'Open vote'}</div>
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{meta}</div>
                </Panel>
              ))}
            </div>
            <Panel className="p-4">
              <div className="text-sm font-medium text-[var(--text)]">Built for fast team decisions</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">The marketing page stays editorial and high-level. The app itself shifts into a focused working surface once you open it.</p>
            </Panel>
          </div>
        </Card>
      </section>

      <section id="features" className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="p-6">
            <div className="grid gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--accent)]">
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
            <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-100">Why crews keep it</Badge>
            {[
              ['Fewer messages, clearer momentum', 'A shared board replaces the back-and-forth of “anything sounds good?” and makes the current leader obvious.'],
              ['Useful context where it matters', 'Maps and menu links sit next to each option so nobody has to leave the flow to do basic research.'],
              ['Daily use without daily friction', 'Restoreable invite access means the same team can keep showing up without new accounts or admin overhead.'],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-4 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-4">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                <div>
                  <div className="text-base font-semibold text-[var(--text)]">{title}</div>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex items-center justify-center p-8 text-center sm:p-12">
          <div className="grid max-w-2xl gap-5">
            <Badge>Focused product workspace</Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">The site explains the ritual. The app runs it.</h2>
            <p className="text-base leading-8 text-[var(--text-soft)] sm:text-lg">Open the app when it’s time to decide. Everything there is tuned for voting, adding contenders, sharing access, and reviewing patterns — not selling the concept all over again.</p>
            <div>
              <Link href={appHref}><Button className="rounded-full px-6">Start the next vote <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
