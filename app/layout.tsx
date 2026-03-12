import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LunchCrew — Modern team lunch voting',
  description: 'Realtime team lunch voting with nearby place suggestions, invite links, maps, menus, history, and crew settings.',
  openGraph: {
    title: 'LunchCrew',
    description: 'Decide lunch in minutes, not message threads.',
    type: 'website',
    url: 'https://lunchcrew.app',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="relative isolate overflow-x-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-96 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.14),transparent_55%)]" />
          {children}
        </div>
      </body>
    </html>
  );
}
