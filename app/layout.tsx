import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://lunchcrew.app'),
  title: 'LunchCrew — Team lunch voting with some personality',
  description: 'A brighter way to shortlist nearby lunch spots, vote live, and keep the daily team lunch ritual moving.',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    title: 'LunchCrew',
    description: 'Decide lunch in minutes, not message threads.',
    type: 'website',
    url: 'https://lunchcrew.app',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'LunchCrew app icon' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="app-shell">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
