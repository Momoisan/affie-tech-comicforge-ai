'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Copy,
  Edit3,
  History,
  Plus,
  RefreshCw,
  Save,
  Trash2,
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
  CAMERA_ANGLES_V2,
  COMPOSITIONS_V2,
  SHOT_TYPES_V2,
  type PanelRevision,
  type StructuredPanel,
} from '@/types/comicforge';
import { validatePanelContinuity } from '@/lib/v2/continuity-validator';
import { formatPanelHumanReadable } from '@/lib/ai/prompt-formatter';
import { generateId } from '@/lib/utils';

export default function SmartPanelDirectorPage() {
  const { projects, characters, worlds, preferences, saveProject, notify } = useComicForge();
  const isMs = preferences.uiLanguage === 'ms-MY';

  const projectsWithStories = useMemo(
    () => projects.filter((p) => p.storyOutline && p.storyOutline.episodes.length > 0),
    [projects]
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    () => projectsWithStories[0]?.id || ''
  );
  const [epIdx, setEpIdx] = useState(0);
  const [scIdx, setScIdx] = useState(0);
  const [editingPanelIdx, setEditingPanelIdx] = useState<number | null>(null);
  const [pacingPreset, setPacingPreset] = useState<'emotional' | 'action' | 'reveal' | 'comedy'>('action');

  const project = useMemo(
    () => projectsWithStories.find((p) => p.id === selectedProjectId) ?? projectsWithStories[0],
    [projectsWithStories, selectedProjectId]
  );

  const world = useMemo(
    () => worlds.find((w) => w.id === project?.worldId) ?? worlds[0],
    [worlds, project?.worldId]
  );

  const episode = project?.storyOutline?.episodes[epIdx];
  const scene = episode?.scenes[scIdx];
  const panels = scene?.panels ?? [];

  const suggestionText: Record<typeof pacingPreset, string> = {
    emotional: 'Emotional conversation: 3–5 panels recommended',
    action: 'Short action sequence: 4–6 panels recommended',
    reveal: 'Dramatic reveal: 1 large splash panel recommended',
    comedy: 'Comedy setup & punchline: 3–4 panels recommended',
  };

  const updatePanelsInScene = (nextPanels: StructuredPanel[], message?: string) => {
    if (!project || !project.storyOutline || !episode || !scene) return;
    const reindexed = nextPanels.map((p, idx) => ({
      ...p,
      panel_number: idx + 1,
      stable_panel_id: p.stable_panel_id || generateId('pnl'),
    }));

    const nextEpisodes = project.storyOutline.episodes.map((ep, i) =>
      i !== epIdx
        ? ep
        : {
            ...ep,
            scenes: ep.scenes.map((sc, j) => (j !== scIdx ? sc : { ...sc, panels: reindexed })),
          }
    );

    saveProject({
      ...project,
      storyOutline: { ...project.storyOutline, episodes: nextEpisodes },
      updatedAt: new Date().toISOString(),
    });
    if (message) notify(message, 'success');
  };

  const handleDuplicatePanel = (idx: number) => {
    const src = panels[idx];
    if (!src) return;
    const copy: StructuredPanel = {
      ...src,
      stable_panel_id: generateId('pnl'),
      revisions: [],
    };
    const next = [...panels];
    next.splice(idx + 1, 0, copy);
    updatePanelsInScene(next, `Panel ${idx + 1} duplicated!`);
  };

  const handleDeletePanel = (idx: number) => {
    if (panels.length <= 1) {
      notify('Scene must keep at least 1 panel.', 'error');
      return;
    }
    const next = panels.filter((_, i) => i !== idx);
    setEditingPanelIdx(null);
    updatePanelsInScene(next, 'Panel deleted.');
  };

  const handleMovePanel = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= panels.length) return;
    const next = [...panels];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    updatePanelsInScene(next, 'Panel order updated.');
  };

  const handleRegenerateSinglePanel = (idx: number) => {
    const current = panels[idx];
    if (!current || !project) return;
    const rev: PanelRevision = {
      revisionNumber: (current.revisions?.length ?? 0) + 1,
      camera: current.camera,
      shotType: current.shot_type || 'Medium Shot',
      composition: current.composition,
      lighting: current.lighting,
      dialogue: current.dialogue,
      imagePrompt: current.image_prompt,
      negativePrompt: current.negative_prompt,
      engineUsed: 'local',
      createdAt: new Date().toISOString(),
    };

    const effectiveStyle = current.art_style_override || current.art_style;
    const updatedImagePrompt = `${effectiveStyle} comic panel (${current.aspect_ratio}). ${current.shot_type || 'Medium Shot'}, ${current.camera}, ${current.composition}. Environment: ${current.environment}. Lighting: ${current.lighting}. ${current.scene_purpose ? `Purpose: ${current.scene_purpose}.` : ''} Characters: ${current.characters.map((c) => `${c.name} (${c.expression}, ${c.action})`).join('; ')}. ${current.sound_effects ? `SFX cue: ${current.sound_effects}.` : ''} No speech bubbles inside artwork.`;

    const updatedPanel: StructuredPanel = {
      ...current,
      image_prompt: updatedImagePrompt,
      revisions: [rev, ...(current.revisions ?? [])].slice(0, 10),
    };
    updatedPanel.human_readable_prompt = formatPanelHumanReadable(
      updatedPanel,
      project.title,
      characters,
      preferences.exportTarget,
      project.customArtStyle
    );

    const next = panels.map((p, i) => (i === idx ? updatedPanel : p));
    updatePanelsInScene(next, `Panel ${idx + 1} prompt regenerated (Revision #${rev.revisionNumber} saved)!`);
  };

  const editingPanel = editingPanelIdx !== null ? panels[editingPanelIdx] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="-skew-x-6 bg-[#FACC15] text-[#090D1A] px-2.5 py-0.5 text-xs font-black uppercase border-2 border-[#090D1A]">
              V2.0 PANEL DIRECTOR
            </span>
            <Badge variant="cyan">Storyboard &amp; Revisions</Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Smart Panel Director</h1>
          <p className="text-sm text-[var(--cf-muted)]">
            {isMs
              ? 'Sunting, susun semula, dan jana semula panel secara individu tanpa menjejaskan panel lain.'
              : 'Edit, reorder, duplicate, and regenerate individual comic panels with revision history and continuity checks.'}
          </p>
        </div>
      </div>

      {projectsWithStories.length === 0 ? (
        <Card className="text-center py-12 space-y-3">
          <p className="text-sm text-[var(--cf-muted)]">
            {isMs
              ? 'Belum ada projek yang mempunyai cerita dijana. Sila jana cerita di Cipta Komik dahulu.'
              : 'No generated comic stories yet. Generate an episode in Comic Creator first.'}
          </p>
        </Card>
      ) : (
        <>
          {/* Project / Episode / Scene Selector + Pacing Suggestions */}
          <Card className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label>Project</Label>
              <Select
                value={project?.id || ''}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setEpIdx(0);
                  setScIdx(0);
                  setEditingPanelIdx(null);
                }}
              >
                {projectsWithStories.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Episode</Label>
              <Select
                value={epIdx}
                onChange={(e) => {
                  setEpIdx(Number(e.target.value));
                  setScIdx(0);
                  setEditingPanelIdx(null);
                }}
              >
                {project?.storyOutline?.episodes.map((ep, idx) => (
                  <option key={ep.id} value={idx}>
                    Ep {ep.episode_number}: {ep.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Scene</Label>
              <Select
                value={scIdx}
                onChange={(e) => {
                  setScIdx(Number(e.target.value));
                  setEditingPanelIdx(null);
                }}
              >
                {episode?.scenes.map((sc, idx) => (
                  <option key={sc.id} value={idx}>
                    Scene {sc.scene_number}: {sc.location}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Pacing Suggestion</Label>
              <Select
                value={pacingPreset}
                onChange={(e) => setPacingPreset(e.target.value as typeof pacingPreset)}
              >
                <option value="emotional">Emotional Conversation</option>
                <option value="action">Short Action Sequence</option>
                <option value="reveal">Dramatic Reveal</option>
                <option value="comedy">Comedy Setup &amp; Punchline</option>
              </Select>
              <p className="text-[11px] text-[#00D9FF] mt-1">{suggestionText[pacingPreset]}</p>
            </div>
          </Card>

          {/* Storyboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {panels.map((panel, idx) => {
              const warnings = validatePanelContinuity(
                panel,
                panels[idx - 1],
                panels[idx + 1],
                world
              );
              return (
                <Card
                  key={panel.stable_panel_id || `p_${idx}`}
                  className={`flex flex-col justify-between space-y-3 ${
                    editingPanelIdx === idx ? 'cf-selected-ring' : ''
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="-skew-x-6 bg-[#FACC15] text-[#090D1A] px-2.5 py-0.5 text-xs font-black border-2 border-[#090D1A]">
                        PANEL {panel.panel_number}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMovePanel(idx, -1)}
                          className="p-1.5 rounded-lg border border-[var(--cf-border)] hover:border-[#00D9FF] cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePanel(idx, 1)}
                          className="p-1.5 rounded-lg border border-[var(--cf-border)] hover:border-[#00D9FF] cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Neutral Storyboard Placeholder (No fake AI images) */}
                    <div className="rounded-xl border border-dashed border-[var(--cf-border)] bg-[var(--cf-surface-2)] p-3 text-xs space-y-1">
                      <div className="font-bold text-[#00D9FF]">
                        {panel.shot_type || 'Medium Shot'} · {panel.camera}
                      </div>
                      <p className="text-[var(--cf-muted)] line-clamp-2">
                        {panel.scene_context || panel.environment}
                      </p>
                      {panel.characters.length > 0 && (
                        <div className="text-[11px] text-[var(--cf-text)]">
                          Cast: {panel.characters.map((c) => `${c.name} (${c.expression})`).join(', ')}
                        </div>
                      )}
                    </div>

                    {panel.dialogue.length > 0 && (
                      <div className="comic-bubble px-2.5 py-1.5 text-xs font-semibold">
                        {panel.dialogue[0].speaker}: &ldquo;{panel.dialogue[0].text}&rdquo;
                      </div>
                    )}

                    {warnings.map((w) => (
                      <div
                        key={w.id}
                        className="rounded-lg bg-amber-950/40 border border-amber-500/40 px-2.5 py-1.5 text-[11px] text-amber-200 flex items-start gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FACC15]" />
                        <span>{w.message}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--cf-border)]">
                    <Button
                      size="sm"
                      onClick={() => setEditingPanelIdx(editingPanelIdx === idx ? null : idx)}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRegenerateSinglePanel(idx)}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Regen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          panel.human_readable_prompt || panel.image_prompt
                        );
                        notify(`Panel ${panel.panel_number} prompt copied!`, 'success');
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicatePanel(idx)}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeletePanel(idx)}>
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Panel-Level Editor Drawer/Card */}
          {editingPanel && editingPanelIdx !== null && (
            <Card className="space-y-4 cf-selected-ring">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base">
                  Editing Panel {editingPanel.panel_number} (Independent Revision)
                </h2>
                <Badge variant="indigo">
                  Revisions: {editingPanel.revisions?.length ?? 0}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label>Camera Angle</Label>
                  <Select
                    value={editingPanel.camera}
                    onChange={(e) => {
                      const next = panels.map((p, i) =>
                        i === editingPanelIdx ? { ...p, camera: e.target.value } : p
                      );
                      updatePanelsInScene(next);
                    }}
                  >
                    {CAMERA_ANGLES_V2.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Shot Type</Label>
                  <Select
                    value={editingPanel.shot_type || 'Medium Shot'}
                    onChange={(e) => {
                      const next = panels.map((p, i) =>
                        i === editingPanelIdx ? { ...p, shot_type: e.target.value } : p
                      );
                      updatePanelsInScene(next);
                    }}
                  >
                    {SHOT_TYPES_V2.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Composition</Label>
                  <Select
                    value={editingPanel.composition}
                    onChange={(e) => {
                      const next = panels.map((p, i) =>
                        i === editingPanelIdx ? { ...p, composition: e.target.value } : p
                      );
                      updatePanelsInScene(next);
                    }}
                  >
                    {COMPOSITIONS_V2.map((comp) => (
                      <option key={comp} value={comp}>
                        {comp}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Art Style Override</Label>
                  <Select
                    value={editingPanel.art_style_override || editingPanel.art_style}
                    onChange={(e) => {
                      const next = panels.map((p, i) =>
                        i === editingPanelIdx ? { ...p, art_style_override: e.target.value } : p
                      );
                      updatePanelsInScene(next);
                    }}
                  >
                    {ART_STYLE_IDS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Environment</Label>
                  <Input
                    value={editingPanel.environment}
                    onChange={(e) => {
                      const next = panels.map((p, i) =>
                        i === editingPanelIdx ? { ...p, environment: e.target.value } : p
                      );
                      updatePanelsInScene(next);
                    }}
                  />
                </div>
                <div>
                  <Label>Lighting</Label>
                  <Input
                    value={editingPanel.lighting}
                    onChange={(e) => {
                      const next = panels.map((p, i) =>
                        i === editingPanelIdx ? { ...p, lighting: e.target.value } : p
                      );
                      updatePanelsInScene(next);
                    }}
                  />
                </div>
                <div>
                  <Label>Sound Effects (SFX)</Label>
                  <Input
                    value={editingPanel.sound_effects || ''}
                    placeholder="e.g. WHOOSH! / BEEP!"
                    onChange={(e) => {
                      const next = panels.map((p, i) =>
                        i === editingPanelIdx ? { ...p, sound_effects: e.target.value } : p
                      );
                      updatePanelsInScene(next);
                    }}
                  />
                </div>
                <div>
                  <Label>Scene Purpose</Label>
                  <Input
                    value={editingPanel.scene_purpose || ''}
                    placeholder="e.g. Tension escalation"
                    onChange={(e) => {
                      const next = panels.map((p, i) =>
                        i === editingPanelIdx ? { ...p, scene_purpose: e.target.value } : p
                      );
                      updatePanelsInScene(next);
                    }}
                  />
                </div>
              </div>

              <div>
                <Label>Image Prompt</Label>
                <Textarea
                  rows={3}
                  value={editingPanel.image_prompt}
                  onChange={(e) => {
                    const next = panels.map((p, i) =>
                      i === editingPanelIdx ? { ...p, image_prompt: e.target.value } : p
                    );
                    updatePanelsInScene(next);
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleRegenerateSinglePanel(editingPanelIdx)}>
                  <Save className="w-4 h-4" /> Save &amp; Regenerate Panel Prompt
                </Button>
                {(editingPanel.revisions?.length ?? 0) > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const prev = editingPanel.revisions?.[0];
                      if (!prev) return;
                      const restored: StructuredPanel = {
                        ...editingPanel,
                        camera: prev.camera,
                        shot_type: prev.shotType,
                        composition: prev.composition,
                        lighting: prev.lighting,
                        dialogue: prev.dialogue,
                        image_prompt: prev.imagePrompt,
                        negative_prompt: prev.negativePrompt,
                      };
                      const next = panels.map((p, i) => (i === editingPanelIdx ? restored : p));
                      updatePanelsInScene(next, `Restored Revision #${prev.revisionNumber}!`);
                    }}
                  >
                    <History className="w-4 h-4" /> Restore Last Revision
                  </Button>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
