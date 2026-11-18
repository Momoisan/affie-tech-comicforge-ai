'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Cpu,
  FolderKanban,
  Languages,
  LayoutDashboard,
  Library,
  Menu,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useComicForge } from '@/components/providers/comicforge-provider';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, preferences, updatePreferences, engineStatus, toasts, dismissToast } =
    useComicForge();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/creator', label: t.nav.creator, icon: Sparkles },
    { href: '/characters', label: t.nav.characters, icon: Users },
    { href: '/prompts', label: t.nav.prompts, icon: BookOpen },
    { href: '/projects', label: t.nav.projects, icon: FolderKanban },
    { href: '/settings', label: t.nav.settings, icon: Settings },
  ];

  const toggleLang = () => {
    updatePreferences({
      uiLanguage: preferences.uiLanguage === 'ms-MY' ? 'en' : 'ms-MY',
    });
  };

  const toggleTheme = () => {
    updatePreferences({
      theme: preferences.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <div className="min-h-screen flex bg-[var(--cf-bg)] text-[var(--cf-text)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-68 lg:flex-col border-r border-[var(--cf-border)] bg-[var(--cf-surface)]/80 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-5 border-b border-[var(--cf-border)]">
          <Link href="/" className="block group">
            <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#00D9FF]">
              {t.brand.name}
            </div>
            <div className="text-xl font-extrabold tracking-tight text-[var(--cf-text)] group-hover:text-[#6366F1] transition-colors">
              {t.brand.appName}
            </div>
            <p className="text-xs text-[var(--cf-muted)] mt-1 leading-snug">
              {t.brand.tagline}
            </p>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-[#6366F1]/18 text-[var(--cf-text)] border border-[#FACC15]/70 shadow-sm'
                    : 'text-[var(--cf-muted)] hover:text-[var(--cf-text)] hover:bg-[var(--cf-surface-2)]'
                )}
              >
                <Icon
                  className={cn('w-4 h-4', active ? 'text-[#FACC15]' : 'text-[#00D9FF]')}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Engine Status Footer */}
        <div className="p-4 border-t border-[var(--cf-border)] space-y-2">
          <div className="rounded-xl bg-[var(--cf-surface-2)] p-3 border border-[var(--cf-border)]">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[var(--cf-text)]">
                <Cpu className="w-3.5 h-3.5 text-[#00D9FF]" />
                {t.dashboard.engineStatus}
              </span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                V1.0
              </span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-[var(--cf-muted)]">
              <div className="flex justify-between">
                <span>Gemini API</span>
                <span className={engineStatus?.geminiConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                  {engineStatus?.geminiConfigured ? 'Ready' : 'Not Configured'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Local Engine</span>
                <span className="text-emerald-400">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[var(--cf-surface)] border-r border-[var(--cf-border)] flex flex-col h-full">
            <div className="p-4 border-b border-[var(--cf-border)] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#00D9FF]">
                  {t.brand.name}
                </div>
                <div className="text-lg font-extrabold">{t.brand.appName}</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--cf-surface-2)]"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium',
                      active
                        ? 'bg-[#6366F1]/20 border border-[#FACC15]/70 text-[var(--cf-text)]'
                        : 'text-[var(--cf-muted)] hover:bg-[var(--cf-surface-2)]'
                    )}
                  >
                    <Icon className="w-4 h-4 text-[#00D9FF]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-[var(--cf-border)] bg-[var(--cf-bg)]/85 backdrop-blur-md">
          <div className="px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)]"
                aria-label="Open navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--cf-muted)]">
                <Library className="w-3.5 h-3.5 text-[#00D9FF]" />
                <span>{t.brand.noticeNoInternalImages}</span>
              </div>
              <div className="sm:hidden font-bold text-sm">{t.brand.appName}</div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleLang}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-xs font-semibold hover:border-[#00D9FF]/60 cursor-pointer"
                title="Switch Language (BM / EN)"
              >
                <Languages className="w-3.5 h-3.5 text-[#00D9FF]" />
                <span>{preferences.uiLanguage === 'ms-MY' ? 'BM' : 'EN'}</span>
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[#00D9FF]/60 cursor-pointer"
                aria-label="Toggle theme"
              >
                {preferences.theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#FACC15]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#6366F1]" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Toast Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-md',
              toast.variant === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-100'
                : toast.variant === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
                  : 'bg-[var(--cf-surface)] border-[#00D9FF]/40 text-[var(--cf-text)]'
            )}
          >
            <span>{toast.title}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="opacity-70 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
