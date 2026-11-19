'use client';

import React, { useMemo, useState } from 'react';
import {
  Archive,
  Check,
  Copy,
  ExternalLink,
  ImagePlus,
  Lock,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
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
  CHARACTER_EXPRESSIONS,
  CHARACTER_VISUAL_STYLES,
  FANTASY_SPECIES,
  POSE_PRESETS,
  type CharacterProfile,
  type ExportTarget,
} from '@/types/comicforge';
import { generateId } from '@/lib/utils';
import { buildCanonicalIdentityBlock } from '@/lib/ai/prompt-formatter';
import { validateCharacterConsistency } from '@/lib/v2/continuity-validator';
import { buildCharacterContinuityPrompt } from '@/lib/v2/prompt-package';

function createBlankCharacter(index: number): CharacterProfile {
  const now = '';
  return {
    id: `char_draft_${index + 1}`,
    characterCode: `CHAR-${String(index + 1).padStart(3, '0')}`,
    name: '',
    genderIdentity: 'Female',
    ageRange: 'Young Adult (18-24)',
    nationality: 'Malaysian',
    role: 'Protagonist',
    personality: '',
    biography: '',
    faceShape: 'Oval',
    skinTone: 'Warm tan',
    eyeShape: 'Almond',
    eyeColor: 'Dark brown',
    hairStyle: 'Shoulder-length layered',
    hairColor: 'Jet black',
    height: '165 cm (Average)',
    bodyBuild: 'Slim athletic',
    distinguishingFeatures: 'None',
    primaryOutfit: '',
    secondaryOutfit: '',
    outfitColors: '',
    accessories: '',
    footwear: '',
    defaultExpression: 'Neutral',
    customExpression: '',
    visualStyle: 'Webtoon',
    customVisualStyle: '',
    identityLock: {
      lockNameAndId: true,
      lockFacialStructure: true,
      lockHair: true,
      lockEyeColor: true,
      lockSkinTone: true,
      lockSignatureOutfit: true,
      lockAccessories: true,
      lockDistinguishingFeatures: true,
      lockArtStyle: true,
      canonicalIdentityBlock: '',
    },
    referencePrompt: '',
    version: 1,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

export default function CharacterStudioPage() {
  const {
    t,
    characters,
    preferences,
    saveCharacter,
    duplicateCharacter,
    archiveCharacter,
    deleteCharacter,
    savePrompt,
    notify,
  } = useComicForge();

  const [form, setForm] = useState<CharacterProfile>(() => createBlankCharacter(characters.length));
  const [activeTab, setActiveTab] = useState<'identity' | 'appearance' | 'outfit' | 'lock'>('identity');
  const [search, setSearch] = useState('');
  const [exportTarget, setExportTarget] = useState<ExportTarget>(preferences.exportTarget);
  const [generatingRef, setGeneratingRef] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const filteredCharacters = useMemo(() => {
    const q = search.trim().toLowerCase();
    return characters.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.characterCode.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
      );
    });
  }, [characters, search]);

  const canonicalPreview = useMemo(() => buildCanonicalIdentityBlock(form), [form]);

  const handleNew = () => {
    setForm(createBlankCharacter(characters.length));
    setActiveTab('identity');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      notify('Sila masukkan nama watak / Please enter character name.', 'error');
      return;
    }
    const now = new Date().toISOString();
    const toSave: CharacterProfile = {
      ...form,
      id: form.id.startsWith('char_draft_') ? generateId('char') : form.id,
      createdAt: form.createdAt || now,
      identityLock: {
        ...form.identityLock,
        canonicalIdentityBlock: canonicalPreview,
      },
      updatedAt: now,
    };
    saveCharacter(toSave);
    setForm(toSave);
    notify(`Watak "${toSave.name}" disimpan!`, 'success');
  };

  const handleGenerateReference = async () => {
    if (!form.name.trim()) {
      notify('Masukkan nama watak sebelum menjana prompt rujukan.', 'error');
      return;
    }
    setGeneratingRef(true);
    try {
      const res = await fetch('/api/character-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engineMode: preferences.preferredEngine,
          exportTarget,
          character: {
            ...form,
            identityLock: {
              ...form.identityLock,
              canonicalIdentityBlock: canonicalPreview,
            },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        notify(data.message || 'Gagal menjana prompt rujukan.', 'error');
        return;
      }
      const updated: CharacterProfile = {
        ...form,
        referencePrompt: data.referencePrompt,
        identityLock: {
          ...form.identityLock,
          canonicalIdentityBlock: data.canonicalIdentityBlock,
        },
        updatedAt: new Date().toISOString(),
      };
      setForm(updated);
      saveCharacter(updated);
      savePrompt({
        id: generateId('prm'),
        characterId: updated.id,
        characterName: updated.name,
        promptType: 'character_reference',
        engineUsed: 'local',
        fallbackUsed: false,
        artStyle: updated.visualStyle,
        exportTarget,
        promptText: data.referencePrompt,
        structuredOutput: {
          character_id: updated.characterCode,
          name: updated.name,
          canonical_identity_block: data.canonicalIdentityBlock,
        },
        tags: ['character-reference', updated.visualStyle],
        createdAt: new Date().toISOString(),
      });
      setActiveTab('lock');
      notify('Prompt Rujukan Watak berjaya dijana!', 'success');
    } catch {
      notify('Ralat rangkaian semasa menjana prompt rujukan.', 'error');
    } finally {
      setGeneratingRef(false);
    }
  };

  const handleCopyRef = async () => {
    if (!form.referencePrompt) return;
    await navigator.clipboard.writeText(form.referencePrompt);
    setCopiedRef(true);
    notify('Prompt rujukan disalin ke papan keratan!', 'success');
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      notify('Hanya fail PNG, JPG, atau WebP dibenarkan.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('Saiz fail melebihi had 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : undefined;
      if (result) {
        const updated = { ...form, referenceImageUrl: result };
        setForm(updated);
        notify('Gambar rujukan dilampirkan pada profil watak.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t.characters.title}</h1>
          <p className="text-sm text-[var(--cf-muted)]">{t.characters.subtitle}</p>
        </div>
        <Button onClick={handleNew} variant="secondary">
          <UserPlus className="w-4 h-4 text-[#00D9FF]" />
          {t.actions.createCharacter}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Character Editor */}
        <Card className="xl:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--cf-border)] pb-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['identity', t.characters.identityTab],
                  ['appearance', t.characters.appearanceTab],
                  ['outfit', t.characters.outfitTab],
                  ['lock', t.characters.lockTab],
                ] as const
              ).map(([tabKey, tabLabel]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tabKey
                      ? 'bg-[#6366F1] text-white'
                      : 'bg-[var(--cf-surface-2)] text-[var(--cf-muted)] hover:text-[var(--cf-text)]'
                  }`}
                >
                  {tabLabel}
                </button>
              ))}
            </div>
            <Badge variant="indigo">v{form.version}</Badge>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {activeTab === 'identity' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="char-name">Character Name *</Label>
                  <Input
                    id="char-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Alya Sofea"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="char-code">Character ID</Label>
                  <Input
                    id="char-code"
                    value={form.characterCode}
                    onChange={(e) => setForm({ ...form, characterCode: e.target.value })}
                    placeholder="CHAR-001"
                  />
                </div>
                <div>
                  <Label htmlFor="char-gender">Gender / Identity</Label>
                  <Input
                    id="char-gender"
                    value={form.genderIdentity}
                    onChange={(e) => setForm({ ...form, genderIdentity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="char-age">Age / Age Range</Label>
                  <Input
                    id="char-age"
                    value={form.ageRange}
                    onChange={(e) => setForm({ ...form, ageRange: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="char-nat">Nationality</Label>
                  <Input
                    id="char-nat"
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="char-role">Role</Label>
                  <Input
                    id="char-role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="Protagonist / Rival / Mentor"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="char-personality">Personality</Label>
                  <Input
                    id="char-personality"
                    value={form.personality}
                    onChange={(e) => setForm({ ...form, personality: e.target.value })}
                    placeholder="Cheerful, brave, slightly impulsive"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="char-bio">Character Biography</Label>
                  <Textarea
                    id="char-bio"
                    rows={3}
                    value={form.biography}
                    onChange={(e) => setForm({ ...form, biography: e.target.value })}
                    placeholder="Background story, motivation, and key relationships..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Face Shape</Label>
                  <Input
                    value={form.faceShape}
                    onChange={(e) => setForm({ ...form, faceShape: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Skin Tone</Label>
                  <Input
                    value={form.skinTone}
                    onChange={(e) => setForm({ ...form, skinTone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Eye Shape</Label>
                  <Input
                    value={form.eyeShape}
                    onChange={(e) => setForm({ ...form, eyeShape: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Eye Color</Label>
                  <Input
                    value={form.eyeColor}
                    onChange={(e) => setForm({ ...form, eyeColor: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hair Style</Label>
                  <Input
                    value={form.hairStyle}
                    onChange={(e) => setForm({ ...form, hairStyle: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hair Color</Label>
                  <Input
                    value={form.hairColor}
                    onChange={(e) => setForm({ ...form, hairColor: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Body Build</Label>
                  <Input
                    value={form.bodyBuild}
                    onChange={(e) => setForm({ ...form, bodyBuild: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Distinguishing Features</Label>
                  <Input
                    value={form.distinguishingFeatures}
                    onChange={(e) =>
                      setForm({ ...form, distinguishingFeatures: e.target.value })
                    }
                    placeholder="e.g. Small scar on left eyebrow, silver hairpin, freckles"
                  />
                </div>
              </div>
            )}

            {activeTab === 'outfit' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Primary Outfit</Label>
                  <Input
                    value={form.primaryOutfit}
                    onChange={(e) => setForm({ ...form, primaryOutfit: e.target.value })}
                    placeholder="e.g. Navy school blazer over white collar shirt and pleated skirt"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Secondary Outfit</Label>
                  <Input
                    value={form.secondaryOutfit}
                    onChange={(e) => setForm({ ...form, secondaryOutfit: e.target.value })}
                    placeholder="Optional casual or action outfit"
                  />
                </div>
                <div>
                  <Label>Outfit Colors</Label>
                  <Input
                    value={form.outfitColors}
                    onChange={(e) => setForm({ ...form, outfitColors: e.target.value })}
                    placeholder="Navy blue, cyan, crisp white"
                  />
                </div>
                <div>
                  <Label>Accessories</Label>
                  <Input
                    value={form.accessories}
                    onChange={(e) => setForm({ ...form, accessories: e.target.value })}
                    placeholder="Smartwatch, sling bag, glasses"
                  />
                </div>
                <div>
                  <Label>Footwear</Label>
                  <Input
                    value={form.footwear}
                    onChange={(e) => setForm({ ...form, footwear: e.target.value })}
                    placeholder="White canvas sneakers"
                  />
                </div>
                <div>
                  <Label>Default Expression</Label>
                  <Select
                    value={form.defaultExpression}
                    onChange={(e) =>
                      setForm({ ...form, defaultExpression: e.target.value })
                    }
                  >
                    {CHARACTER_EXPRESSIONS.map((ex) => (
                      <option key={ex} value={ex}>
                        {ex}
                      </option>
                    ))}
                  </Select>
                </div>
                {form.defaultExpression === 'Custom Expression' && (
                  <div className="sm:col-span-2">
                    <Label>Custom Expression Description</Label>
                    <Input
                      value={form.customExpression}
                      onChange={(e) =>
                        setForm({ ...form, customExpression: e.target.value })
                      }
                    />
                  </div>
                )}
                <div>
                  <Label>Visual Style</Label>
                  <Select
                    value={form.visualStyle}
                    onChange={(e) => setForm({ ...form, visualStyle: e.target.value })}
                  >
                    {CHARACTER_VISUAL_STYLES.map((vs) => (
                      <option key={vs} value={vs}>
                        {vs}
                      </option>
                    ))}
                  </Select>
                </div>
                {form.visualStyle === 'Custom' && (
                  <div>
                    <Label>Custom Visual Style</Label>
                    <Input
                      value={form.customVisualStyle}
                      onChange={(e) =>
                        setForm({ ...form, customVisualStyle: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lock' && (
              <div className="space-y-5">
                <div className="rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 p-3.5 text-xs text-[var(--cf-muted)] flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-[#00D9FF] shrink-0 mt-0.5" />
                  <span>{t.characters.lockNote}</span>
                </div>

                {/* Lockable Properties */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      ['lockNameAndId', 'Name & ID'],
                      ['lockFacialStructure', 'Facial Structure'],
                      ['lockHair', 'Hair'],
                      ['lockEyeColor', 'Eye Color'],
                      ['lockSkinTone', 'Skin Tone'],
                      ['lockSignatureOutfit', 'Signature Outfit'],
                      ['lockAccessories', 'Accessories'],
                      ['lockDistinguishingFeatures', 'Distinguishing Marks'],
                      ['lockArtStyle', 'Art Style'],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] px-3 py-2 text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.identityLock[key]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            identityLock: {
                              ...form.identityLock,
                              [key]: e.target.checked,
                            },
                          })
                        }
                        className="accent-[#6366F1]"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <Label>Canonical Character Identity Block (Auto-Injected in Panels)</Label>
                  <div className="rounded-xl border border-[#00D9FF]/30 bg-[var(--cf-surface-2)] p-3 text-xs font-mono leading-relaxed">
                    {canonicalPreview}
                  </div>
                </div>

                {/* Reference Image Upload */}
                <div className="space-y-2">
                  <Label>{t.characters.uploadRefLabel}</Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <label className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-xs font-semibold cursor-pointer hover:border-[#00D9FF]/60">
                      <ImagePlus className="w-4 h-4 text-[#00D9FF]" />
                      <span>Choose Image</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-[var(--cf-muted)]">
                      {t.characters.uploadRefHint}
                    </span>
                  </div>
                  {form.referenceImageUrl && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={form.referenceImageUrl}
                        alt={form.name || 'Character reference'}
                        className="w-24 h-24 object-cover rounded-xl border border-[var(--cf-border)]"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setForm({ ...form, referenceImageUrl: undefined })}
                      >
                        Remove Image
                      </Button>
                    </div>
                  )}
                </div>

                {/* Generate Reference Prompt */}
                <div className="space-y-3 pt-2 border-t border-[var(--cf-border)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Select
                        value={exportTarget}
                        onChange={(e) => setExportTarget(e.target.value as ExportTarget)}
                        className="w-44 h-9 text-xs"
                      >
                        <option value="chatgpt">ChatGPT Images</option>
                        <option value="gemini">Google Gemini</option>
                      </Select>
                      <Button
                        type="button"
                        onClick={handleGenerateReference}
                        disabled={generatingRef}
                      >
                        <Sparkles className="w-4 h-4" />
                        {t.actions.generateRefPrompt}
                      </Button>
                    </div>
                  </div>

                  {form.referencePrompt && (
                    <div className="space-y-2">
                      <Textarea
                        rows={8}
                        value={form.referencePrompt}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="accent" onClick={handleCopyRef}>
                          {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {t.actions.copyPrompt}
                        </Button>
                        <a
                          href="https://chatgpt.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--cf-border)] text-xs font-medium hover:border-[#00D9FF]"
                        >
                          {t.actions.openChatGPT}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href="https://gemini.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--cf-border)] text-xs font-medium hover:border-[#00D9FF]"
                        >
                          {t.actions.openGemini}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* V2.0: Species, Pose, Versions, Outfits & Continuity Prompt */}
                <div className="space-y-4 pt-4 border-t border-[var(--cf-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#00D9FF]">
                      V2.0 Consistency, Versions &amp; Outfit Library
                    </span>
                    <Badge variant="indigo">v{form.version}</Badge>
                  </div>

                  {validateCharacterConsistency(form).map((w) => (
                    <div
                      key={w.id}
                      className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-2.5 text-xs text-amber-200"
                    >
                      <strong>{w.message}</strong> — {w.suggestion}
                    </div>
                  ))}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Species</Label>
                      <Select
                        value={form.species || 'Human'}
                        onChange={(e) => setForm({ ...form, species: e.target.value })}
                      >
                        {FANTASY_SPECIES.map((sp) => (
                          <option key={sp} value={sp}>
                            {sp}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label>Default Pose Preset</Label>
                      <Select
                        value={form.defaultPose || 'Standing'}
                        onChange={(e) => setForm({ ...form, defaultPose: e.target.value })}
                      >
                        {POSE_PRESETS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const nextVer = (form.versions?.length ?? 0) + 1;
                        const entry = {
                          versionNumber: nextVer,
                          label: nextVer === 1 ? 'Base Version' : `Evolution v${nextVer}`,
                          ageRange: form.ageRange,
                          outfitName: form.primaryOutfit || 'Signature Outfit',
                          hairStyle: form.hairStyle,
                          equipment: form.accessories,
                          physicalCondition: 'Healthy',
                          status: 'active' as const,
                          notes: '',
                          createdAt: new Date().toISOString(),
                        };
                        setForm({
                          ...form,
                          version: nextVer,
                          versions: [...(form.versions ?? []), entry],
                        });
                        notify(`Added Character Version v${nextVer}`, 'success');
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Character Version
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const outfit = {
                          id: generateId('out'),
                          name: `Outfit ${(form.outfits?.length ?? 0) + 1}`,
                          category: 'Casual',
                          description: form.primaryOutfit || 'Custom outfit',
                          colors: form.outfitColors || 'Balanced',
                          accessories: form.accessories || '',
                          footwear: form.footwear || '',
                        };
                        setForm({
                          ...form,
                          outfits: [...(form.outfits ?? []), outfit],
                        });
                        notify(`Saved "${outfit.name}" to Outfit Library`, 'success');
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Save Current to Outfit Library
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="accent"
                      onClick={async () => {
                        const txt = buildCharacterContinuityPrompt(form, form.version);
                        await navigator.clipboard.writeText(txt);
                        notify('Character Continuity Prompt disalin!', 'success');
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Character Continuity Prompt
                    </Button>
                  </div>

                  {(form.versions?.length ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <Label>Saved Versions ({form.versions?.length})</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {form.versions?.map((v) => (
                          <Badge key={v.versionNumber} variant="cyan">
                            v{v.versionNumber}: {v.label} ({v.status})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(form.outfits?.length ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <Label>Outfit Library ({form.outfits?.length})</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {form.outfits?.map((o) => (
                          <Badge key={o.id} variant="yellow">
                            {o.name}: {o.description.slice(0, 32)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--cf-border)]">
              <Button type="submit">
                <Plus className="w-4 h-4" />
                {t.actions.saveCharacter}
              </Button>
              {activeTab !== 'lock' && (
                <Button type="button" variant="secondary" onClick={handleGenerateReference}>
                  <Sparkles className="w-4 h-4 text-[#00D9FF]" />
                  {t.actions.generateRefPrompt}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Right: Character Library */}
        <Card className="xl:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">{t.characters.libraryTitle}</h2>
            <Badge variant="cyan">{characters.length}</Badge>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--cf-muted)] absolute left-3 top-3" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.characters.searchPlaceholder}
              className="pl-9"
            />
          </div>

          {filteredCharacters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--cf-border)] p-8 text-center text-xs text-[var(--cf-muted)]">
              {t.dashboard.emptyCharacters}
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredCharacters.map((char) => (
                <div
                  key={char.id}
                  className={`rounded-2xl border p-3.5 bg-[var(--cf-surface-2)]/80 space-y-2.5 ${
                    form.id === char.id ? 'cf-selected-ring' : 'border-[var(--cf-border)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {char.referenceImageUrl ? (
                        <img
                          src={char.referenceImageUrl}
                          alt={char.name}
                          className="w-11 h-11 rounded-xl object-cover border border-[var(--cf-border)] shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center font-bold text-sm text-[#818CF8] shrink-0">
                          {char.name.slice(0, 2).toUpperCase() || 'CH'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">
                          {char.name}{' '}
                          <span className="text-xs font-normal text-[#00D9FF]">
                            ({char.characterCode})
                          </span>
                        </div>
                        <div className="text-xs text-[var(--cf-muted)] truncate">
                          {char.role} · {char.visualStyle} · v{char.version}
                        </div>
                      </div>
                    </div>
                    {char.status === 'archived' && <Badge variant="yellow">Archived</Badge>}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setForm(char)}>
                      {t.actions.edit}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const copy = duplicateCharacter(char.id);
                        if (copy) notify(`Duplicated ${char.name} (v${copy.version})`, 'success');
                      }}
                    >
                      {t.actions.duplicate}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => archiveCharacter(char.id)}
                      title={t.actions.archive}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        deleteCharacter(char.id);
                        notify('Watak dipadam.', 'default');
                      }}
                      title={t.actions.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
