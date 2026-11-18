import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ComicForgeProvider } from '@/components/providers/comicforge-provider';
import { AppShell } from '@/components/layout/app-shell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AFFIE TECH ComicForge AI — Create Stories. Design Characters. Generate Comic Prompts.',
  description:
    'AI comic story, character studio, and structured image-prompt creation platform for ChatGPT Images and Google Gemini.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ComicForgeProvider>
          <AppShell>{children}</AppShell>
        </ComicForgeProvider>
      </body>
    </html>
  );
}
