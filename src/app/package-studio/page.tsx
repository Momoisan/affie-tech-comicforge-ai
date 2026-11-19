'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  History,
  Package,
} from 'lucide-react';
import { useComicForge } from '@/components/providers/comicforge-provider';
import {
  Badge,
  Button,
  Card,
  Label,
  Select,
  Textarea,
} from '@/components/ui/primitives';
import type { ExportTarget, PromptPackage } from '@/types/comicforge';
import { buildPromptPackage, validatePromptPackage } from '@/lib/v2/prompt-package';

export default function PromptPackageStudioPage() {
  const {
    projects,
    characters,
    worlds,
    promptPackages,
    savePromptPackage,
    preferences,
    notify,
  } = useComicForge();
  const isMs = preferences.uiLanguage === 'ms-MY';

  const projectsWithStories = useMemo(
    () => projects.filter((p) => p.storyOutline && p.storyOutline.episodes.length > 0),
    [projects]
  );

  const [projectId, setProjectId] = useState<string>(() => projectsWithStories[0]?.id || '');
  const [epIdx, setEpIdx] = useState(0);
  const [scIdx, setScIdx] = useState(0);
  const [panelIdx, setPanelIdx] = useState(0);
  const [target, setTarget] = useState<ExportTarget>(preferences.exportTarget);
  const [activePkg, setActivePkg] = useState<PromptPackage | null>(null);

  const project = useMemo(
    () => projectsWithStories.find((p) => p.id === projectId) ?? projectsWithStories[0],
    [projectsWithStories, projectId]
  );
  const world = useMemo(
    () => worlds.find((w) => w.id === project?.worldId) ?? worlds[0],
    [worlds, project?.worldId]
  );

  const episodes = project?.storyOutline?.episodes ?? [];
  const scenes = episodes[epIdx]?.scenes ?? [];
  const panels = scenes[scIdx]?.panels ?? [];
  const selectedPanel = panels[panelIdx];

  const handleBuildPackage = () => {
    if (!project || !selectedPanel) return;
    const version = promptPackages.filter((p) => p.projectId === project.id).length + 1;
    const pkg = buildPromptPackage({
      project,
      panel: selectedPanel,
      characters,
      world,
      targetPlatform: target,
      engineUsed: project.lastEngineUsed ?? 'local',
      version,
    });
    setActivePkg(pkg);
    savePromptPackage(pkg);
    notify(`Prompt Package v${version} (${target.toUpperCase()}) generated!`, 'success');
  };

  const warnings = useMemo(
    () => (activePkg ? validatePromptPackage(activePkg) : []),
    [activePkg]
  );

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    notify(`${label} copied!`, 'success');
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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="-skew-x-6 bg-[#00D9FF] text-[#090D1A] px-2.5 py-0.5 text-xs font-black uppercase border-2 border-[#090D1A]">
            V2.0 PROMPT PACKAGE STUDIO
          </span>
          <Badge variant="indigo">ChatGPT Images &amp; Gemini</Badge>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">One-Click Prompt Package Studio</h1>
        <p className="text-sm text-[var(--cf-muted)]">
          {isMs
            ? 'Hasilkan pakej prompt lengkap 12-bahagian dengan pengesahan kualiti dan sejarah versi.'
            : 'Generate complete 12-part prompt packages with quality validation and version history.'}
        </p>
      </div>

      {projectsWithStories.length === 0 ? (
        <Card className="text-center py-12 text-sm text-[var(--cf-muted)]">
          {isMs
            ? 'Belum ada projek cerita dijana. Jana cerita di Cipta Komik dahulu.'
            : 'No generated comic projects yet. Generate a story in Comic Creator first.'}
        </Card>
      ) : (
        <Card className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label>Project</Label>
              <Select
                value={project?.id || ''}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setEpIdx(0);
                  setScIdx(0);
                  setPanelIdx(0);
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
                  setPanelIdx(0);
                }}
              >
                {episodes.map((ep, i) => (
                  <option key={ep.id} value={i}>
                    Ep {ep.episode_number}
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
                  setPanelIdx(0);
                }}
              >
                {scenes.map((sc, i) => (
                  <option key={sc.id} value={i}>
                    Scene {sc.scene_number}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Panel</Label>
              <Select value={panelIdx} onChange={(e) => setPanelIdx(Number(e.target.value))}>
                {panels.map((p, i) => (
                  <option key={p.stable_panel_id || i} value={i}>
                    Panel {p.panel_number}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>External AI Preset</Label>
              <Select value={target} onChange={(e) => setTarget(e.target.value as ExportTarget)}>
                <option value="chatgpt">ChatGPT Images</option>
                <option value="gemini">Google Gemini</option>
              </Select>
            </div>
          </div>

          <Button onClick={handleBuildPackage} size="lg">
            <Package className="w-4 h-4" /> Generate Prompt Package
          </Button>
        </Card>
      )}

      {activePkg && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="yellow">v{activePkg.version}</Badge>
              <Badge variant="cyan">{activePkg.targetPlatform.toUpperCase()}</Badge>
              <Badge variant="indigo">
                Engine: {activePkg.engineUsed === 'gemini' ? 'Gemini' : 'Local Engine'}
              </Badge>
            </div>
            {warnings.length === 0 ? (
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3" /> Quality Check Passed
              </Badge>
            ) : (
              <Badge variant="yellow">{warnings.length} Quality Notice(s)</Badge>
            )}
          </div>

          {warnings.map((w) => (
            <div
              key={w.code}
              className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-[#FACC15] shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="accent" onClick={() => copy(activePkg.fullPackageText, 'Full Package')}>
              <Copy className="w-3.5 h-3.5" /> Copy Full Package
            </Button>
            <Button size="sm" variant="outline" onClick={() => copy(activePkg.mainImagePrompt, 'Image Prompt')}>
              Copy Image Prompt
            </Button>
            <Button size="sm" variant="outline" onClick={() => copy(activePkg.characterReferenceInstructions, 'Character Ref')}>
              Copy Character Reference
            </Button>
            <Button size="sm" variant="outline" onClick={() => copy(activePkg.negativePrompt, 'Negative Prompt')}>
              Copy Negative Prompt
            </Button>
            <Button size="sm" variant="outline" onClick={() => copy(JSON.stringify(activePkg.jsonExport, null, 2), 'JSON')}>
              Copy JSON
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadFile(activePkg.fullPackageText, `${activePkg.id}.txt`, 'text/plain')}
            >
              <Download className="w-3.5 h-3.5" /> Download TXT
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                downloadFile(
                  JSON.stringify(activePkg.jsonExport, null, 2),
                  `${activePkg.id}.json`,
                  'application/json'
                )
              }
            >
              <Download className="w-3.5 h-3.5" /> Download JSON
            </Button>
          </div>

          <Textarea rows={16} readOnly value={activePkg.fullPackageText} className="font-mono text-xs" />
        </Card>
      )}

      {/* Package Version History */}
      {promptPackages.length > 0 && (
        <Card className="space-y-3">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-[#00D9FF]" />
            Prompt Package Version History ({promptPackages.length})
          </h2>
          <div className="space-y-2">
            {promptPackages.slice(0, 8).map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] p-3 flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold">{pkg.projectTitle}</span> · v{pkg.version} ·{' '}
                  <span className="text-[#00D9FF]">{pkg.targetPlatform.toUpperCase()}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActivePkg(pkg)}>
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
