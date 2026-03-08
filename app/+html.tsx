import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ backgroundColor: '#030712' }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#030712" />
        <ScrollViewStyleReset />
      </head>
      <body style={{ backgroundColor: '#030712', margin: 0 }}>{children}</body>
    </html>
  );
}
