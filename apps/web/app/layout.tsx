'use client';

import './globals.css';
import { Providers } from './providers';
import { TrpcProvider } from './trpc-provider';
import { Toaster } from 'sonner';
import Nav from '@web/components/Nav';
import { useLayoutEffect } from 'react';
import { getAuthCode } from './utils';
import { useRouter } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  useLayoutEffect(() => {
    if (!getAuthCode()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <html lang="zh-cn">
      <head>
        <title>WeWe-RSS</title>
        <meta name="description" content="更好的公众号订阅方式" />
        <link rel="icon" href="https://r2-assets.111965.xyz/wewe-rss.png" />
      </head>

      <body>
        <Providers>
          <main className="h-screen overflow-hidden">
            <Nav></Nav>
            <div className="h-[calc(100vh-64px)] max-w-[1280px] mx-auto pb-6">
              <TrpcProvider>{children}</TrpcProvider>
            </div>
          </main>
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
