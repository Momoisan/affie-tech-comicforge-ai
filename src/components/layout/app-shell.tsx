'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Cpu,
  FolderKanban,
  Globe2,
  Languages,
  LayoutDashboard,
  Library,
  Menu,
  Moon,
  PackageCheck,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const drawerRef = React.useRef<HTMLElement>(null);
  const closeDrawerBtnRef = React.useRef<HTMLButtonElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeDrawerBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [mobileOpen]);

  const navItems = [
    { href: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/creator', label: t.nav.creator, icon: Sparkles },
    { href: '/characters', label: t.nav.characters, icon: Users },
    { href: '/story-bible', label: t.nav.storyBible, icon: Globe2 },
    { href: '/director', label: t.nav.director, icon: Clapperboard },
    { href: '/package-studio', label: t.nav.packageStudio, icon: PackageCheck },
    { href: '/projects', label: t.nav.projects, icon: FolderKanban },
    { href: '/settings', label: t.nav.settings, icon: Settings },
  ];

  const mobileBottomItems = [
    { href: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/creator', label: t.nav.creator, icon: Sparkles },
    { href: '/story-bible', label: t.nav.storyBible, icon: Globe2 },
    { href: '/director', label: t.nav.director, icon: Clapperboard },
    { href: '/package-studio', label: t.nav.packageStudio, icon: PackageCheck },
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
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col border-r border-[var(--cf-border)] bg-[var(--cf-surface)]/80 backdrop-blur-xl sticky top-0 h-screen transition-all duration-200',
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-68'
        )}
      >
        <div className="p-4 border-b border-[var(--cf-border)] flex items-center justify-between gap-2">
          {!sidebarCollapsed && (
            <Link href="/" className="block group min-w-0">
              <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#00D9FF]">
                {t.brand.name}
              </div>
              <div className="text-xl font-extrabold tracking-tight text-[var(--cf-text)] group-hover:text-[#6366F1] transition-colors truncate">
                {t.brand.appName}
              </div>
              <p className="text-xs text-[var(--cf-muted)] mt-1 leading-snug line-clamp-2">
                {t.brand.tagline}
              </p>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="p-2 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface-2)] hover:border-[#00D9FF]/60 shrink-0 cursor-pointer"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[#00D9FF]" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-[#00D9FF]" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all',
                  sidebarCollapsed && 'justify-center px-2',
                  active
                    ? 'bg-[#6366F1]/18 text-[var(--cf-text)] border border-[#FACC15]/70 shadow-sm'
                    : 'text-[var(--cf-muted)] hover:text-[var(--cf-text)] hover:bg-[var(--cf-surface-2)]'
                )}
              >
                <Icon
                  className={cn('w-4 h-4 shrink-0', active ? 'text-[#FACC15]' : 'text-[#00D9FF]')}
                />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
          {!sidebarCollapsed && (
            <Link
              href="/prompts"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all mt-2',
                pathname === '/prompts'
                  ? 'bg-[#6366F1]/18 text-[var(--cf-text)] border border-[#FACC15]/70'
                  : 'text-[var(--cf-muted)] hover:text-[var(--cf-text)] hover:bg-[var(--cf-surface-2)]'
              )}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>{t.nav.prompts}</span>
            </Link>
          )}
        </nav>

        {/* Engine Status Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-[var(--cf-border)] space-y-2">
            <div className="rounded-xl bg-[var(--cf-surface-2)] p-3 border border-[var(--cf-border)]">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-[var(--cf-text)]">
                  <Cpu className="w-3.5 h-3.5 text-[#00D9FF]" />
                  {t.dashboard.engineStatus}
                </span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                  V2.0
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
        )}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            ref={drawerRef}
            className="relative z-10 w-72 max-w-[85vw] bg-[var(--cf-surface)] border-r border-[var(--cf-border)] flex flex-col h-full"
          >
            <div className="p-4 border-b border-[var(--cf-border)] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#00D9FF]">
                  {t.brand.name}
                </div>
                <div className="text-lg font-extrabold">{t.brand.appName} V2.0</div>
              </div>
              <button
                ref={closeDrawerBtnRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[var(--cf-surface-2)] focus-visible:outline-2 focus-visible:outline-[#00D9FF]"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Mobile Drawer Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href === '/story-bible' && pathname === '/story-universe');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium',
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
              <Link
                href="/prompts"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium',
                  pathname === '/prompts'
                    ? 'bg-[#6366F1]/20 border border-[#FACC15]/70 text-[var(--cf-text)]'
                    : 'text-[var(--cf-muted)] hover:bg-[var(--cf-surface-2)]'
                )}
              >
                <BookOpen className="w-4 h-4 text-[#00D9FF]" />
                <span>{t.nav.prompts}</span>
              </Link>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0" aria-hidden={mobileOpen || undefined}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-[var(--cf-border)] bg-[var(--cf-bg)]/85 backdrop-blur-md">
          <div className="px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)]"
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
                className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-0 sm:h-9 px-3 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-xs font-semibold hover:border-[#00D9FF]/60 cursor-pointer"
                title="Switch Language (BM / EN)"
              >
                <Languages className="w-3.5 h-3.5 text-[#00D9FF]" />
                <span>{preferences.uiLanguage === 'ms-MY' ? 'BM' : 'EN'}</span>
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-9 sm:h-9 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] hover:border-[#00D9FF]/60 cursor-pointer"
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          aria-label="Mobile Quick Navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--cf-border)] bg-[var(--cf-surface)]/95 backdrop-blur-lg flex items-center justify-around px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
        >
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1 rounded-lg text-[10px] font-medium transition-colors',
                  active ? 'text-[#FACC15]' : 'text-[var(--cf-muted)] hover:text-[var(--cf-text)]'
                )}
              >
                <Icon className={cn('w-4 h-4 mb-0.5', active ? 'text-[#FACC15]' : 'text-[#00D9FF]')} />
                <span className="truncate max-w-[64px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
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
