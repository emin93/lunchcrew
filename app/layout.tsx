import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LunchCrew — Smart lunch planning for teams',
  description: 'Realtime team lunch voting, nearby place suggestions, maps links, menu links, and persistent crew workspaces.',
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
      <body>{children}</body>
    </html>
  );
}
