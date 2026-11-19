import type { Metadata, Viewport } from 'next';
import {
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from 'next/font/google';
import './globals.css';
import { ComicForgeProvider } from '@/components/providers/comicforge-provider';
import { AppShell } from '@/components/layout/app-shell';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#040712' },
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
  ],
};

export const metadata: Metadata = {
  title: 'AFFIE TECH ComicForge AI — From Imagination to Comic Creation.',
  description:
    'AI comic story, character studio, world lore, panel director, and structured image-prompt creation platform for ChatGPT Images and Google Gemini.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" className="dark" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ComicForgeProvider>
          <AppShell>{children}</AppShell>
        </ComicForgeProvider>
      </body>
    </html>
  );
}
