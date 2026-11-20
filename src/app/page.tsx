'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Cpu,
  ExternalLink,
  FolderKanban,
  Globe2,
  Play,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import { useComicForge } from '@/components/providers/comicforge-provider';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { formatDateShort } from '@/lib/utils';
import { getEffectiveSpecies } from '@/lib/ai/prompt-formatter';

type ProjectFilterTab = 'all' | 'drafts' | 'completed' | 'exported';

export default function DashboardPage() {
  const {
    t,
    projects,
    characters,
    worlds,
    prompts,
    engineStatus,
    preferences,
    hydrated,
  } = useComicForge();

  const isMs = preferences.uiLanguage === 'ms-MY';
  const [projectTab, setProjectTab] = useState<ProjectFilterTab>('all');

  const nonArchivedProjects = useMemo(
    () => projects.filter((p) => p.status !== 'archived'),
    [projects]
  );

  const latestProject = nonArchivedProjects[0] ?? null;

  const draftProjects = useMemo(
    () => nonArchivedProjects.filter((p) => p.status === 'draft' || p.status === 'in_progress'),
    [nonArchivedProjects]
  );

  const completedProjects = useMemo(
    () => nonArchivedProjects.filter((p) => p.status === 'completed'),
    [nonArchivedProjects]
  );

  const exportedProjects = useMemo(
    () => nonArchivedProjects.filter((p) => p.exportStatus === 'exported'),
    [nonArchivedProjects]
  );

  const visibleProjects = useMemo(() => {
    if (projectTab === 'drafts') return draftProjects.slice(0, 6);
    if (projectTab === 'completed') return completedProjects.slice(0, 6);
    if (projectTab === 'exported') return exportedProjects.slice(0, 6);
    return nonArchivedProjects.slice(0, 6);
  }, [projectTab, nonArchivedProjects, draftProjects, completedProjects, exportedProjects]);

  const activeCharacters = useMemo(
    () => characters.filter((c) => c.status !== 'archived').slice(0, 4),
    [characters]
  );
  const recentUniverses = useMemo(() => worlds.slice(0, 4), [worlds]);
  const recentPrompts = useMemo(() => prompts.slice(0, 4), [prompts]);

  return (
    <div className="space-y-8">
      {/* Hero / Comic Creator Home Header */}
      <section className="glass-card halftone-bg rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#6366F1]/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#00D9FF]/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block -skew-x-6 bg-[#FACC15] text-[#090D1A] px-3 py-0.5 text-xs font-black uppercase tracking-wider border-2 border-[#090D1A]">
                PHASE 2B · COMIC STUDIO
              </span>
              <Badge variant="cyan">AFFIE TECH ComicForge AI</Badge>
              <Badge variant="indigo">
                {isMs ? 'Bahasa Melayu Malaysia' : 'English'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">
              {t.dashboard.welcomeTitle}
            </h1>
            <p className="text-sm sm:text-base text-[var(--cf-muted)] leading-relaxed">
              {t.dashboard.welcomeSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/creator">
                <Button size="lg">
                  <Sparkles className="w-4 h-4" />
                  {isMs ? 'Cipta Komik Baharu' : 'Create New Comic'}
                </Button>
              </Link>
              {latestProject ? (
                <Link href={`/creator?projectId=${encodeURIComponent(latestProject.id)}`}>
                  <Button variant="secondary" size="lg">
                    <Play className="w-4 h-4 text-[#FACC15]" />
                    {isMs ? 'Sambung Projek' : 'Continue Project'}
                  </Button>
                </Link>
              ) : (
                <Link href="/characters">
                  <Button variant="secondary" size="lg">
                    <Users className="w-4 h-4 text-[#00D9FF]" />
                    {t.actions.createCharacter}
                  </Button>
                </Link>
              )}
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

      {/* My Comic Projects + Filter Tabs (Draft Pages, Completed, Exported) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-[#6366F1]" />
            <h2 className="text-lg font-extrabold tracking-tight">
              {isMs ? 'Projek Komik Saya' : 'My Comic Projects'}
            </h2>
            <Badge variant="indigo">{nonArchivedProjects.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['all', isMs ? 'Semua Projek' : 'My Comic Projects', nonArchivedProjects.length],
                ['drafts', isMs ? 'Halaman Draf' : 'Draft Pages', draftProjects.length],
                ['completed', isMs ? 'Komik Siap' : 'Completed Comics', completedProjects.length],
                ['exported', isMs ? 'Komik Dieksport' : 'Exported Comics', exportedProjects.length],
              ] as const
            ).map(([tabKey, tabLabel, count]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setProjectTab(tabKey)}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  projectTab === tabKey
                    ? 'border-[#FACC15] bg-[#6366F1]/25 text-[#FACC15]'
                    : 'border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-muted)] hover:text-[var(--cf-text)]'
                }`}
              >
                {tabLabel} ({count})
              </button>
            ))}
          </div>
        </div>

        {!hydrated ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-44 rounded-2xl bg-[var(--cf-surface-2)] animate-pulse" />
            <div className="h-44 rounded-2xl bg-[var(--cf-surface-2)] animate-pulse" />
          </div>
        ) : visibleProjects.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <p className="text-sm text-[var(--cf-muted)]">
              {projectTab === 'all'
                ? t.dashboard.emptyProjects
                : isMs
                  ? 'Tiada projek dalam kategori ini lagi.'
                  : 'No projects in this category yet.'}
            </p>
            <Link href="/creator">
              <Button size="sm">
                <Sparkles className="w-3.5 h-3.5" />
                {isMs ? 'Cipta Komik Baharu' : 'Create New Comic'}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleProjects.map((p) => {
              const plannedPages = p.totalPages ?? p.episodeCount * p.scenesPerEpisode;
              const currentEp = p.currentEpisode ?? 1;
              return (
                <Card key={p.id} className="comic-hover flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {p.coverThumbnailUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded cover data/storage URL */}
                          <img
                            src={p.coverThumbnailUrl}
                            alt={p.title}
                            loading="lazy"
                            className="w-16 h-20 rounded-xl object-cover border border-[var(--cf-border)] shrink-0"
                          />
                        </>
                      ) : (
                        <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-[#6366F1]/25 to-[#00D9FF]/15 border border-[var(--cf-border)] flex flex-col items-center justify-center text-center p-1 shrink-0">
                          <span className="text-[10px] font-black uppercase text-[#00D9FF] leading-tight">
                            {p.genre.slice(0, 8)}
                          </span>
                          <span className="text-[9px] text-[var(--cf-muted)] mt-0.5">
                            {p.aspectRatio}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-base truncate">{p.title}</h3>
                          <Badge
                            variant={
                              p.status === 'completed'
                                ? 'success'
                                : p.status === 'in_progress'
                                  ? 'cyan'
                                  : 'yellow'
                            }
                          >
                            {p.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-[var(--cf-muted)] truncate">
                          {p.genre} · {p.artStyle}
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-[var(--cf-muted)]">
                          <span>
                            Ep {currentEp}/{p.episodeCount}
                          </span>
                          <span>·</span>
                          <span>{plannedPages} pages</span>
                          {p.exportStatus === 'exported' && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-400 font-semibold">Exported</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--cf-border)]">
                    <span className="text-[11px] text-[var(--cf-muted)]">
                      {formatDateShort(p.updatedAt, preferences.uiLanguage)}
                    </span>
                    <Link href={`/creator?projectId=${encodeURIComponent(p.id)}`}>
                      <Button size="sm" variant="secondary">
                        <Play className="w-3.5 h-3.5 text-[#FACC15]" />
                        {isMs ? 'Sambung Projek' : 'Continue Project'}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Lightweight Comic Showcase Marquee (Read-only inspiration, does not alter user projects) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block -skew-x-6 bg-[#00D9FF] text-[#090D1A] px-2.5 py-0.5 text-[11px] font-black uppercase border-2 border-[#090D1A]">
              {isMs ? 'GALERI INSPIRASI' : 'SHOWCASE'}
            </span>
            <span className="text-xs text-[var(--cf-muted)]">
              {isMs
                ? 'Contoh komik ringan (hover untuk berhenti seketika)'
                : 'Sample comic panels (hover to pause)'}
            </span>
          </div>
        </div>
        <div className="comic-marquee-wrap overflow-hidden rounded-2xl border-2 border-[var(--cf-border)] bg-[var(--cf-surface)]/70 py-3">
          <div className="comic-marquee-track gap-4 px-4">
            {[
              { title: 'Bayang Kota Neon', style: 'Korean Webtoon', bubble: 'Jam ni bercahaya biru!', color: '#6366F1', accent: '#00D9FF' },
              { title: 'Kopitiam Chaos', style: 'Malaysian Cartoon', bubble: 'Teh tarik satu, boss!', color: '#F59E0B', accent: '#FACC15' },
              { title: 'Legenda Pulau Awan', style: 'Fantasy Manga', bubble: 'Gerbang purba terbuka!', color: '#10B981', accent: '#34D399' },
              { title: 'Nota Bangku Belakang', style: 'School Webtoon', bubble: 'Siapa tulis nota ni?', color: '#EC4899', accent: '#F472B6' },
              { title: 'Bayang Kota Neon', style: 'Korean Webtoon', bubble: 'Jam ni bercahaya biru!', color: '#6366F1', accent: '#00D9FF' },
              { title: 'Kopitiam Chaos', style: 'Malaysian Cartoon', bubble: 'Teh tarik satu, boss!', color: '#F59E0B', accent: '#FACC15' },
              { title: 'Legenda Pulau Awan', style: 'Fantasy Manga', bubble: 'Gerbang purba terbuka!', color: '#10B981', accent: '#34D399' },
              { title: 'Nota Bangku Belakang', style: 'School Webtoon', bubble: 'Siapa tulis nota ni?', color: '#EC4899', accent: '#F472B6' },
            ].map((item, idx) => (
              <div
                key={`${item.title}-${idx}`}
                className="w-60 shrink-0 rounded-xl border-2 border-[var(--cf-border)] bg-[var(--cf-surface-2)] p-3 space-y-2 shadow-[3px_3px_0px_rgba(0,217,255,0.28)]"
              >
                <div className="h-20 rounded-lg relative overflow-hidden flex items-center justify-center border border-white/10" style={{ background: `linear-gradient(135deg, ${item.color}33, #090D1A)` }}>
                  <svg viewBox="0 0 180 70" className="w-full h-full opacity-85" aria-hidden="true">
                    <circle cx="38" cy="36" r="18" fill={item.accent} fillOpacity="0.28" stroke={item.accent} strokeWidth="2" />
                    <path d="M26 56 Q38 42 50 56" fill="none" stroke={item.accent} strokeWidth="2.5" />
                    <line x1="75" y1="16" x2="165" y2="16" stroke={item.accent} strokeWidth="1.5" strokeDasharray="4 3" />
                    <line x1="85" y1="54" x2="170" y2="54" stroke="#FACC15" strokeWidth="1.5" strokeDasharray="6 4" />
                  </svg>
                  <span className="absolute bottom-1.5 right-1.5 comic-bubble px-2 py-0.5 text-[10px] font-bold">
                    {item.bubble}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs truncate">{item.title}</span>
                  <span className="text-[10px] text-[#00D9FF] font-semibold shrink-0">{item.style}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Characters, Recent Story Universes & Recent Prompts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Recent Characters */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00D9FF]" />
              {isMs ? 'Watak Terkini' : 'Recent Characters'}
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
                      <span className="font-mono text-[11px] text-[#00D9FF]">({c.characterCode})</span>
                    </div>
                    <div className="text-[11px] text-[var(--cf-muted)] truncate">
                      {getEffectiveSpecies(c)} · {c.role} · {c.visualStyle}
                    </div>
                  </div>
                  <Badge variant="indigo">v{c.version}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent Story Universes */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#6366F1]" />
              {isMs ? 'Story Universe Terkini' : 'Recent Story Universes'}
            </h2>
            <Link href="/story-universe" className="text-xs text-[#00D9FF] hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!hydrated ? (
            <div className="h-24 rounded-xl bg-[var(--cf-surface-2)] animate-pulse" />
          ) : recentUniverses.length === 0 ? (
            <div className="py-4 space-y-2">
              <p className="text-xs text-[var(--cf-muted)]">
                {isMs
                  ? 'Belum ada Story Universe. Bina peraturan dunia & lokasi di Story Universe Studio.'
                  : 'No Story Universes yet. Build world rules & locations in Story Universe Studio.'}
              </p>
              <Link href="/story-universe" className="inline-block text-xs font-semibold text-[#00D9FF] hover:underline">
                {isMs ? 'Buka Story Universe Studio →' : 'Open Story Universe Studio →'}
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentUniverses.map((w) => (
                <li
                  key={w.id}
                  className="rounded-xl bg-[var(--cf-surface-2)] p-3 border border-[var(--cf-border)] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{w.worldName}</div>
                    <div className="text-[11px] text-[var(--cf-muted)] truncate">
                      {w.universePreset} · {w.worldRules.length} rules · {w.locations.length} locations
                    </div>
                  </div>
                  <Link href="/story-universe">
                    <Button size="sm" variant="outline">
                      {t.actions.edit}
                    </Button>
                  </Link>
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
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-xs font-semibold hover:border-[#00D9FF]/60"
            >
              {t.actions.openChatGPT}
              <ExternalLink className="w-3.5 h-3.5 text-[#00D9FF]" />
            </a>
            <a
              href="https://gemini.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-xs font-semibold hover:border-[#00D9FF]/60"
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
