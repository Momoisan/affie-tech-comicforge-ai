'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clapperboard,
  FolderPlus,
  Globe2,
  Layers,
  Lock,
  PackageCheck,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { useComicForge } from '@/components/providers/comicforge-provider';
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Select,
  Textarea,
} from '@/components/ui/primitives';
import {
  PAGE_PLAN_STATUSES,
  STORY_ARC_PRESETS,
  type ComicEpisode,
  type ComicProject,
  type ComicScene,
  type PagePlanStatus,
  type PlannedPage,
} from '@/types/comicforge';
import { getEffectiveSpecies } from '@/lib/ai/prompt-formatter';
import { generateId } from '@/lib/utils';

type WorkspaceTab = 'universe' | 'cast' | 'story' | 'pages' | 'export';

function createQuickProject(): ComicProject {
  const now = new Date().toISOString();
  return {
    id: generateId('proj'),
    title: 'Untitled Comic Workspace',
    genre: 'Action',
    targetAudience: 'Teenagers',
    language: 'ms-MY',
    premise: '',
    tone: 'Cinematic',
    artStyle: 'Korean Webtoon',
    format: 'Vertical Webtoon',
    aspectRatio: '9:16',
    panelCount: 4,
    episodeCount: 1,
    scenesPerEpisode: 1,
    panelsPerScene: 4,
    dialogueLength: 'medium',
    pacing: 'balanced',
    assignedCharacterIds: [],
    characterRoles: {},
    props: [],
    plannedPages: [
      {
        id: generateId('page'),
        pageNumber: 1,
        episodeNumber: 1,
        storyBeat: 'Opening Hook',
        sceneSummary: 'Introduce the protagonist and setting.',
        charactersPresent: [],
        location: 'Main Setting',
        panelCount: 4,
        status: 'Planned',
        recap: '',
      },
    ],
    storyOutline: {
      title: 'Untitled Comic Workspace',
      genre: 'Action',
      main_premise: '',
      world_setting: '',
      main_conflict: '',
      character_relationships: [],
      story_arc: 'Beginning / Setup',
      episodes: [
        {
          id: 'ep_1',
          episode_number: 1,
          title: 'Episode 1: Opening',
          storyArc: 'Beginning / Setup',
          synopsis: 'Initial setup episode.',
          cliffhanger: '',
          scenes: [
            {
              id: 'ep1_sc1',
              scene_number: 1,
              title: 'Scene 1: Introduction',
              description: 'Establish the world and lead character.',
              location: 'Main Setting',
              continuity_summary: '',
              panels: [],
            },
          ],
        },
      ],
    },
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

function getStatusBadgeVariant(
  status: PagePlanStatus
): 'default' | 'cyan' | 'yellow' | 'indigo' | 'success' {
  if (status === 'Completed') return 'success';
  if (status === 'In Progress' || status === 'Awaiting Artwork') return 'cyan';
  if (status === 'Prompt Ready') return 'indigo';
  if (status === 'Planned') return 'yellow';
  return 'default';
}

function ComicWorkspaceInner() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');

  const {
    projects,
    characters,
    worlds,
    preferences,
    saveProject,
    notify,
  } = useComicForge();

  const isMs = preferences.uiLanguage === 'ms-MY';

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== 'archived'),
    [projects]
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [draft, setDraft] = useState<ComicProject | null>(null);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<WorkspaceTab>('story');
  const [selectedEpIdx, setSelectedEpIdx] = useState(0);
  const [selectedScIdx, setSelectedScIdx] = useState(0);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [inspectorMode, setInspectorMode] = useState<'page' | 'scene' | 'episode'>('page');

  // Sync initial project selection asynchronously to avoid cascading render lint
  useEffect(() => {
    const targetId = projectIdParam || selectedProjectId || activeProjects[0]?.id;
    if (!targetId) return;
    const found = activeProjects.find((p) => p.id === targetId);
    if (!found) return;
    if (draft?.id === found.id && dirty) return;

    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSelectedProjectId(found.id);
      setDraft(found);
      setDirty(false);
      if (found.plannedPages?.length) {
        setSelectedPageId(found.plannedPages[0].id);
      }
    });
    return () => {
      active = false;
    };
  }, [projectIdParam, activeProjects, selectedProjectId, draft?.id, dirty]);

  const linkedWorld = useMemo(
    () => worlds.find((w) => w.id === draft?.worldId),
    [worlds, draft?.worldId]
  );

  const activeCharacters = useMemo(
    () => characters.filter((c) => c.status !== 'archived'),
    [characters]
  );

  const assignedCharacters = useMemo(
    () => activeCharacters.filter((c) => draft?.assignedCharacterIds.includes(c.id)),
    [activeCharacters, draft?.assignedCharacterIds]
  );

  const episodes = useMemo(
    () => draft?.storyOutline?.episodes ?? [],
    [draft?.storyOutline?.episodes]
  );
  const currentEpisode: ComicEpisode | undefined = episodes[selectedEpIdx] ?? episodes[0];
  const scenes = currentEpisode?.scenes ?? [];
  const currentScene: ComicScene | undefined = scenes[selectedScIdx] ?? scenes[0];

  const plannedPages = useMemo(() => draft?.plannedPages ?? [], [draft?.plannedPages]);
  const selectedPage = useMemo(
    () => plannedPages.find((pg) => pg.id === selectedPageId) ?? plannedPages[0],
    [plannedPages, selectedPageId]
  );

  const updateDraft = (updater: (prev: ComicProject) => ComicProject) => {
    setDraft((prev) => {
      if (!prev) return prev;
      setDirty(true);
      return updater(prev);
    });
  };

  const handleSaveWorkspace = () => {
    if (!draft) return;
    const prepared: ComicProject = {
      ...draft,
      totalPages: draft.plannedPages?.length ?? draft.totalPages,
      currentEpisode: currentEpisode?.episode_number ?? draft.currentEpisode ?? 1,
      updatedAt: new Date().toISOString(),
    };
    saveProject(prepared);
    setDraft(prepared);
    setDirty(false);
    notify(
      isMs ? 'Ruang Kerja Komik berjaya disimpan!' : 'Comic Workspace saved!',
      'success'
    );
  };

  const handleCreateQuickProject = () => {
    const created = createQuickProject();
    saveProject(created);
    setSelectedProjectId(created.id);
    setDraft(created);
    setDirty(false);
    setSelectedEpIdx(0);
    setSelectedScIdx(0);
    setSelectedPageId(created.plannedPages?.[0]?.id ?? null);
    notify(isMs ? 'Projek komik baharu dicipta!' : 'New comic project created!', 'success');
  };

  const handleAddEpisode = () => {
    if (!draft) return;
    const nextNum = episodes.length + 1;
    const newEp: ComicEpisode = {
      id: generateId('ep'),
      episode_number: nextNum,
      title: `Episode ${nextNum}`,
      storyArc: STORY_ARC_PRESETS[Math.min(nextNum - 1, STORY_ARC_PRESETS.length - 1)],
      synopsis: '',
      cliffhanger: '',
      scenes: [
        {
          id: generateId('sc'),
          scene_number: 1,
          title: 'Scene 1',
          description: '',
          location: linkedWorld?.locations[0]?.name || 'Main Setting',
          continuity_summary: '',
          panels: [],
        },
      ],
    };
    updateDraft((prev) => {
      const outline = prev.storyOutline ?? {
        title: prev.title,
        genre: prev.genre,
        main_premise: prev.premise,
        world_setting: linkedWorld?.worldDescription || '',
        main_conflict: '',
        character_relationships: [],
        story_arc: 'Beginning / Setup',
        episodes: [],
      };
      return {
        ...prev,
        episodeCount: outline.episodes.length + 1,
        storyOutline: { ...outline, episodes: [...outline.episodes, newEp] },
      };
    });
    setSelectedEpIdx(episodes.length);
    setSelectedScIdx(0);
    setInspectorMode('episode');
  };

  const handleAddScene = () => {
    if (!draft || !currentEpisode) return;
    const nextScNum = scenes.length + 1;
    const newScene: ComicScene = {
      id: generateId('sc'),
      scene_number: nextScNum,
      title: `Scene ${nextScNum}`,
      description: '',
      location: linkedWorld?.locations[0]?.name || 'Main Setting',
      continuity_summary: '',
      panels: [],
    };
    updateDraft((prev) => {
      if (!prev.storyOutline) return prev;
      const nextEps = prev.storyOutline.episodes.map((ep, idx) =>
        idx === selectedEpIdx ? { ...ep, scenes: [...ep.scenes, newScene] } : ep
      );
      return {
        ...prev,
        storyOutline: { ...prev.storyOutline, episodes: nextEps },
      };
    });
    setSelectedScIdx(scenes.length);
    setInspectorMode('scene');
  };

  const handleAddPage = () => {
    if (!draft) return;
    const nextPageNum = plannedPages.length + 1;
    const newPage: PlannedPage = {
      id: generateId('page'),
      pageNumber: nextPageNum,
      episodeNumber: currentEpisode?.episode_number ?? 1,
      sceneId: currentScene?.id,
      storyBeat: `Page ${nextPageNum} Beat`,
      sceneSummary: currentScene?.description || '',
      charactersPresent: assignedCharacters.map((c) => c.name),
      location: currentScene?.location || '',
      panelCount: draft.panelsPerScene || 4,
      status: 'Planned',
      recap: '',
    };
    updateDraft((prev) => ({
      ...prev,
      totalPages: (prev.plannedPages?.length ?? 0) + 1,
      plannedPages: [...(prev.plannedPages ?? []), newPage],
    }));
    setSelectedPageId(newPage.id);
    setInspectorMode('page');
  };

  const handleSyncPagesFromOutline = () => {
    if (!draft?.storyOutline?.episodes.length) {
      notify(
        isMs ? 'Tiada episod dalam garis cerita lagi.' : 'No episodes in outline yet.',
        'error'
      );
      return;
    }
    const generated: PlannedPage[] = [];
    let pageCounter = 1;
    for (const ep of draft.storyOutline.episodes) {
      for (const sc of ep.scenes) {
        generated.push({
          id: generateId('page'),
          pageNumber: pageCounter++,
          episodeNumber: ep.episode_number,
          sceneId: sc.id,
          storyBeat: sc.title || `Ep ${ep.episode_number} Scene ${sc.scene_number}`,
          sceneSummary: sc.description,
          charactersPresent: assignedCharacters.map((c) => c.name),
          location: sc.location,
          panelCount: sc.panels.length || draft.panelsPerScene || 4,
          status: sc.panels.length > 0 ? 'Prompt Ready' : 'Planned',
          recap: sc.continuity_summary || '',
        });
      }
    }
    updateDraft((prev) => ({
      ...prev,
      totalPages: generated.length,
      plannedPages: generated,
    }));
    if (generated[0]) setSelectedPageId(generated[0].id);
    setInspectorMode('page');
    notify(
      isMs
        ? `${generated.length} halaman disegerakkan daripada garis cerita.`
        : `Synced ${generated.length} pages from story outline.`,
      'success'
    );
  };

  const updateSelectedPage = (patch: Partial<PlannedPage>) => {
    if (!selectedPage) return;
    updateDraft((prev) => ({
      ...prev,
      plannedPages: (prev.plannedPages ?? []).map((pg) =>
        pg.id === selectedPage.id ? { ...pg, ...patch } : pg
      ),
    }));
  };

  const updateCurrentEpisode = (patch: Partial<ComicEpisode>) => {
    if (!currentEpisode) return;
    updateDraft((prev) => {
      if (!prev.storyOutline) return prev;
      return {
        ...prev,
        storyOutline: {
          ...prev.storyOutline,
          episodes: prev.storyOutline.episodes.map((ep, idx) =>
            idx === selectedEpIdx ? { ...ep, ...patch } : ep
          ),
        },
      };
    });
  };

  const updateCurrentScene = (patch: Partial<ComicScene>) => {
    if (!currentScene) return;
    updateDraft((prev) => {
      if (!prev.storyOutline) return prev;
      return {
        ...prev,
        storyOutline: {
          ...prev.storyOutline,
          episodes: prev.storyOutline.episodes.map((ep, eIdx) =>
            eIdx === selectedEpIdx
              ? {
                  ...ep,
                  scenes: ep.scenes.map((sc, sIdx) =>
                    sIdx === selectedScIdx ? { ...sc, ...patch } : sc
                  ),
                }
              : ep
          ),
        },
      };
    });
  };

  if (!draft) {
    return (
      <Card className="p-8 text-center space-y-4 max-w-xl mx-auto">
        <Layers className="w-10 h-10 text-[#00D9FF] mx-auto" />
        <h1 className="text-2xl font-extrabold">
          {isMs ? 'Ruang Kerja Komik Bersepadu' : 'Integrated Comic Workspace'}
        </h1>
        <p className="text-sm text-[var(--cf-muted)]">
          {isMs
            ? 'Belum ada projek komik aktif. Cipta projek pantas atau buka Story Wizard untuk bermula.'
            : 'No active comic project yet. Create a quick project or open the Story Wizard to start.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={handleCreateQuickProject}>
            <FolderPlus className="w-4 h-4" />
            {isMs ? 'Cipta Projek Ruang Kerja' : 'Create Workspace Project'}
          </Button>
          <Link href="/creator">
            <Button variant="secondary">
              <Sparkles className="w-4 h-4 text-[#00D9FF]" />
              {t_label(isMs, 'Buka Story Wizard', 'Open Story Wizard')}
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5 pb-20 xl:pb-0">
      {/* Persistent Project Header */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="-skew-x-6 bg-[#FACC15] text-[#090D1A] px-2.5 py-0.5 text-[11px] font-black uppercase border-2 border-[#090D1A]">
                PHASE 2B-2 · WORKSPACE
              </span>
              <Badge variant={draft.status === 'completed' ? 'success' : 'cyan'}>
                {draft.status}
              </Badge>
              <Badge variant="indigo">{draft.artStyle}</Badge>
              <Badge variant={dirty ? 'yellow' : 'success'}>
                {dirty ? (isMs ? 'Belum Disimpan' : 'Unsaved') : isMs ? 'Disimpan' : 'Saved'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                {draft.title}
              </h1>
              <span className="text-xs text-[var(--cf-muted)]">
                Ep {currentEpisode?.episode_number ?? 1} · {plannedPages.length}{' '}
                {isMs ? 'Halaman' : 'Pages'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeProjects.length > 1 && (
              <Select
                value={draft.id}
                onChange={(e) => {
                  const found = activeProjects.find((p) => p.id === e.target.value);
                  if (found) {
                    setSelectedProjectId(found.id);
                    setDraft(found);
                    setDirty(false);
                  }
                }}
                aria-label="Switch comic project"
                className="w-full sm:w-48"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={handleCreateQuickProject}>
              <FolderPlus className="w-3.5 h-3.5" />
              {isMs ? 'Projek Baharu' : 'New'}
            </Button>
            <Link href="/director">
              <Button variant="secondary" size="sm">
                <Clapperboard className="w-3.5 h-3.5 text-[#00D9FF]" />
                {isMs ? 'Pratonton Panel' : 'Preview Panels'}
              </Button>
            </Link>
            <Button size="sm" onClick={handleSaveWorkspace}>
              <Save className="w-3.5 h-3.5" />
              {isMs ? 'Simpan' : 'Save Workspace'}
            </Button>
          </div>
        </div>

        {/* 5-Tab Integrated Workspace Navigation */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--cf-border)]">
          {(
            [
              ['universe', '1. Universe', Globe2],
              ['cast', '2. Cast', Users],
              ['story', '3. Story & Pages', BookOpen],
              ['pages', '4. Page Editor (2B-3)', Layers],
              ['export', '5. Export (2B-5)', PackageCheck],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                tab === key
                  ? 'border-[#FACC15] bg-[#6366F1]/25 text-[#FACC15]'
                  : 'border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-[var(--cf-muted)] hover:text-[var(--cf-text)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* TAB 1: UNIVERSE WORKSPACE */}
      {tab === 'universe' && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Story Universe Studio</h2>
              <p className="text-xs text-[var(--cf-muted)]">
                {isMs
                  ? 'Pautkan dunia cerita, peraturan dunia, lokasi, puak dan garis masa.'
                  : 'Link your Story Universe, world rules, locations, factions, and props.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/story-universe">
                <Button size="sm" variant="outline">
                  <Globe2 className="w-3.5 h-3.5 text-[#00D9FF]" />
                  Open Story Universe Studio
                </Button>
              </Link>
              <Button size="sm" onClick={() => setTab('cast')}>
                Continue to Cast <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Linked Story Universe</Label>
              <Select
                value={draft.worldId || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    worldId: e.target.value || undefined,
                  }))
                }
              >
                <option value="">None (Standalone)</option>
                {worlds.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.worldName} ({w.universePreset})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Story Premise</Label>
              <Input
                value={draft.premise}
                onChange={(e) =>
                  updateDraft((prev) => ({ ...prev, premise: e.target.value }))
                }
                placeholder="Core comic premise..."
              />
            </div>
          </div>

          {linkedWorld ? (
            <div className="rounded-2xl border border-[#00D9FF]/30 bg-[var(--cf-surface-2)] p-4 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-sm">{linkedWorld.worldName}</span>
                <Badge variant="cyan">{linkedWorld.universePreset}</Badge>
              </div>
              <p className="text-[var(--cf-muted)]">{linkedWorld.worldDescription}</p>
              <div className="flex flex-wrap gap-3 text-[11px] pt-1">
                <span>World Rules: {linkedWorld.worldRules.length}</span>
                <span>Locations: {linkedWorld.locations.length}</span>
                <span>Factions: {linkedWorld.factions.length}</span>
                <span>Timeline Events: {linkedWorld.timeline.length}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--cf-muted)]">
              No Story Universe linked yet. Select one above or create one in Story Universe Studio.
            </p>
          )}
        </Card>
      )}

      {/* TAB 2: CAST WORKSPACE */}
      {tab === 'cast' && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Character Cast (Character Studio 2.0)</h2>
              <p className="text-xs text-[var(--cf-muted)]">
                {isMs
                  ? 'Pilih watak sedia ada dan tetapkan peranan dalam komik ini tanpa mengubah identiti asal.'
                  : 'Assign existing characters and per-comic roles without mutating immutable identities.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/characters">
                <Button size="sm" variant="outline">
                  <Users className="w-3.5 h-3.5 text-[#00D9FF]" />
                  Open Character Studio
                </Button>
              </Link>
              <Button size="sm" onClick={() => setTab('story')}>
                Continue to Story Plan <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {activeCharacters.length === 0 ? (
            <p className="text-xs text-[var(--cf-muted)]">
              No characters found. Create characters in Character Studio 2.0 first.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeCharacters.map((c) => {
                const selected = draft.assignedCharacterIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl border p-3.5 space-y-2.5 ${
                      selected
                        ? 'cf-selected-ring bg-[#6366F1]/18'
                        : 'border-[var(--cf-border)] bg-[var(--cf-surface-2)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {c.referenceImageUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded reference URL */}
                            <img
                              src={c.referenceImageUrl}
                              alt={c.name}
                              loading="lazy"
                              className="w-11 h-11 rounded-xl object-cover border border-[var(--cf-border)] shrink-0"
                            />
                          </>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center font-bold text-xs text-[#818CF8] shrink-0">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{c.name}</div>
                          <div className="font-mono text-[11px] text-[#00D9FF]">
                            {c.characterCode}
                          </div>
                          <div className="text-[11px] text-[var(--cf-muted)] truncate">
                            {getEffectiveSpecies(c)} · {c.primaryOutfit || 'No outfit'}
                          </div>
                        </div>
                      </div>
                      <Lock className="w-3.5 h-3.5 text-[#FACC15] shrink-0" aria-label="Identity Locked" />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={selected ? 'accent' : 'secondary'}
                      className="w-full"
                      onClick={() =>
                        updateDraft((prev) => {
                          const exists = prev.assignedCharacterIds.includes(c.id);
                          return {
                            ...prev,
                            assignedCharacterIds: exists
                              ? prev.assignedCharacterIds.filter((id) => id !== c.id)
                              : [...prev.assignedCharacterIds, c.id],
                          };
                        })
                      }
                    >
                      {selected ? 'Assigned to Comic' : 'Assign to Cast'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: VISUAL STORY & PAGE PLANNER (3-ZONE WORKSPACE) */}
      {tab === 'story' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* LEFT ZONE: Comic -> Episode -> Scene -> Page Hierarchy */}
          <Card className="xl:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm uppercase tracking-wider text-[#00D9FF]">
                {isMs ? 'Hierarki Cerita' : 'Story Hierarchy'}
              </h2>
              <Button size="sm" variant="outline" onClick={handleAddEpisode}>
                <Plus className="w-3.5 h-3.5" /> Ep
              </Button>
            </div>

            {episodes.length === 0 ? (
              <p className="text-xs text-[var(--cf-muted)]">
                Click + Ep to start planning episodes.
              </p>
            ) : (
              <div className="space-y-2">
                {episodes.map((ep, eIdx) => {
                  const isEpSelected = eIdx === selectedEpIdx;
                  return (
                    <div
                      key={ep.id}
                      className={`rounded-xl border p-2.5 space-y-2 ${
                        isEpSelected
                          ? 'border-[#00D9FF]/60 bg-[var(--cf-surface-2)]'
                          : 'border-[var(--cf-border)] bg-[var(--cf-surface)]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEpIdx(eIdx);
                          setSelectedScIdx(0);
                          setInspectorMode('episode');
                        }}
                        className="w-full text-left flex items-center justify-between gap-2 cursor-pointer min-h-[36px]"
                      >
                        <span className="font-bold text-xs truncate">
                          Ep {ep.episode_number}: {ep.title}
                        </span>
                        <Badge variant="indigo">{ep.scenes.length} sc</Badge>
                      </button>

                      {isEpSelected && (
                        <div className="pl-2 space-y-1.5 border-l-2 border-[#6366F1]/50">
                          {ep.scenes.map((sc, sIdx) => (
                            <button
                              key={sc.id}
                              type="button"
                              onClick={() => {
                                setSelectedScIdx(sIdx);
                                setInspectorMode('scene');
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors min-h-[36px] ${
                                sIdx === selectedScIdx
                                  ? 'bg-[#6366F1]/25 text-[#FACC15] font-semibold'
                                  : 'text-[var(--cf-muted)] hover:text-[var(--cf-text)]'
                              }`}
                            >
                              Sc {sc.scene_number}: {sc.title || sc.location}
                            </button>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={handleAddScene}
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Scene
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-[var(--cf-border)] space-y-2">
              <Button size="sm" variant="secondary" className="w-full" onClick={handleAddPage}>
                <Plus className="w-3.5 h-3.5" /> Add Planned Page
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleSyncPagesFromOutline}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00D9FF]" />
                Sync Pages from Outline
              </Button>
            </div>
          </Card>

          {/* CENTER ZONE: Episode Arc, Planned Pages & Panel Storyboard Cards */}
          <div className="xl:col-span-6 space-y-5">
            {currentEpisode && (
              <Card className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-sm">
                    Episode {currentEpisode.episode_number}: {currentEpisode.title}
                  </div>
                  <Badge variant="yellow">
                    {currentEpisode.storyArc || 'Beginning / Setup'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STORY_ARC_PRESETS.map((arc) => (
                    <button
                      key={arc}
                      type="button"
                      onClick={() => updateCurrentEpisode({ storyArc: arc })}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer min-h-[34px] ${
                        (currentEpisode.storyArc || 'Beginning / Setup') === arc
                          ? 'border-[#FACC15] bg-[#FACC15]/15 text-[#FACC15]'
                          : 'border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-[var(--cf-muted)]'
                      }`}
                    >
                      {arc}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Planned Pages Grid */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base">
                  {isMs ? 'Perancangan Halaman' : 'Planned Pages'} ({plannedPages.length})
                </h2>
                <Button size="sm" variant="secondary" onClick={handleAddPage}>
                  <Plus className="w-3.5 h-3.5" /> Add Page
                </Button>
              </div>

              {plannedPages.length === 0 ? (
                <p className="text-xs text-[var(--cf-muted)] py-4">
                  No planned pages yet. Click &quot;Add Page&quot; or &quot;Sync Pages from Outline&quot;.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plannedPages.map((pg) => {
                    const isSelected = selectedPage?.id === pg.id;
                    return (
                      <div
                        key={pg.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedPageId(pg.id);
                          setInspectorMode('page');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedPageId(pg.id);
                            setInspectorMode('page');
                          }
                        }}
                        className={`rounded-2xl border p-3.5 space-y-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'cf-selected-ring bg-[#6366F1]/18'
                            : 'border-[var(--cf-border)] bg-[var(--cf-surface-2)] hover:border-[#00D9FF]/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm">
                            Page {pg.pageNumber}{' '}
                            <span className="text-[11px] font-normal text-[var(--cf-muted)]">
                              (Ep {pg.episodeNumber})
                            </span>
                          </span>
                          <Badge variant={getStatusBadgeVariant(pg.status)}>{pg.status}</Badge>
                        </div>
                        <div className="text-xs font-semibold text-[#00D9FF] truncate">
                          {pg.storyBeat || 'Untitled Beat'}
                        </div>
                        <p className="text-xs text-[var(--cf-muted)] line-clamp-2">
                          {pg.sceneSummary || 'No scene summary yet.'}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--cf-muted)] pt-1 border-t border-[var(--cf-border)]">
                          <span>{pg.location || 'Location TBD'}</span>
                          <span>{pg.panelCount} panels</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Panel Storyboard Cards for Selected Scene */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">
                  Panel Storyboard Cards —{' '}
                  {currentScene ? `Scene ${currentScene.scene_number}` : 'No Scene Selected'}
                </h3>
                <Badge variant="cyan">{currentScene?.panels.length ?? 0} panels</Badge>
              </div>
              {!currentScene || currentScene.panels.length === 0 ? (
                <p className="text-xs text-[var(--cf-muted)]">
                  No generated panels in this scene yet. Generate a story in Comic Creator or edit panels in Smart Panel Director.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentScene.panels.map((pnl) => (
                    <div
                      key={pnl.stable_panel_id || pnl.panel_number}
                      className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] p-3 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#FACC15]">
                          PANEL {pnl.panel_number}
                        </span>
                        <Badge variant="indigo">{pnl.shot_type || pnl.camera}</Badge>
                      </div>
                      <p className="text-[var(--cf-muted)] line-clamp-2">
                        {pnl.scene_context || pnl.environment}
                      </p>
                      <div className="text-[11px] text-[#00D9FF]">
                        {pnl.characters.map((ch) => ch.name).join(', ') || 'Establishing Shot'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT ZONE: Context-Sensitive Properties Inspector */}
          <Card className="xl:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm uppercase tracking-wider text-[#FACC15]">
                {inspectorMode === 'page'
                  ? 'Page Inspector'
                  : inspectorMode === 'scene'
                    ? 'Scene Inspector'
                    : 'Episode Inspector'}
              </h2>
              <div className="flex gap-1">
                {(['page', 'scene', 'episode'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setInspectorMode(m)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                      inspectorMode === m
                        ? 'bg-[#6366F1] text-white'
                        : 'bg-[var(--cf-surface-2)] text-[var(--cf-muted)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {inspectorMode === 'page' && selectedPage && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Page {selectedPage.pageNumber}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Delete planned page"
                    onClick={() => {
                      updateDraft((prev) => ({
                        ...prev,
                        plannedPages: (prev.plannedPages ?? []).filter(
                          (pg) => pg.id !== selectedPage.id
                        ),
                      }));
                      setSelectedPageId(null);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </Button>
                </div>
                <div>
                  <Label htmlFor="pg-beat">Story Beat</Label>
                  <Input
                    id="pg-beat"
                    value={selectedPage.storyBeat}
                    onChange={(e) => updateSelectedPage({ storyBeat: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="pg-status">Page Status</Label>
                  <Select
                    id="pg-status"
                    value={selectedPage.status}
                    onChange={(e) =>
                      updateSelectedPage({ status: e.target.value as PagePlanStatus })
                    }
                  >
                    {PAGE_PLAN_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="pg-panels">Panel Count</Label>
                    <Input
                      id="pg-panels"
                      type="number"
                      min={1}
                      max={12}
                      value={selectedPage.panelCount}
                      onChange={(e) =>
                        updateSelectedPage({
                          panelCount: Math.max(1, Math.min(12, Number(e.target.value) || 1)),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="pg-loc">Location</Label>
                    <Input
                      id="pg-loc"
                      value={selectedPage.location}
                      onChange={(e) => updateSelectedPage({ location: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pg-summary">Scene Summary</Label>
                  <Textarea
                    id="pg-summary"
                    rows={3}
                    value={selectedPage.sceneSummary}
                    onChange={(e) => updateSelectedPage({ sceneSummary: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="pg-recap">Page Recap (Continuity)</Label>
                  <Textarea
                    id="pg-recap"
                    rows={2}
                    value={selectedPage.recap}
                    onChange={(e) => updateSelectedPage({ recap: e.target.value })}
                    placeholder="Concise summary for next page prompt..."
                  />
                </div>
              </div>
            )}

            {inspectorMode === 'scene' && currentScene && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="sc-title">Scene Title</Label>
                  <Input
                    id="sc-title"
                    value={currentScene.title}
                    onChange={(e) => updateCurrentScene({ title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sc-loc">Location</Label>
                  <Input
                    id="sc-loc"
                    value={currentScene.location}
                    onChange={(e) => updateCurrentScene({ location: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sc-desc">Scene Description</Label>
                  <Textarea
                    id="sc-desc"
                    rows={3}
                    value={currentScene.description}
                    onChange={(e) => updateCurrentScene({ description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sc-cont">Continuity Summary</Label>
                  <Textarea
                    id="sc-cont"
                    rows={2}
                    value={currentScene.continuity_summary}
                    onChange={(e) =>
                      updateCurrentScene({ continuity_summary: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {inspectorMode === 'episode' && currentEpisode && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ep-title">Episode Title</Label>
                  <Input
                    id="ep-title"
                    value={currentEpisode.title}
                    onChange={(e) => updateCurrentEpisode({ title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ep-arc">Story Arc (Editable)</Label>
                  <Input
                    id="ep-arc"
                    value={currentEpisode.storyArc || ''}
                    onChange={(e) => updateCurrentEpisode({ storyArc: e.target.value })}
                    placeholder="Beginning / Setup, Climax, or custom..."
                  />
                </div>
                <div>
                  <Label htmlFor="ep-syn">Episode Synopsis</Label>
                  <Textarea
                    id="ep-syn"
                    rows={3}
                    value={currentEpisode.synopsis}
                    onChange={(e) => updateCurrentEpisode({ synopsis: e.target.value })}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: PAGE EDITOR PLACEHOLDER (PHASE 2B-3) */}
      {tab === 'pages' && (
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="yellow">Coming in Phase 2B-3</Badge>
            <h2 className="text-lg font-bold">Visual Comic Page Editor</h2>
          </div>
          <p className="text-sm text-[var(--cf-muted)]">
            Interactive panel layouts, artwork upload/cropping, speech bubbles, and narration overlays will be implemented in Phase 2B-3. You can currently revise individual panel prompts in Smart Panel Director.
          </p>
          <Link href="/director">
            <Button variant="secondary">
              <Clapperboard className="w-4 h-4 text-[#00D9FF]" />
              Open Smart Panel Director
            </Button>
          </Link>
        </Card>
      )}

      {/* TAB 5: EXPORT PLACEHOLDER (PHASE 2B-5) */}
      {tab === 'export' && (
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="yellow">Coming in Phase 2B-5</Badge>
            <h2 className="text-lg font-bold">Comic Export Studio</h2>
          </div>
          <p className="text-sm text-[var(--cf-muted)]">
            PNG, PDF, Vertical Webtoon, and ZIP page exports will be implemented in Phase 2B-5. You can currently export structured 11-part prompt packages in Prompt Package Studio.
          </p>
          <Link href="/package-studio">
            <Button variant="secondary">
              <PackageCheck className="w-4 h-4 text-[#00D9FF]" />
              Open Prompt Package Studio
            </Button>
          </Link>
        </Card>
      )}

      {/* Mobile Sticky Save Bar */}
      <div className="xl:hidden fixed bottom-16 inset-x-0 z-30 border-t border-[var(--cf-border)] bg-[var(--cf-surface)]/95 backdrop-blur-md px-3 py-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold truncate text-[var(--cf-muted)]">
          {dirty ? (isMs ? 'Perubahan belum disimpan' : 'Unsaved changes') : 'Saved'}
        </span>
        <Button size="sm" onClick={handleSaveWorkspace}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isMs ? 'Simpan' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function t_label(isMs: boolean, ms: string, en: string) {
  return isMs ? ms : en;
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="h-40 rounded-2xl bg-[var(--cf-surface-2)] animate-pulse" />}>
      <ComicWorkspaceInner />
    </Suspense>
  );
}
