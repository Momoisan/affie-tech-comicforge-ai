'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Cpu,
  ExternalLink,
  FolderKanban,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import { useComicForge } from '@/components/providers/comicforge-provider';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { formatDateShort } from '@/lib/utils';

export default function DashboardPage() {
  const { t, projects, characters, prompts, engineStatus, preferences, hydrated } =
    useComicForge();

  const activeProjects = projects.filter((p) => p.status !== 'archived').slice(0, 4);
  const activeCharacters = characters.filter((c) => c.status !== 'archived').slice(0, 4);
  const recentPrompts = prompts.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Hero / Welcome */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#6366F1]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#00D9FF]/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan">AFFIE TECH ComicForge AI V1.0</Badge>
              <Badge variant="indigo">
                {preferences.uiLanguage === 'ms-MY' ? 'Bahasa Melayu Malaysia' : 'English'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t.dashboard.welcomeTitle}
            </h1>
            <p className="text-sm sm:text-base text-[var(--cf-muted)] leading-relaxed">
              {t.dashboard.welcomeSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/creator">
                <Button size="lg">
                  <Sparkles className="w-4 h-4" />
                  {t.actions.createComic}
                </Button>
              </Link>
              <Link href="/characters">
                <Button variant="secondary" size="lg">
                  <Users className="w-4 h-4 text-[#00D9FF]" />
                  {t.actions.createCharacter}
                </Button>
              </Link>
            </div>
          </div>

          {/* Engine Status Card */}
          <Card className="lg:w-80 shrink-0 bg-[var(--cf-surface-2)]/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--cf-muted)] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#00D9FF]" />
                {t.dashboard.engineStatus}
              </span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[var(--cf-border)]">
                <span className="text-[var(--cf-muted)]">Engine A (Gemini API)</span>
                <span
                  className={
                    engineStatus?.geminiConfigured
                      ? 'font-semibold text-emerald-400'
                      : 'font-semibold text-amber-400'
                  }
                >
                  {engineStatus?.geminiConfigured
                    ? `Ready (${engineStatus.geminiModel})`
                    : 'Not Configured'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[var(--cf-border)]">
                <span className="text-[var(--cf-muted)]">Engine B (Local Engine)</span>
                <span className="font-semibold text-emerald-400">Ready (Offline-Safe)</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[var(--cf-muted)]">Storage</span>
                <span className="font-semibold text-[#00D9FF]">
                  {engineStatus?.supabaseConfigured ? 'Supabase Cloud' : 'Local Browser'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Stats + Quick Lists */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Recent Projects */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#6366F1]" />
              {t.dashboard.recentProjects}
            </h2>
            <Link href="/projects" className="text-xs text-[#00D9FF] hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!hydrated ? (
            <div className="h-24 rounded-xl bg-[var(--cf-surface-2)] animate-pulse" />
          ) : activeProjects.length === 0 ? (
            <p className="text-xs text-[var(--cf-muted)] py-4">{t.dashboard.emptyProjects}</p>
          ) : (
            <ul className="space-y-2">
              {activeProjects.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl bg-[var(--cf-surface-2)] p-3 border border-[var(--cf-border)] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{p.title}</div>
                    <div className="text-[11px] text-[var(--cf-muted)] truncate">
                      {p.genre} · {p.artStyle}
                    </div>
                  </div>
                  <Link href={`/creator?projectId=${encodeURIComponent(p.id)}`}>
                    <Button size="sm" variant="outline">
                      {t.actions.edit}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Saved Characters */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00D9FF]" />
              {t.dashboard.savedCharacters}
            </h2>
            <Link href="/characters" className="text-xs text-[#00D9FF] hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!hydrated ? (
            <div className="h-24 rounded-xl bg-[var(--cf-surface-2)] animate-pulse" />
          ) : activeCharacters.length === 0 ? (
            <p className="text-xs text-[var(--cf-muted)] py-4">{t.dashboard.emptyCharacters}</p>
          ) : (
            <ul className="space-y-2">
              {activeCharacters.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl bg-[var(--cf-surface-2)] p-3 border border-[var(--cf-border)] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {c.name}{' '}
                      <span className="text-[11px] text-[#00D9FF]">({c.characterCode})</span>
                    </div>
                    <div className="text-[11px] text-[var(--cf-muted)] truncate">
                      {c.role} · {c.visualStyle}
                    </div>
                  </div>
                  <Badge variant="indigo">v{c.version}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent Generated Prompts */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#FACC15]" />
              {t.dashboard.recentPrompts}
            </h2>
            <Link href="/prompts" className="text-xs text-[#00D9FF] hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!hydrated ? (
            <div className="h-24 rounded-xl bg-[var(--cf-surface-2)] animate-pulse" />
          ) : recentPrompts.length === 0 ? (
            <p className="text-xs text-[var(--cf-muted)] py-4">{t.dashboard.emptyPrompts}</p>
          ) : (
            <ul className="space-y-2">
              {recentPrompts.map((pr) => (
                <li
                  key={pr.id}
                  className="rounded-xl bg-[var(--cf-surface-2)] p-3 border border-[var(--cf-border)] space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">
                      {pr.projectTitle || pr.characterName || pr.promptType}
                    </span>
                    <Badge variant={pr.engineUsed === 'gemini' ? 'indigo' : 'cyan'}>
                      {pr.engineUsed === 'gemini' ? 'Gemini' : 'Local'}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-[var(--cf-muted)]">
                    {formatDateShort(pr.createdAt, preferences.uiLanguage)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Quick Start 10-Step External Image Workflow */}
      <section className="glass-card rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-[#FACC15]" />
              {t.dashboard.quickStartTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--cf-muted)] mt-1">
              {t.dashboard.quickStartSubtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href="https://chatgpt.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-xs font-semibold hover:border-[#00D9FF]/60"
            >
              {t.actions.openChatGPT}
              <ExternalLink className="w-3.5 h-3.5 text-[#00D9FF]" />
            </a>
            <a
              href="https://gemini.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-xs font-semibold hover:border-[#00D9FF]/60"
            >
              {t.actions.openGemini}
              <ExternalLink className="w-3.5 h-3.5 text-[#6366F1]" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {t.dashboard.workflowSteps.map((step) => (
            <div
              key={step.title}
              className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)]/70 p-3.5 space-y-1.5"
            >
              <div className="text-xs font-bold text-[#00D9FF]">{step.title}</div>
              <p className="text-xs text-[var(--cf-muted)] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
