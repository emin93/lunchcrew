import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ backgroundColor: '#030712' }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#030712" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#030712" />
        <meta name="color-scheme" content="dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <style>{`
          :root { color-scheme: dark; }
          html, body, #root {
            background: #030712 !important;
            min-height: 100%;
          }
          body {
            margin: 0;
            overscroll-behavior-y: none;
            -webkit-font-smoothing: antialiased;
          }
        `}</style>
        <ScrollViewStyleReset />
      </head>
      <body style={{ backgroundColor: '#030712', margin: 0 }}>{children}</body>
    </html>
  );
}
