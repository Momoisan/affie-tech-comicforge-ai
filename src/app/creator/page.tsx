'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  RefreshCw,
  Save,
  Sparkles,
  Wand2,
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
  ART_STYLE_IDS,
  ASPECT_RATIOS,
  COMIC_GENRES,
  MALAYSIAN_CULTURAL_CONTEXTS,
  MALAYSIAN_DIALOGUE_STYLES,
  MALAYSIAN_REGIONAL_PRESETS,
  PUBLISHING_FORMATS,
  STORY_LANGUAGES,
  STORY_TONES,
  TARGET_AUDIENCES,
  type ArtStyleId,
  type ComicProject,
  type EngineId,
  type EngineMode,
  type ExportTarget,
  type StoryLanguage,
  type StructuredPanel,
} from '@/types/comicforge';
import { ART_STYLES } from '@/lib/styles/art-styles';
import { generateId } from '@/lib/utils';

function createInitialProject(
  defaultStyle: string,
  defaultAspectRatio: string,
  defaultLang: StoryLanguage
): ComicProject {
  const now = '';
  return {
    id: 'proj_draft',
    title: '',
    genre: 'Action',
    customGenre: '',
    targetAudience: 'Teenagers',
    language: defaultLang,
    premise: '',
    tone: 'Cinematic',
    artStyle: defaultStyle || 'Korean Webtoon',
    customArtStyle: '',
    format: 'Vertical Webtoon',
    aspectRatio: defaultAspectRatio || '9:16',
    panelCount: 4,
    episodeCount: 1,
    scenesPerEpisode: 2,
    panelsPerScene: 3,
    dialogueLength: 'medium',
    pacing: 'balanced',
    assignedCharacterIds: [],
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

function ComicCreatorInner() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');

  const {
    t,
    projects,
    characters,
    worlds,
    preferences,
    saveProject,
    savePrompt,
    notify,
  } = useComicForge();

  const [step, setStep] = useState<number>(0);
  const [project, setProject] = useState<ComicProject>(() =>
    createInitialProject(
      preferences.defaultStyle,
      preferences.defaultAspectRatio,
      preferences.defaultStoryLanguage
    )
  );
  const [engineMode, setEngineMode] = useState<EngineMode>(preferences.preferredEngine);
  const [exportTarget, setExportTarget] = useState<ExportTarget>(preferences.exportTarget);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [panelViewMode, setPanelViewMode] = useState<'human' | 'json'>('human');

  useEffect(() => {
    if (projectIdParam) {
      const existing = projects.find((p) => p.id === projectIdParam);
      if (existing) {
        setProject(existing);
        if (existing.storyOutline) setStep(3);
      }
    }
  }, [projectIdParam, projects]);

  const activeCharacters = characters.filter((c) => c.status !== 'archived');
  const assignedCharacters = activeCharacters.filter((c) =>
    project.assignedCharacterIds.includes(c.id)
  );

  const toggleCharacter = (id: string) => {
    setProject((prev) => {
      const exists = prev.assignedCharacterIds.includes(id);
      return {
        ...prev,
        assignedCharacterIds: exists
          ? prev.assignedCharacterIds.filter((cid) => cid !== id)
          : [...prev.assignedCharacterIds, id],
      };
    });
  };

  const handleAutoTitle = async () => {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'title',
          engineMode: 'local',
          exportTarget,
          seed: Date.now(),
          project: {
            id: project.id,
            title: project.title || 'Untitled Comic',
            genre: project.genre,
            customGenre: project.customGenre,
            language: project.language,
          },
          characters: [],
        }),
      });
      const data = await res.json();
      if (data.ok && data.title) {
        setProject((prev) => ({ ...prev, title: data.title }));
        notify('Tajuk komik dijana!', 'success');
      }
    } catch {
      notify('Gagal menjana tajuk.', 'error');
    }
  };

  const handleExpandPremise = async () => {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'premise_expand',
          engineMode: 'local',
          exportTarget,
          project: {
            id: project.id,
            title: project.title || 'Untitled Comic',
            genre: project.genre,
            customGenre: project.customGenre,
            language: project.language,
            premise: project.premise,
            tone: project.tone,
          },
          characters: [],
        }),
      });
      const data = await res.json();
      if (data.ok && data.premise) {
        setProject((prev) => ({ ...prev, premise: data.premise }));
        notify('Idea cerita dikembangkan!', 'success');
      }
    } catch {
      notify('Gagal mengembangkan premis.', 'error');
    }
  };

  const handleGenerateStory = async () => {
    setLoading(true);
    setEngineError(null);
    setFallbackNotice(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'full_story',
          engineMode,
          exportTarget,
          seed: Date.now(),
          project: {
            id: project.id,
            title: project.title.trim() || 'Untitled Comic',
            genre: project.genre,
            customGenre: project.customGenre,
            targetAudience: project.targetAudience,
            language: project.language,
            premise: project.premise,
            tone: project.tone,
            artStyle: project.artStyle,
            customArtStyle: project.customArtStyle,
            format: project.format,
            aspectRatio: project.aspectRatio,
            episodeCount: project.episodeCount,
            scenesPerEpisode: project.scenesPerEpisode,
            panelsPerScene: project.panelsPerScene,
            dialogueLength: project.dialogueLength,
            pacing: project.pacing,
          },
          characters: assignedCharacters,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setEngineError(data.message || t.creator.geminiOnlyError);
        notify(data.message || 'Penjanaan gagal.', 'error');
        return;
      }

      if (data.fallbackUsed) {
        setFallbackNotice(t.creator.fallbackNotice);
      }

      const updated: ComicProject = {
        ...project,
        title: data.outline.title || project.title || 'Untitled Comic',
        storyOutline: data.outline,
        status: 'in_progress',
        lastEngineUsed: data.engineUsed as EngineId,
        fallbackUsed: Boolean(data.fallbackUsed),
        updatedAt: new Date().toISOString(),
      };

      setProject(updated);
      saveProject(updated);
      setStep(3);
      notify(
        `Cerita & prompt panel berjaya dijana (${data.engineUsed === 'gemini' ? 'Gemini API' : 'Local Prompt Engine'})!`,
        'success'
      );
    } catch {
      setEngineError('Ralat rangkaian semasa menghubungi pelayan penjanaan.');
      notify('Ralat rangkaian.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    notify(`${label} disalin!`, 'success');
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePanelPrompt = (panel: StructuredPanel) => {
    const fullText = panel.human_readable_prompt || panel.image_prompt;
    savePrompt({
      id: generateId('prm'),
      projectId: project.id,
      projectTitle: project.title,
      promptType: 'panel',
      engineUsed: project.lastEngineUsed ?? 'local',
      fallbackUsed: Boolean(project.fallbackUsed),
      artStyle: panel.art_style,
      exportTarget,
      promptText: fullText,
      structuredOutput: panel as unknown as Record<string, unknown>,
      tags: [project.genre, panel.art_style, `Ep${panel.episode_number}`],
      createdAt: new Date().toISOString(),
    });
    notify(`Panel ${panel.panel_number} disimpan ke Pustaka Prompt!`, 'success');
  };

  const selectedStyleSpec =
    ART_STYLES[project.artStyle as ArtStyleId] ?? ART_STYLES['Korean Webtoon'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t.creator.title}</h1>
          <p className="text-sm text-[var(--cf-muted)]">{t.creator.subtitle}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            saveProject({
              ...project,
              title: project.title.trim() || 'Untitled Comic',
            });
            notify('Projek disimpan!', 'success');
          }}
        >
          <Save className="w-4 h-4 text-[#00D9FF]" />
          {t.actions.saveProject}
        </Button>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {t.creator.steps.map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(idx)}
            className={`rounded-2xl border px-4 py-3 text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              step === idx
                ? 'cf-selected-ring bg-[#6366F1]/18 text-[var(--cf-text)]'
                : 'border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-muted)] hover:text-[var(--cf-text)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* STEP 1: Project Information */}
      {step === 0 && (
        <Card className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="comic-title">Comic Title</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="comic-title"
                  value={project.title}
                  onChange={(e) => setProject({ ...project, title: e.target.value })}
                  placeholder="Contoh: Bayang Kota Neon"
                />
                <Button type="button" variant="secondary" onClick={handleAutoTitle}>
                  <Wand2 className="w-4 h-4 text-[#FACC15]" />
                  {t.creator.autoGenerateTitle}
                </Button>
              </div>
            </div>

            <div>
              <Label>Comic Genre</Label>
              <Select
                value={project.genre}
                onChange={(e) => setProject({ ...project, genre: e.target.value })}
              >
                {COMIC_GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </div>

            {project.genre === 'Custom Genre' ? (
              <div>
                <Label>Custom Genre</Label>
                <Input
                  value={project.customGenre || ''}
                  onChange={(e) => setProject({ ...project, customGenre: e.target.value })}
                  placeholder="e.g. Nusantara Cyberpunk"
                />
              </div>
            ) : (
              <div>
                <Label>Target Audience</Label>
                <Select
                  value={project.targetAudience}
                  onChange={(e) => setProject({ ...project, targetAudience: e.target.value })}
                >
                  {TARGET_AUDIENCES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <Label>Story Language</Label>
              <Select
                value={project.language}
                onChange={(e) =>
                  setProject({ ...project, language: e.target.value as StoryLanguage })
                }
              >
                {STORY_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === 'ms-MY'
                      ? 'Bahasa Melayu Malaysia'
                      : lang === 'en'
                        ? 'English'
                        : 'Bilingual Malay-English'}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Story Tone</Label>
              <Select
                value={project.tone}
                onChange={(e) => setProject({ ...project, tone: e.target.value })}
              >
                {STORY_TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="comic-premise">Story Premise / Synopsis</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleExpandPremise}>
                  <Sparkles className="w-3.5 h-3.5 text-[#00D9FF]" />
                  {t.creator.expandIdea}
                </Button>
              </div>
              <Textarea
                id="comic-premise"
                rows={4}
                value={project.premise}
                onChange={(e) => setProject({ ...project, premise: e.target.value })}
                placeholder="Terangkan idea utama cerita komik anda atau klik 'Kembangkan Idea'..."
              />
            </div>

            {/* World Lore & Malaysian Comic Mode (V2.0) */}
            <div className="md:col-span-2 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)]/70 p-4 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-[#00D9FF]">
                V2.0 World Lore &amp; Malaysian Comic Mode (Optional)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label>World Lore</Label>
                  <Select
                    value={project.worldId || ''}
                    onChange={(e) => setProject({ ...project, worldId: e.target.value || undefined })}
                  >
                    <option value="">None (Standalone)</option>
                    {worlds.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.worldName} ({w.worldRules.length} rules)
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Malaysian Dialogue Style</Label>
                  <Select
                    value={project.dialogueStyle || 'Standard Malaysian Malay'}
                    onChange={(e) => setProject({ ...project, dialogueStyle: e.target.value })}
                  >
                    {MALAYSIAN_DIALOGUE_STYLES.map((ds) => (
                      <option key={ds} value={ds}>
                        {ds}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Regional Dialect (Guidance)</Label>
                  <Select
                    value={project.regionalDialect || 'None'}
                    onChange={(e) => setProject({ ...project, regionalDialect: e.target.value })}
                  >
                    {MALAYSIAN_REGIONAL_PRESETS.map((rd) => (
                      <option key={rd} value={rd}>
                        {rd}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Cultural Context</Label>
                  <Select
                    value={project.culturalContext || 'None (Universal)'}
                    onChange={(e) => setProject({ ...project, culturalContext: e.target.value })}
                  >
                    {MALAYSIAN_CULTURAL_CONTEXTS.map((cc) => (
                      <option key={cc} value={cc}>
                        {cc}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Assign Characters */}
            <div className="md:col-span-2 space-y-2">
              <Label>Assign Characters from Character Studio</Label>
              {activeCharacters.length === 0 ? (
                <p className="text-xs text-[var(--cf-muted)]">
                  Tiada watak tersimpan lagi. Engine akan menggunakan watak lalai atau anda boleh cipta watak di Studio Watak terlebih dahulu.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeCharacters.map((c) => {
                    const selected = project.assignedCharacterIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCharacter(c.id)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                          selected
                            ? 'cf-selected-ring bg-[#6366F1]/20 text-[var(--cf-text)]'
                            : 'border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-[var(--cf-muted)]'
                        }`}
                      >
                        {c.name} ({c.characterCode})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setStep(1)}>
              {t.creator.steps[1]} <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: Comic Art Style */}
      {step === 1 && (
        <Card className="space-y-5">
          <h2 className="font-bold text-lg">{t.creator.selectStyle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ART_STYLE_IDS.map((styleId) => {
              const spec = ART_STYLES[styleId];
              const selected = project.artStyle === styleId;
              return (
                <button
                  key={styleId}
                  type="button"
                  onClick={() => setProject({ ...project, artStyle: styleId })}
                  className={`rounded-2xl border p-4 text-left transition-all cursor-pointer space-y-1.5 ${
                    selected
                      ? 'cf-selected-ring bg-[#6366F1]/18'
                      : 'border-[var(--cf-border)] bg-[var(--cf-surface-2)]/70 hover:border-[#00D9FF]/50'
                  }`}
                >
                  <div className="font-bold text-sm">
                    {preferences.uiLanguage === 'ms-MY' ? spec.labelMs : spec.labelEn}
                  </div>
                  <div className="text-[11px] text-[var(--cf-muted)] line-clamp-2">
                    {spec.characterRendering}
                  </div>
                </button>
              );
            })}
          </div>

          {project.artStyle === 'Custom Art Style' && (
            <div>
              <Label>Custom Art Style Prompt Instructions</Label>
              <Textarea
                rows={3}
                value={project.customArtStyle || ''}
                onChange={(e) => setProject({ ...project, customArtStyle: e.target.value })}
                placeholder="Describe line art, shading, color palette, and rendering rules..."
              />
            </div>
          )}

          <div className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] p-4 text-xs space-y-1">
            <div className="font-bold text-[#00D9FF]">Style Prompt Spec: {selectedStyleSpec.id}</div>
            <p className="text-[var(--cf-muted)]">Line Art: {selectedStyleSpec.lineArt}</p>
            <p className="text-[var(--cf-muted)]">Shading & Color: {selectedStyleSpec.shading} · {selectedStyleSpec.colorTreatment}</p>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button onClick={() => setStep(2)}>
              {t.creator.steps[2]} <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: Comic Format & Generation Limits */}
      {step === 2 && (
        <Card className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Publishing Format</Label>
              <Select
                value={project.format}
                onChange={(e) => setProject({ ...project, format: e.target.value })}
              >
                {PUBLISHING_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Aspect Ratio</Label>
              <Select
                value={project.aspectRatio}
                onChange={(e) => setProject({ ...project, aspectRatio: e.target.value })}
              >
                {ASPECT_RATIOS.map((ar) => (
                  <option key={ar} value={ar}>
                    {ar}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Target Export Preset</Label>
              <Select
                value={exportTarget}
                onChange={(e) => setExportTarget(e.target.value as ExportTarget)}
              >
                <option value="chatgpt">{t.creator.presetChatGPT}</option>
                <option value="gemini">{t.creator.presetGemini}</option>
              </Select>
            </div>

            <div>
              <Label>Episodes (Max 3 per batch)</Label>
              <Select
                value={project.episodeCount}
                onChange={(e) =>
                  setProject({ ...project, episodeCount: Number(e.target.value) })
                }
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Scenes per Episode (Max 4)</Label>
              <Select
                value={project.scenesPerEpisode}
                onChange={(e) =>
                  setProject({ ...project, scenesPerEpisode: Number(e.target.value) })
                }
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Panels per Scene (Max 6)</Label>
              <Select
                value={project.panelsPerScene}
                onChange={(e) =>
                  setProject({ ...project, panelsPerScene: Number(e.target.value) })
                }
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Collapsible Advanced Prompt Controls */}
          <div className="border-t border-[var(--cf-border)] pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00D9FF] cursor-pointer"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
              {t.creator.advancedControls}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label>{t.creator.selectEngine}</Label>
                  <Select
                    value={engineMode}
                    onChange={(e) => setEngineMode(e.target.value as EngineMode)}
                  >
                    <option value="auto">Auto — Gemini with Local Fallback</option>
                    <option value="gemini">Gemini Only (Report Failure)</option>
                    <option value="local">Local Prompt Engine Only</option>
                  </Select>
                </div>
                <div>
                  <Label>Dialogue Length</Label>
                  <Select
                    value={project.dialogueLength}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        dialogueLength: e.target.value as 'short' | 'medium' | 'detailed',
                      })
                    }
                  >
                    <option value="short">Short & Punchy</option>
                    <option value="medium">Balanced</option>
                    <option value="detailed">Detailed</option>
                  </Select>
                </div>
                <div>
                  <Label>Story Pacing</Label>
                  <Select
                    value={project.pacing}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        pacing: e.target.value as 'fast' | 'balanced' | 'slow-burn',
                      })
                    }
                  >
                    <option value="fast">Fast Action</option>
                    <option value="balanced">Balanced</option>
                    <option value="slow-burn">Slow Burn</option>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleGenerateStory} disabled={loading} size="lg">
              <Sparkles className="w-4 h-4" />
              {loading ? 'Generating...' : t.actions.generateStory}
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: Generated Story, Episodes & Panel Prompts */}
      {step === 3 && (
        <div className="space-y-5">
          {engineError && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-950/50 p-4 text-sm text-rose-200 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{engineError}</span>
            </div>
          )}

          {fallbackNotice && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 text-xs sm:text-sm text-amber-200 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FACC15] shrink-0" />
              <span>{fallbackNotice}</span>
            </div>
          )}

          {!project.storyOutline ? (
            <Card className="text-center py-12 space-y-4">
              <p className="text-sm text-[var(--cf-muted)]">
                Belum ada cerita dijana untuk projek ini.
              </p>
              <Button onClick={handleGenerateStory} disabled={loading}>
                <Sparkles className="w-4 h-4" />
                {loading ? 'Generating...' : t.actions.generateStory}
              </Button>
            </Card>
          ) : (
            <>
              {/* Story Outline Header */}
              <Card className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={project.lastEngineUsed === 'gemini' ? 'indigo' : 'cyan'}>
                        Engine: {project.lastEngineUsed === 'gemini' ? 'Gemini API' : 'Local Prompt Engine'}
                      </Badge>
                      <Badge variant="yellow">{project.artStyle}</Badge>
                      <Badge variant="default">{project.aspectRatio}</Badge>
                    </div>
                    <h2 className="text-xl font-extrabold">{project.storyOutline.title}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={handleGenerateStory} disabled={loading}>
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      {t.actions.regenerate}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadFile(
                          JSON.stringify(project.storyOutline, null, 2),
                          `${project.storyOutline?.title || 'comic'}.json`,
                          'application/json'
                        )
                      }
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t.actions.downloadJson}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-[var(--cf-surface-2)] p-3 border border-[var(--cf-border)]">
                    <span className="font-bold text-[#00D9FF]">World Setting:</span>{' '}
                    {project.storyOutline.world_setting}
                  </div>
                  <div className="rounded-xl bg-[var(--cf-surface-2)] p-3 border border-[var(--cf-border)]">
                    <span className="font-bold text-[#FACC15]">Main Conflict:</span>{' '}
                    {project.storyOutline.main_conflict}
                  </div>
                </div>

                {/* Format Switcher + External Links */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--cf-border)]">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPanelViewMode('human')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        panelViewMode === 'human'
                          ? 'bg-[#6366F1] text-white'
                          : 'bg-[var(--cf-surface-2)] text-[var(--cf-muted)]'
                      }`}
                    >
                      {t.creator.formatA}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanelViewMode('json')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        panelViewMode === 'json'
                          ? 'bg-[#6366F1] text-white'
                          : 'bg-[var(--cf-surface-2)] text-[var(--cf-muted)]'
                      }`}
                    >
                      {t.creator.formatB}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="https://chatgpt.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-[var(--cf-border)] text-xs font-medium hover:border-[#00D9FF]"
                    >
                      {t.actions.openChatGPT} <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://gemini.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-[var(--cf-border)] text-xs font-medium hover:border-[#00D9FF]"
                    >
                      {t.actions.openGemini} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </Card>

              {/* Episodes -> Scenes -> Panels */}
              {project.storyOutline.episodes.map((ep) => (
                <div key={ep.id} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h3 className="text-lg font-bold text-[#00D9FF]">{ep.title}</h3>
                      <p className="text-xs text-[var(--cf-muted)]">{ep.synopsis}</p>
                    </div>
                  </div>

                  {ep.scenes.map((sc) => (
                    <Card key={sc.id} className="space-y-4">
                      <div>
                        <div className="font-bold text-sm">{sc.title}</div>
                        <p className="text-xs text-[var(--cf-muted)]">
                          {sc.description} · Continuity: {sc.continuity_summary}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {sc.panels.map((panel) => {
                          const formatAText =
                            panel.human_readable_prompt || panel.image_prompt;
                          const formatBJson = JSON.stringify(
                            {
                              project_id: panel.project_id,
                              episode_number: panel.episode_number,
                              scene_number: panel.scene_number,
                              panel_number: panel.panel_number,
                              art_style: panel.art_style,
                              aspect_ratio: panel.aspect_ratio,
                              characters: panel.characters,
                              environment: panel.environment,
                              camera: panel.camera,
                              lighting: panel.lighting,
                              dialogue: panel.dialogue,
                              image_prompt: panel.image_prompt,
                              negative_prompt: panel.negative_prompt,
                              continuity_notes: panel.continuity_notes,
                            },
                            null,
                            2
                          );

                          return (
                            <div
                              key={`${sc.id}_p${panel.panel_number}`}
                              className="rounded-2xl border-2 border-[#6366F1]/45 bg-[var(--cf-surface-2)]/90 p-4 space-y-3 animate-comic-pop halftone-bg shadow-[4px_4px_0px_rgba(0,217,255,0.22)]"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-block -skew-x-6 bg-[#FACC15] text-[#090D1A] px-2.5 py-0.5 text-xs font-black uppercase border-2 border-[#090D1A]">
                                    PANEL {panel.panel_number}
                                  </span>
                                  <span className="text-xs font-bold text-[#00D9FF]">
                                    {panel.camera} · {panel.lighting}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="accent"
                                    onClick={() => copyText(formatAText, 'Full Prompt')}
                                  >
                                    <Copy className="w-3 h-3" />
                                    {t.actions.copyPrompt}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      copyText(panel.image_prompt, 'Image Prompt')
                                    }
                                  >
                                    {t.actions.copyImagePrompt}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      copyText(panel.negative_prompt, 'Negative Prompt')
                                    }
                                  >
                                    {t.actions.copyNegativePrompt}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyText(formatBJson, 'JSON')}
                                  >
                                    {t.actions.copyJson}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      downloadFile(
                                        formatAText,
                                        `ep${panel.episode_number}_sc${panel.scene_number}_p${panel.panel_number}.txt`,
                                        'text/plain'
                                      )
                                    }
                                  >
                                    <Download className="w-3 h-3" />
                                    TXT
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleSavePanelPrompt(panel)}
                                  >
                                    <Save className="w-3 h-3" />
                                    {t.actions.savePrompt}
                                  </Button>
                                </div>
                              </div>

                              {/* Comic Dialogue Speech Bubbles Preview */}
                              {panel.dialogue.length > 0 && (
                                <div className="flex flex-wrap gap-2.5 pt-1">
                                  {panel.dialogue.map((d, idx) => (
                                    <div key={idx} className="comic-bubble px-3 py-1.5 text-xs font-semibold">
                                      <span className="font-black text-[#4F46E5]">{d.speaker}:</span> &ldquo;{d.text}&rdquo;
                                    </div>
                                  ))}
                                </div>
                              )}

                              <Textarea
                                rows={panelViewMode === 'human' ? 10 : 12}
                                readOnly
                                value={panelViewMode === 'human' ? formatAText : formatBJson}
                                className="font-mono text-xs"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComicCreatorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--cf-muted)]">Loading Comic Creator...</div>}>
      <ComicCreatorInner />
    </Suspense>
  );
}
