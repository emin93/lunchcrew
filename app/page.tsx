import Link from 'next/link';
import { ArrowRight, Check, Compass, MapPinned, Sparkles, Users, Vote } from 'lucide-react';
import { Badge, Button, Card, Panel } from '@/components/ui';

const features = [
  { icon: Vote, title: 'Realtime voting', body: 'Votes sync live across devices with polling fallback when realtime drops.' },
  { icon: MapPinned, title: 'Nearby place suggestions', body: 'Google Places autocomplete and details stay location-aware through the existing Supabase proxy pattern.' },
  { icon: Compass, title: 'Maps and menu links', body: 'Jump straight into directions or menu research from every option card.' },
  { icon: Users, title: 'Identity without auth drag', body: 'Display names persist locally so the crew can read votes without a login wall.' },
  { icon: Sparkles, title: 'Daily carry-forward polls', body: 'Fresh votes every day, same crew workspace, with prior options rolled ahead automatically.' },
  { icon: Check, title: 'History and leaderboard', body: 'See winners over the last week or month and spot the crew’s repeat favorites.' },
];

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const appHref = code ? `/app?code=${encodeURIComponent(code)}` : '/app';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <header className="mb-8">
        <nav className="flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/6 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300/15 text-xl">🍽️</div>
            <div>
              <div className="text-sm font-semibold text-white">LunchCrew</div>
              <div className="text-xs text-slate-400">A new, calmer lunch workflow for teams</div>
            </div>
          </div>
          <Link href={appHref}>
            <Button variant="secondary" className="rounded-full px-5">Open app</Button>
          </Link>
        </nav>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        <Card className="relative overflow-hidden p-8 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(110,231,183,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.12),transparent_32%)]" />
          <div className="relative grid gap-6">
            <Badge>Live on the web · invite-led crews · smart place search</Badge>
            <div className="grid gap-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">Stop turning lunch into a project.</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">Create a crew, share one code, shortlist nearby spots, and let everyone vote in realtime. Modern, fast, and built for the daily lunch ritual instead of message-thread chaos.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={appHref}><Button className="rounded-full px-6">Launch LunchCrew <ArrowRight className="h-4 w-4" /></Button></Link>
              <a href="#features"><Button variant="secondary" className="rounded-full px-6">See what’s inside</Button></a>
            </div>
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {['Invite-code join/create/restore', 'Realtime + polling fallback', 'Maps, menus, history, leaderboard'].map((item) => (
                <Panel key={item} className="px-4 py-4 text-sm text-slate-200">{item}</Panel>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="grid gap-5">
            <div className="flex items-center justify-between">
              <Badge className="border-sky-300/20 bg-sky-300/10 text-sky-100">Today’s board</Badge>
              <span className="text-sm text-slate-400">Realtime</span>
            </div>
            <div className="grid gap-4">
              {[
                ['Tacos del Centro', '8 votes · leader', 'Maps · Menu'],
                ['Noodle House', '5 votes', 'Maps'],
                ['Green Bowl', '3 votes', 'Menu'],
              ].map(([name, votes, meta], index) => (
                <Panel key={name} className={`grid gap-3 p-4 ${index === 0 ? 'border-emerald-300/20 bg-emerald-300/10' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-white">{name}</div>
                      <div className="mt-1 text-sm text-slate-400">{votes}</div>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{index === 0 ? 'Front runner' : 'Open vote'}</div>
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{meta}</div>
                </Panel>
              ))}
            </div>
            <Panel className="p-4">
              <div className="text-sm font-medium text-white">Built for fast team decisions</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">LunchCrew keeps the current flow intact — create, join, restore, vote, add options, and look back — while making the interface feel current instead of utilitarian.</p>
            </Panel>
          </div>
        </Card>
      </section>

      <section id="features" className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="p-6">
            <div className="grid gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-emerald-200">
                <Icon className="h-5 w-5" />
              </div>
              <div className="grid gap-2">
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="text-sm leading-7 text-slate-400">{body}</p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6 sm:p-8">
          <div className="grid gap-5">
            <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-100">How it works</Badge>
            {[
              ['Create or join your crew', 'Open the app, create a workspace, or restore/join using an invite code.'],
              ['Add contenders fast', 'Use nearby place suggestions or type a restaurant manually and publish it to the ballot.'],
              ['Vote and review patterns', 'Watch the board update in realtime, then use history and leaderboard views to see repeat winners.'],
            ].map(([title, body], index) => (
              <div key={title} className="flex gap-4 rounded-3xl border border-white/8 bg-slate-950/35 p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/8 text-sm font-semibold text-white">0{index + 1}</div>
                <div>
                  <div className="text-base font-semibold text-white">{title}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex items-center justify-center p-8 text-center sm:p-12">
          <div className="grid max-w-2xl gap-5">
            <Badge>Unified Next.js experience</Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">Same functionality. Completely different feel.</h2>
            <p className="text-base leading-8 text-slate-300 sm:text-lg">The app flow stays intact, but the presentation shifts to polished surfaces, roomy spacing, cleaner hierarchy, stronger typography, and a component model that is much easier to extend.</p>
            <div>
              <Link href={appHref}><Button className="rounded-full px-6">Start the next vote <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
