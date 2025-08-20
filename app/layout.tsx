'use client';

import { useEffect } from 'react';
import PWAInstallBanner from '@/components/PWAInstallBanner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isSecure =
      typeof window !== 'undefined' &&
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

    if ('serviceWorker' in navigator && isSecure) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(console.error);
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {children}
        {/* Show ONE banner, globally */}
        <PWAInstallBanner />
      </body>
    </html>
  );
}