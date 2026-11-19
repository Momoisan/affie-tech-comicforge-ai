'use client';

import React, { useMemo, useState } from 'react';
import {
  Archive,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
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
  ConfirmDialog,
  Input,
  Label,
  Select,
  Textarea,
} from '@/components/ui/primitives';
import {
  CHARACTER_EXPRESSIONS,
  CHARACTER_VISUAL_STYLES_2A,
  POSE_PRESETS,
  SPECIES_CATEGORIES,
  isNonHumanSpecies,
  type CharacterProfile,
  type ExportTarget,
} from '@/types/comicforge';
import { generateId } from '@/lib/utils';
import {
  buildCanonicalIdentityBlock,
  buildSpeciesTraitsSummary,
  getEffectiveSpecies,
} from '@/lib/ai/prompt-formatter';
import { validateCharacterConsistency } from '@/lib/v2/continuity-validator';
import { buildCharacterContinuityPrompt } from '@/lib/v2/prompt-package';

const BUILDER_STEPS = [
  { id: 'identity', num: 1, ms: '1. Identiti', en: '1. Identity' },
  { id: 'species', num: 2, ms: '2. Spesies', en: '2. Species' },
  { id: 'appearance', num: 3, ms: '3. Fizikal', en: '3. Appearance' },
  { id: 'outfit', num: 4, ms: '4. Pakaian', en: '4. Outfit' },
  { id: 'personality', num: 5, ms: '5. Personaliti', en: '5. Personality' },
  { id: 'style', num: 6, ms: '6. Gaya Visual', en: '6. Visual Style' },
  { id: 'review', num: 7, ms: '7. Semak & Kunci', en: '7. Review & Lock' },
] as const;

type BuilderStepId = (typeof BUILDER_STEPS)[number]['id'];

function createBlankCharacter(index: number): CharacterProfile {
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
    hairStyle: 'Medium layered',
    hairColor: 'Jet black',
    height: '168cm',
    bodyBuild: 'Slim athletic',
    distinguishingFeatures: 'None',
    primaryOutfit: '',
    secondaryOutfit: '',
    outfitColors: '',
    accessories: '',
    footwear: '',
    defaultExpression: 'Neutral',
    customExpression: '',
    visualStyle: 'Korean Webtoon',
    customVisualStyle: '',
    species: 'Human',
    customSpecies: '',
    defaultPose: 'Standing',
    signatureItem: '',
    motivations: '',
    strengths: '',
    weaknesses: '',
    relationships: '',
    speakingStyle: '',
    speciesTraits: {},
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
    createdAt: '',
    updatedAt: '',
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

  const isMs = preferences.uiLanguage === 'ms-MY';

  const [form, setForm] = useState<CharacterProfile>(() =>
    createBlankCharacter(characters.length)
  );
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('ALL');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [showAdvancedPersonality, setShowAdvancedPersonality] = useState(false);
  const [showAnatomyOverride, setShowAnatomyOverride] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [exportTarget, setExportTarget] = useState<ExportTarget>(preferences.exportTarget);
  const [generatingRef, setGeneratingRef] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [editingVersionNumber, setEditingVersionNumber] = useState<number | null>(null);
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [confirmIdentityRevision, setConfirmIdentityRevision] = useState(false);

  const currentStep: BuilderStepId = BUILDER_STEPS[stepIdx].id;
  const isExistingSaved = useMemo(
    () => characters.some((c) => c.id === form.id),
    [characters, form.id]
  );

  const availableSpeciesFilters = useMemo(() => {
    const set = new Set<string>();
    for (const c of characters) {
      set.add(getEffectiveSpecies(c));
    }
    return Array.from(set);
  }, [characters]);

  const filteredCharacters = useMemo(() => {
    const q = search.trim().toLowerCase();
    return characters.filter((c) => {
      const effSpecies = getEffectiveSpecies(c);
      if (speciesFilter !== 'ALL' && effSpecies !== speciesFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.characterCode.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        effSpecies.toLowerCase().includes(q)
      );
    });
  }, [characters, search, speciesFilter]);

  const liveCanonicalBlock = useMemo(() => {
    if (!form.name.trim()) return '';
    return buildCanonicalIdentityBlock(form);
  }, [form]);

  const nonHumanMode = isNonHumanSpecies(form.species) || showAnatomyOverride;

  const validateRequiredFields = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) {
      errs.name = isMs
        ? 'Nama watak wajib diisi secara manual.'
        : 'Character Name is required.';
    }
    if (!form.role.trim()) {
      errs.role = isMs ? 'Peranan watak wajib diisi.' : 'Character Role is required.';
    }
    if (!form.species?.trim()) {
      errs.species = isMs ? 'Sila pilih spesies watak.' : 'Please select a species.';
    }
    if (form.species === 'Custom Species' && !form.customSpecies?.trim()) {
      errs.customSpecies = isMs
        ? 'Sila nyatakan nama spesies tersuai.'
        : 'Please enter your custom species name.';
    }
    setValidationErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.name || errs.role) setStepIdx(0);
      else if (errs.species || errs.customSpecies) setStepIdx(1);
      notify(Object.values(errs)[0], 'error');
      return false;
    }
    return true;
  };

  const commitSaveCharacter = () => {
    const now = new Date().toISOString();
    const isDraft = form.id.startsWith('char_draft_');
    const canonical = buildCanonicalIdentityBlock(form);
    const continuity = buildCharacterContinuityPrompt(form, form.version);
    const prepared: CharacterProfile = {
      ...form,
      id: isDraft ? generateId('char') : form.id,
      name: form.name.trim(),
      role: form.role.trim(),
      createdAt: form.createdAt || now,
      updatedAt: now,
      continuityPrompt: continuity,
      identityLock: {
        ...form.identityLock,
        canonicalIdentityBlock: canonical,
      },
    };
    saveCharacter(prepared);
    setForm(prepared);
    setConfirmIdentityRevision(false);
    notify(
      isMs
        ? `Watak "${prepared.name}" (${prepared.characterCode}) berjaya disimpan!`
        : `Character "${prepared.name}" (${prepared.characterCode}) saved!`,
      'success'
    );
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateRequiredFields()) return;

    if (isExistingSaved) {
      const original = characters.find((c) => c.id === form.id);
      const immutableChanged =
        original &&
        (original.characterCode !== form.characterCode ||
          getEffectiveSpecies(original) !== getEffectiveSpecies(form) ||
          original.faceShape !== form.faceShape ||
          original.distinguishingFeatures !== form.distinguishingFeatures);
      if (immutableChanged && !confirmIdentityRevision) {
        setConfirmIdentityRevision(true);
        return;
      }
    }
    commitSaveCharacter();
  };

  const handleNew = () => {
    setForm(createBlankCharacter(characters.length));
    setValidationErrors({});
    setEditingVersionNumber(null);
    setEditingOutfitId(null);
    setStepIdx(0);
  };

  const handleGenerateReference = async () => {
    if (!validateRequiredFields()) return;
    setGeneratingRef(true);
    try {
      const res = await fetch('/api/character-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engineMode: preferences.preferredEngine,
          exportTarget,
          character: form,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        notify(data.error || 'Gagal menjana prompt rujukan.', 'error');
        return;
      }
      const now = new Date().toISOString();
      const isDraft = form.id.startsWith('char_draft_');
      const updated: CharacterProfile = {
        ...form,
        id: isDraft ? generateId('char') : form.id,
        createdAt: form.createdAt || now,
        referencePrompt: data.referencePrompt,
        identityLock: {
          ...form.identityLock,
          canonicalIdentityBlock: data.canonicalIdentityBlock,
        },
        updatedAt: now,
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
          species: getEffectiveSpecies(updated),
          canonical_identity_block: data.canonicalIdentityBlock,
        },
        tags: ['character-reference', updated.visualStyle, getEffectiveSpecies(updated)],
        createdAt: now,
      });
      setStepIdx(6);
      notify(
        isMs ? 'Prompt Rujukan Watak berjaya dijana!' : 'Character Reference Prompt generated!',
        'success'
      );
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
    notify(isMs ? 'Prompt rujukan disalin!' : 'Reference prompt copied!', 'success');
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
        setForm((prev) => ({ ...prev, referenceImageUrl: result }));
        notify('Gambar rujukan dilampirkan pada profil watak.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const updateSpeciesTrait = (
    key: keyof NonNullable<CharacterProfile['speciesTraits']>,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      speciesTraits: { ...(prev.speciesTraits ?? {}), [key]: value },
    }));
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="-skew-x-6 bg-[#FACC15] text-[#090D1A] px-2.5 py-0.5 text-xs font-black uppercase border-2 border-[#090D1A]">
              PHASE 2A · STUDIO 2.0
            </span>
            <Badge variant="cyan">Visual Character Builder</Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t.characters.title}</h1>
          <p className="text-sm text-[var(--cf-muted)]">{t.characters.subtitle}</p>
        </div>
        <Button onClick={handleNew} variant="secondary">
          <UserPlus className="w-4 h-4 text-[#00D9FF]" />
          {t.actions.createCharacter}
        </Button>
      </div>

      {/* 3-Column Hybrid Premium Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Character Library */}
        <Card className="xl:col-span-3 space-y-4 order-2 xl:order-1">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">{t.characters.libraryTitle}</h2>
            <Badge variant="cyan">{characters.length}</Badge>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--cf-muted)] absolute left-3 top-3.5" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.characters.searchPlaceholder}
                className="pl-9"
                aria-label="Search characters"
              />
            </div>
            {availableSpeciesFilters.length > 1 && (
              <Select
                value={speciesFilter}
                onChange={(e) => setSpeciesFilter(e.target.value)}
                aria-label="Filter by species"
              >
                <option value="ALL">
                  {isMs ? 'Semua Spesies' : 'All Species'} ({characters.length})
                </option>
                {availableSpeciesFilters.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {filteredCharacters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--cf-border)] p-5 text-center text-xs text-[var(--cf-muted)] space-y-2">
              <p>{t.dashboard.emptyCharacters}</p>
              <Button size="sm" variant="secondary" onClick={handleNew}>
                <Plus className="w-3.5 h-3.5" />
                {t.actions.createCharacter}
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredCharacters.map((char) => {
                const effSpecies = getEffectiveSpecies(char);
                return (
                  <div
                    key={char.id}
                    className={`rounded-2xl border p-3 bg-[var(--cf-surface-2)]/80 space-y-2.5 transition-all ${
                      form.id === char.id ? 'cf-selected-ring' : 'border-[var(--cf-border)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {char.referenceImageUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element -- supports local data URLs and external Supabase Storage URLs */}
                            <img
                              src={char.referenceImageUrl}
                              alt={char.name}
                              loading="lazy"
                              className="w-11 h-11 rounded-xl object-cover border border-[var(--cf-border)] shrink-0"
                            />
                          </>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center font-bold text-xs text-[#818CF8] shrink-0">
                            {char.name.slice(0, 2).toUpperCase() || 'CH'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{char.name}</div>
                          <div className="font-mono text-[11px] text-[#00D9FF] truncate">
                            {char.characterCode}
                          </div>
                          <div className="text-[11px] text-[var(--cf-muted)] truncate">
                            {effSpecies} · {char.role}
                          </div>
                        </div>
                      </div>
                      <Badge variant={char.status === 'archived' ? 'default' : 'indigo'}>
                        v{char.version}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-[var(--cf-muted)]">
                      <span>{char.visualStyle}</span>
                      <span>
                        {char.updatedAt
                          ? new Date(char.updatedAt).toLocaleDateString()
                          : 'Draft'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setForm(char);
                          setValidationErrors({});
                          setEditingVersionNumber(null);
                          setEditingOutfitId(null);
                          setStepIdx(0);
                        }}
                      >
                        {t.actions.edit}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const copy = duplicateCharacter(char.id);
                          if (copy) notify(`Duplicated "${char.name}"`, 'success');
                        }}
                      >
                        {t.actions.duplicate}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t.actions.archive}
                        title={t.actions.archive}
                        onClick={() => archiveCharacter(char.id)}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t.actions.delete}
                        title={t.actions.delete}
                        onClick={() => setDeleteTargetId(char.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* CENTER COLUMN: 7-Step Visual Character Builder */}
        <Card className="xl:col-span-6 space-y-5 order-1 xl:order-2">
          {/* Step Progression Pills */}
          <div className="flex items-center justify-between gap-2 border-b border-[var(--cf-border)] pb-3">
            <div className="flex flex-wrap gap-1.5">
              {BUILDER_STEPS.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStepIdx(idx)}
                  className={`px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    stepIdx === idx
                      ? 'bg-[#6366F1] text-white shadow-sm'
                      : 'bg-[var(--cf-surface-2)] text-[var(--cf-muted)] hover:text-[var(--cf-text)]'
                  }`}
                >
                  {isMs ? st.ms : st.en}
                </button>
              ))}
            </div>
            <Badge variant="indigo">v{form.version}</Badge>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* STEP 1: BASIC IDENTITY */}
            {currentStep === 'identity' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="char-name">Character Name *</Label>
                  <Input
                    id="char-name"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (validationErrors.name) {
                        setValidationErrors((prev) => ({ ...prev, name: '' }));
                      }
                    }}
                    placeholder="e.g. Alya Sofea"
                    aria-invalid={Boolean(validationErrors.name)}
                    required
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-xs text-rose-400">{validationErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="char-code">Character ID (Stable)</Label>
                  <Input
                    id="char-code"
                    value={form.characterCode}
                    onChange={(e) => setForm({ ...form, characterCode: e.target.value })}
                    placeholder="CHAR-001"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="char-role">Character Role *</Label>
                  <Input
                    id="char-role"
                    value={form.role}
                    onChange={(e) => {
                      setForm({ ...form, role: e.target.value });
                      if (validationErrors.role) {
                        setValidationErrors((prev) => ({ ...prev, role: '' }));
                      }
                    }}
                    placeholder="Protagonist / Rival / Mentor"
                    aria-invalid={Boolean(validationErrors.role)}
                    required
                  />
                  {validationErrors.role && (
                    <p className="mt-1 text-xs text-rose-400">{validationErrors.role}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="char-species-quick">Species / Type</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setStepIdx(1)}
                  >
                    <span>{getEffectiveSpecies(form)}</span>
                    <span className="text-xs text-[#00D9FF]">
                      {isMs ? 'Pilih Spesies →' : 'Choose Species →'}
                    </span>
                  </Button>
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
                  <Label htmlFor="char-gender">Gender Presentation</Label>
                  <Input
                    id="char-gender"
                    value={form.genderIdentity}
                    onChange={(e) => setForm({ ...form, genderIdentity: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="char-nat">Nationality / Cultural Background</Label>
                  <Input
                    id="char-nat"
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="char-bio">Character Description</Label>
                  <Textarea
                    id="char-bio"
                    rows={3}
                    value={form.biography}
                    onChange={(e) => setForm({ ...form, biography: e.target.value })}
                    placeholder="Short overview, background, and visual presence..."
                  />
                </div>
              </div>
            )}

            {/* STEP 2: CHARACTER SPECIES */}
            {currentStep === 'species' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-[var(--cf-muted)] absolute left-3 top-3.5" />
                  <Input
                    value={speciesSearch}
                    onChange={(e) => setSpeciesSearch(e.target.value)}
                    placeholder={
                      isMs
                        ? 'Cari spesies (cth: Elf, Demon, Android, Slime)...'
                        : 'Search species (e.g. Elf, Demon, Android, Slime)...'
                    }
                    className="pl-9"
                    aria-label="Search species"
                  />
                </div>

                {SPECIES_CATEGORIES.map((group) => {
                  const q = speciesSearch.trim().toLowerCase();
                  const items = group.items.filter(
                    (sp) => !q || sp.toLowerCase().includes(q)
                  );
                  if (items.length === 0) return null;
                  return (
                    <div key={group.category} className="space-y-2">
                      <Label className="mb-0">{group.category}</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {items.map((sp) => {
                          const selected = form.species === sp;
                          return (
                            <button
                              key={sp}
                              type="button"
                              onClick={() => setForm({ ...form, species: sp })}
                              className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold text-left transition-all cursor-pointer ${
                                selected
                                  ? 'border-[#FACC15] bg-[#6366F1]/25 text-[#FACC15]'
                                  : 'border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-[var(--cf-text)] hover:border-[#00D9FF]/60'
                              }`}
                            >
                              {sp}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {form.species === 'Custom Species' && (
                  <div className="rounded-xl border border-[#00D9FF]/40 bg-[var(--cf-surface-2)] p-3.5 space-y-2">
                    <Label htmlFor="custom-species">Custom Species Name *</Label>
                    <Input
                      id="custom-species"
                      value={form.customSpecies || ''}
                      onChange={(e) => setForm({ ...form, customSpecies: e.target.value })}
                      placeholder="e.g. Celestial Fox-Kin, Cyber-Golem, Star Weaver"
                    />
                    {validationErrors.customSpecies && (
                      <p className="text-xs text-rose-400">{validationErrors.customSpecies}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: PHYSICAL APPEARANCE + CONDITIONAL SPECIES TRAITS */}
            {currentStep === 'appearance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="char-face">Face Shape</Label>
                    <Input
                      id="char-face"
                      value={form.faceShape}
                      onChange={(e) => setForm({ ...form, faceShape: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-skin">Skin / Surface Tone</Label>
                    <Input
                      id="char-skin"
                      value={form.skinTone}
                      onChange={(e) => setForm({ ...form, skinTone: e.target.value })}
                      placeholder="e.g. Warm tan, translucent cyan, metallic chrome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-eye-shape">Eye Shape</Label>
                    <Input
                      id="char-eye-shape"
                      value={form.eyeShape}
                      onChange={(e) => setForm({ ...form, eyeShape: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-eye-color">Eye Color</Label>
                    <Input
                      id="char-eye-color"
                      value={form.eyeColor}
                      onChange={(e) => setForm({ ...form, eyeColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-hair-style">Hair Style (or None)</Label>
                    <Input
                      id="char-hair-style"
                      value={form.hairStyle}
                      onChange={(e) => setForm({ ...form, hairStyle: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-hair-color">Hair Color</Label>
                    <Input
                      id="char-hair-color"
                      value={form.hairColor}
                      onChange={(e) => setForm({ ...form, hairColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-height">Height</Label>
                    <Input
                      id="char-height"
                      value={form.height}
                      onChange={(e) => setForm({ ...form, height: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-build">Body Build</Label>
                    <Input
                      id="char-build"
                      value={form.bodyBuild}
                      onChange={(e) => setForm({ ...form, bodyBuild: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="char-features">Distinguishing Features</Label>
                    <Input
                      id="char-features"
                      value={form.distinguishingFeatures}
                      onChange={(e) =>
                        setForm({ ...form, distinguishingFeatures: e.target.value })
                      }
                      placeholder="e.g. Small scar on left eyebrow, glowing rune markings, freckles"
                    />
                  </div>
                </div>

                {/* Conditional Species-Specific Anatomy */}
                <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)]/70 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-[#00D9FF] uppercase tracking-wider">
                      {nonHumanMode
                        ? `Species-Specific Traits (${getEffectiveSpecies(form)})`
                        : 'Optional Species / Fantasy Anatomy Traits'}
                    </div>
                    {!isNonHumanSpecies(form.species) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAnatomyOverride((v) => !v)}
                      >
                        {showAnatomyOverride ? 'Hide Anatomy' : 'Add Anatomy Traits'}
                      </Button>
                    )}
                  </div>

                  {nonHumanMode && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="trait-horns">Horns</Label>
                        <Input
                          id="trait-horns"
                          value={form.speciesTraits?.horns || ''}
                          onChange={(e) => updateSpeciesTrait('horns', e.target.value)}
                          placeholder="e.g. Curved obsidian horns"
                        />
                      </div>
                      <div>
                        <Label htmlFor="trait-wings">Wings</Label>
                        <Input
                          id="trait-wings"
                          value={form.speciesTraits?.wings || ''}
                          onChange={(e) => updateSpeciesTrait('wings', e.target.value)}
                          placeholder="e.g. Feathered white wings"
                        />
                      </div>
                      <div>
                        <Label htmlFor="trait-tail">Tail</Label>
                        <Input
                          id="trait-tail"
                          value={form.speciesTraits?.tail || ''}
                          onChange={(e) => updateSpeciesTrait('tail', e.target.value)}
                          placeholder="e.g. Fluffy fox tail"
                        />
                      </div>
                      <div>
                        <Label htmlFor="trait-ears">Ears</Label>
                        <Input
                          id="trait-ears"
                          value={form.speciesTraits?.ears || ''}
                          onChange={(e) => updateSpeciesTrait('ears', e.target.value)}
                          placeholder="e.g. Long pointed elf ears"
                        />
                      </div>
                      <div>
                        <Label htmlFor="trait-scales">Scales</Label>
                        <Input
                          id="trait-scales"
                          value={form.speciesTraits?.scales || ''}
                          onChange={(e) => updateSpeciesTrait('scales', e.target.value)}
                          placeholder="e.g. Crimson dragon scales on forearms"
                        />
                      </div>
                      <div>
                        <Label htmlFor="trait-fur">Fur</Label>
                        <Input
                          id="trait-fur"
                          value={form.speciesTraits?.fur || ''}
                          onChange={(e) => updateSpeciesTrait('fur', e.target.value)}
                          placeholder="e.g. Silver-gray wolf fur"
                        />
                      </div>
                      <div>
                        <Label htmlFor="trait-slime">Slime Body</Label>
                        <Input
                          id="trait-slime"
                          value={form.speciesTraits?.slimeBody || ''}
                          onChange={(e) => updateSpeciesTrait('slimeBody', e.target.value)}
                          placeholder="e.g. Semi-translucent azure gel core"
                        />
                      </div>
                      <div>
                        <Label htmlFor="trait-mech">Mechanical Parts</Label>
                        <Input
                          id="trait-mech"
                          value={form.speciesTraits?.mechanicalParts || ''}
                          onChange={(e) => updateSpeciesTrait('mechanicalParts', e.target.value)}
                          placeholder="e.g. Articulated titanium visor & cybernetic arm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="trait-custom">Custom Anatomical Features</Label>
                        <Input
                          id="trait-custom"
                          value={form.speciesTraits?.customAnatomy || ''}
                          onChange={(e) => updateSpeciesTrait('customAnatomy', e.target.value)}
                          placeholder="Any additional non-human anatomy details..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: SIGNATURE OUTFIT */}
            {currentStep === 'outfit' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#00D9FF]/30 bg-[var(--cf-surface-2)] p-3 text-xs text-[var(--cf-muted)]">
                  {isMs
                    ? 'Pakaian & aksesori di sini dipisahkan daripada identiti fizikal kekal supaya anda boleh menukar pakaian mengikut babak.'
                    : 'Clothing and accessories are separated from immutable physical traits so you can swap outfits across scenes.'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="char-primary-outfit">Primary Outfit</Label>
                    <Input
                      id="char-primary-outfit"
                      value={form.primaryOutfit}
                      onChange={(e) => setForm({ ...form, primaryOutfit: e.target.value })}
                      placeholder="e.g. Navy school blazer over white collar shirt"
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-outfit-colors">Outfit Colors</Label>
                    <Input
                      id="char-outfit-colors"
                      value={form.outfitColors}
                      onChange={(e) => setForm({ ...form, outfitColors: e.target.value })}
                      placeholder="Navy blue, cyan, crisp white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-accessories">Accessories</Label>
                    <Input
                      id="char-accessories"
                      value={form.accessories}
                      onChange={(e) => setForm({ ...form, accessories: e.target.value })}
                      placeholder="Smartwatch, sling bag, glasses"
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-footwear">Footwear</Label>
                    <Input
                      id="char-footwear"
                      value={form.footwear}
                      onChange={(e) => setForm({ ...form, footwear: e.target.value })}
                      placeholder="White canvas sneakers"
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-sig-item">Signature Item</Label>
                    <Input
                      id="char-sig-item"
                      value={form.signatureItem || ''}
                      onChange={(e) => setForm({ ...form, signatureItem: e.target.value })}
                      placeholder="e.g. Ancient brass compass, glowing katana"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="char-alt-outfit">Alternate Outfit</Label>
                    <Input
                      id="char-alt-outfit"
                      value={form.secondaryOutfit}
                      onChange={(e) => setForm({ ...form, secondaryOutfit: e.target.value })}
                      placeholder="Optional casual, battle, or formal outfit"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
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
                      setForm({ ...form, outfits: [...(form.outfits ?? []), outfit] });
                      notify(`Saved "${outfit.name}" to Outfit Library`, 'success');
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Save Current to Outfit Library
                  </Button>
                </div>

                {(form.outfits?.length ?? 0) > 0 && (
                  <div className="space-y-2.5">
                    <Label className="mb-0">
                      Outfit Library ({form.outfits?.length}) —{' '}
                      <span className="text-[#00D9FF] normal-case font-normal">
                        Klik pakaian untuk sunting / guna
                      </span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {form.outfits?.map((o) => {
                        const isSelected = editingOutfitId === o.id;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setEditingOutfitId(isSelected ? null : o.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer min-h-[40px] ${
                              isSelected
                                ? 'border-[#FACC15] bg-[#FACC15]/20 text-[#FACC15]'
                                : 'border-[#FACC15]/40 bg-[#FACC15]/10 text-[#FACC15] hover:bg-[#FACC15]/20'
                            }`}
                          >
                            {o.name}: {o.description.slice(0, 32)}
                          </button>
                        );
                      })}
                    </div>

                    {editingOutfitId &&
                      (() => {
                        const targetOutfit = form.outfits?.find(
                          (o) => o.id === editingOutfitId
                        );
                        if (!targetOutfit) return null;
                        const updateOutfit = (
                          patch: Partial<NonNullable<CharacterProfile['outfits']>[number]>
                        ) => {
                          setForm((prev) => ({
                            ...prev,
                            outfits: (prev.outfits ?? []).map((item) =>
                              item.id === targetOutfit.id ? { ...item, ...patch } : item
                            ),
                          }));
                        };
                        return (
                          <div className="rounded-xl border border-[#FACC15]/40 bg-[var(--cf-surface)] p-3.5 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#FACC15]">
                                Edit Outfit: {targetOutfit.name}
                              </span>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setForm((prev) => ({
                                      ...prev,
                                      primaryOutfit: targetOutfit.description,
                                      outfitColors: targetOutfit.colors,
                                      accessories: targetOutfit.accessories,
                                      footwear: targetOutfit.footwear,
                                    }));
                                    notify(
                                      `Pakaian "${targetOutfit.name}" digunakan sebagai Primary Outfit!`,
                                      'success'
                                    );
                                  }}
                                >
                                  <Check className="w-3.5 h-3.5" /> Apply to Primary
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="danger"
                                  onClick={() => {
                                    setForm((prev) => ({
                                      ...prev,
                                      outfits: (prev.outfits ?? []).filter(
                                        (item) => item.id !== targetOutfit.id
                                      ),
                                    }));
                                    setEditingOutfitId(null);
                                    notify(`"${targetOutfit.name}" dipadam.`, 'default');
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Padam
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label>Outfit Name</Label>
                                <Input
                                  value={targetOutfit.name}
                                  onChange={(e) => updateOutfit({ name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Colors</Label>
                                <Input
                                  value={targetOutfit.colors}
                                  onChange={(e) => updateOutfit({ colors: e.target.value })}
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <Label>Description</Label>
                                <Input
                                  value={targetOutfit.description}
                                  onChange={(e) =>
                                    updateOutfit({ description: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: PERSONALITY & STORY ROLE */}
            {currentStep === 'personality' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="char-personality">Personality Traits</Label>
                    <Input
                      id="char-personality"
                      value={form.personality}
                      onChange={(e) => setForm({ ...form, personality: e.target.value })}
                      placeholder="Cheerful, brave, slightly impulsive"
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-speaking">Speaking Style</Label>
                    <Input
                      id="char-speaking"
                      value={form.speakingStyle || ''}
                      onChange={(e) => setForm({ ...form, speakingStyle: e.target.value })}
                      placeholder="e.g. Casual Malaysian Malay, calm & formal"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="char-backstory">Character Backstory</Label>
                    <Textarea
                      id="char-backstory"
                      rows={3}
                      value={form.biography}
                      onChange={(e) => setForm({ ...form, biography: e.target.value })}
                      placeholder="Background story, history, and arc..."
                    />
                  </div>
                </div>

                {/* Collapsible Advanced Fields */}
                <div className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)]/60 p-3.5 space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedPersonality((v) => !v)}
                    className="w-full flex items-center justify-between text-xs font-bold text-[#00D9FF] min-h-[36px] cursor-pointer"
                  >
                    <span>
                      {isMs
                        ? 'Motivasi, Kekuatan, Kelemahan & Hubungan (Pilihan)'
                        : 'Motivations, Strengths, Weaknesses & Relationships (Optional)'}
                    </span>
                    {showAdvancedPersonality ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showAdvancedPersonality && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <Label htmlFor="char-motivations">Motivations</Label>
                        <Input
                          id="char-motivations"
                          value={form.motivations || ''}
                          onChange={(e) => setForm({ ...form, motivations: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="char-relationships">Relationships</Label>
                        <Input
                          id="char-relationships"
                          value={form.relationships || ''}
                          onChange={(e) => setForm({ ...form, relationships: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="char-strengths">Strengths</Label>
                        <Input
                          id="char-strengths"
                          value={form.strengths || ''}
                          onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="char-weaknesses">Weaknesses</Label>
                        <Input
                          id="char-weaknesses"
                          value={form.weaknesses || ''}
                          onChange={(e) => setForm({ ...form, weaknesses: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: VISUAL STYLE */}
            {currentStep === 'style' && (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2">Visual Style Anchor</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CHARACTER_VISUAL_STYLES_2A.map((st) => {
                      const active = form.visualStyle === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setForm({ ...form, visualStyle: st })}
                          className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                            active
                              ? 'border-[#FACC15] bg-[#6366F1]/25 text-[#FACC15]'
                              : 'border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-[var(--cf-text)] hover:border-[#00D9FF]/60'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.visualStyle === 'Custom' && (
                  <div>
                    <Label htmlFor="char-custom-style">Custom Visual Style Description</Label>
                    <Input
                      id="char-custom-style"
                      value={form.customVisualStyle}
                      onChange={(e) =>
                        setForm({ ...form, customVisualStyle: e.target.value })
                      }
                      placeholder="Describe custom linework, shading, and color rules..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="char-pose">Default Pose Preset</Label>
                    <Select
                      id="char-pose"
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
                  <div>
                    <Label htmlFor="char-expr">Default Expression</Label>
                    <Select
                      id="char-expr"
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
                </div>
              </div>
            )}

            {/* STEP 7: REVIEW & CHARACTER IDENTITY LOCK */}
            {currentStep === 'review' && (
              <div className="space-y-4">
                {validateCharacterConsistency(form).map((w) => (
                  <div
                    key={w.id}
                    className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-2.5 text-xs text-amber-200"
                  >
                    <strong>{w.message}</strong> — {w.suggestion}
                  </div>
                ))}

                {/* Identity Summary Card */}
                <div className="rounded-2xl border border-[#00D9FF]/30 bg-[var(--cf-surface-2)] p-4 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-sm text-[var(--cf-text)]">
                      {form.name || '(Unnamed Character)'}
                    </span>
                    <span className="font-mono text-[#00D9FF]">{form.characterCode}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--cf-muted)]">
                    <div>
                      <strong className="text-[var(--cf-text)]">Species:</strong>{' '}
                      {getEffectiveSpecies(form)}
                    </div>
                    <div>
                      <strong className="text-[var(--cf-text)]">Style:</strong>{' '}
                      {form.visualStyle}
                    </div>
                    <div>
                      <strong className="text-[var(--cf-text)]">Appearance:</strong>{' '}
                      {form.faceShape}, {form.eyeColor} eyes, {form.hairStyle}
                    </div>
                    <div>
                      <strong className="text-[var(--cf-text)]">Signature Outfit:</strong>{' '}
                      {form.primaryOutfit || 'Not set'}
                    </div>
                  </div>
                  {buildSpeciesTraitsSummary(form).length > 0 && (
                    <div className="text-[var(--cf-muted)]">
                      <strong className="text-[var(--cf-text)]">Species Traits:</strong>{' '}
                      {buildSpeciesTraitsSummary(form).join(', ')}
                    </div>
                  )}
                </div>

                {/* Immutable vs Mutable Separation + Lock Toggles */}
                <div className="rounded-xl border border-[#FACC15]/40 bg-[#FACC15]/10 p-3 text-xs text-[#FACC15] flex items-start gap-2">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t.characters.lockNote}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(
                    [
                      ['lockNameAndId', 'Lock Name & Character ID'],
                      ['lockFacialStructure', 'Lock Facial Structure'],
                      ['lockHair', 'Lock Hair Silhouette & Color'],
                      ['lockEyeColor', 'Lock Eye Color'],
                      ['lockSkinTone', 'Lock Skin / Surface Tone'],
                      ['lockSignatureOutfit', 'Lock Signature Outfit'],
                      ['lockAccessories', 'Lock Accessories'],
                      ['lockDistinguishingFeatures', 'Lock Distinguishing Features'],
                      ['lockArtStyle', 'Lock Character Art Style'],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2.5 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] px-3 py-2.5 min-h-[44px] text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.identityLock[key]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            identityLock: { ...form.identityLock, [key]: e.target.checked },
                          })
                        }
                        className="accent-[#6366F1] w-4 h-4"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                {/* Version History & Continuity Actions */}
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
                  <div className="space-y-2.5">
                    <Label className="mb-0">
                      Saved Versions ({form.versions?.length}) —{' '}
                      <span className="text-[#00D9FF] normal-case font-normal">
                        Klik versi untuk sunting / aktifkan
                      </span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {form.versions?.map((v) => {
                        const isSelected = editingVersionNumber === v.versionNumber;
                        const isActive = form.version === v.versionNumber;
                        return (
                          <button
                            key={v.versionNumber}
                            type="button"
                            onClick={() =>
                              setEditingVersionNumber(isSelected ? null : v.versionNumber)
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer min-h-[40px] ${
                              isSelected
                                ? 'border-[#FACC15] bg-[#FACC15]/15 text-[#FACC15]'
                                : isActive
                                  ? 'border-[#00D9FF] bg-[#00D9FF]/15 text-[#00D9FF]'
                                  : 'border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-muted)] hover:text-[var(--cf-text)]'
                            }`}
                          >
                            <span>
                              v{v.versionNumber}: {v.label} ({v.status})
                            </span>
                            {isActive && (
                              <span className="text-[10px] px-1.5 rounded bg-emerald-500/20 text-emerald-300">
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {editingVersionNumber !== null &&
                      (() => {
                        const targetVer = form.versions?.find(
                          (v) => v.versionNumber === editingVersionNumber
                        );
                        if (!targetVer) return null;
                        const updateVer = (
                          patch: Partial<NonNullable<CharacterProfile['versions']>[number]>
                        ) => {
                          setForm((prev) => ({
                            ...prev,
                            versions: (prev.versions ?? []).map((item) =>
                              item.versionNumber === targetVer.versionNumber
                                ? { ...item, ...patch }
                                : item
                            ),
                          }));
                        };
                        return (
                          <div className="rounded-xl border border-[#FACC15]/40 bg-[var(--cf-surface)] p-3.5 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#FACC15]">
                                Edit Version v{targetVer.versionNumber}
                              </span>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={
                                    form.version === targetVer.versionNumber
                                      ? 'accent'
                                      : 'secondary'
                                  }
                                  onClick={() => {
                                    setForm((prev) => ({
                                      ...prev,
                                      version: targetVer.versionNumber,
                                      ageRange: targetVer.ageRange || prev.ageRange,
                                      primaryOutfit: targetVer.outfitName || prev.primaryOutfit,
                                      hairStyle: targetVer.hairStyle || prev.hairStyle,
                                      accessories: targetVer.equipment || prev.accessories,
                                    }));
                                    notify(
                                      `Versi v${targetVer.versionNumber} diaktifkan pada watak!`,
                                      'success'
                                    );
                                  }}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  {form.version === targetVer.versionNumber
                                    ? 'Active Version'
                                    : 'Set as Active'}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="danger"
                                  onClick={() => {
                                    const remaining = (form.versions ?? []).filter(
                                      (item) => item.versionNumber !== targetVer.versionNumber
                                    );
                                    setForm((prev) => ({
                                      ...prev,
                                      versions: remaining,
                                      version:
                                        prev.version === targetVer.versionNumber
                                          ? remaining[remaining.length - 1]?.versionNumber ?? 1
                                          : prev.version,
                                    }));
                                    setEditingVersionNumber(null);
                                    notify(`Versi v${targetVer.versionNumber} dipadam.`, 'default');
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Padam
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label>Version Label</Label>
                                <Input
                                  value={targetVer.label}
                                  onChange={(e) => updateVer({ label: e.target.value })}
                                  placeholder="cth: Arc 2 — Academy Uniform"
                                />
                              </div>
                              <div>
                                <Label>Status</Label>
                                <Select
                                  value={targetVer.status}
                                  onChange={(e) =>
                                    updateVer({
                                      status: e.target.value as
                                        | 'active'
                                        | 'injured'
                                        | 'deceased'
                                        | 'missing',
                                    })
                                  }
                                >
                                  <option value="active">active</option>
                                  <option value="injured">injured</option>
                                  <option value="deceased">deceased</option>
                                  <option value="missing">missing</option>
                                </Select>
                              </div>
                              <div>
                                <Label>Age Range</Label>
                                <Input
                                  value={targetVer.ageRange}
                                  onChange={(e) => updateVer({ ageRange: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Outfit Name</Label>
                                <Input
                                  value={targetVer.outfitName}
                                  onChange={(e) => updateVer({ outfitName: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                )}

                {/* Reference Sheet Generation & Visual Aid Upload */}
                <div className="pt-2 border-t border-[var(--cf-border)] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="mb-0">Target Export Preset</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={exportTarget === 'chatgpt' ? 'accent' : 'outline'}
                        onClick={() => setExportTarget('chatgpt')}
                      >
                        ChatGPT Images
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={exportTarget === 'gemini' ? 'accent' : 'outline'}
                        onClick={() => setExportTarget('gemini')}
                      >
                        Google Gemini
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleGenerateReference}
                    disabled={generatingRef}
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4" />
                    {generatingRef ? 'Menjana...' : t.actions.generateRefPrompt}
                  </Button>

                  {form.referencePrompt && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="mb-0">Reference Sheet Prompt</Label>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={handleCopyRef}>
                            {copiedRef ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {t.actions.copyPrompt}
                          </Button>
                          <a
                            href={
                              exportTarget === 'chatgpt'
                                ? 'https://chatgpt.com/'
                                : 'https://gemini.google.com/'
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 min-h-[40px] sm:min-h-[34px] px-3 rounded-lg border border-[var(--cf-border)] text-xs hover:border-[#00D9FF]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {exportTarget === 'chatgpt'
                              ? t.actions.openChatGPT
                              : t.actions.openGemini}
                          </a>
                        </div>
                      </div>
                      <Textarea
                        rows={7}
                        readOnly
                        value={form.referencePrompt}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}

                  {/* Upload External Reference Image */}
                  <div className="space-y-2">
                    <Label>{t.characters.uploadRefLabel}</Label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] text-xs font-semibold cursor-pointer hover:border-[#00D9FF]">
                        <ImagePlus className="w-4 h-4 text-[#00D9FF]" />
                        <span>Choose PNG / JPG / WebP</span>
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
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Form Navigation & Save Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--cf-border)]">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={stepIdx === 0}
                  onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {isMs ? 'Sebelum' : 'Previous'}
                </Button>
                {stepIdx < BUILDER_STEPS.length - 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStepIdx((s) => Math.min(BUILDER_STEPS.length - 1, s + 1))}
                  >
                    {isMs ? 'Seterusnya' : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Button type="submit">
                <Plus className="w-4 h-4" />
                {t.actions.saveCharacter}
              </Button>
            </div>
          </form>
        </Card>

        {/* RIGHT COLUMN: Live Character Profile Preview */}
        <Card className="xl:col-span-3 space-y-4 order-3 glass-card-premium">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm uppercase tracking-wider text-[#00D9FF]">
              {isMs ? 'Pratonton Profil' : 'Profile Preview'}
            </h2>
            <Badge variant="yellow">v{form.version}</Badge>
          </div>

          <div className="flex items-center gap-3">
            {form.referenceImageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- supports local data URLs and external Supabase Storage URLs */}
                <img
                  src={form.referenceImageUrl}
                  alt={form.name || 'Character preview'}
                  loading="lazy"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00D9FF]/50 shrink-0"
                />
              </>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/20 border-2 border-dashed border-[#00D9FF]/40 flex items-center justify-center font-extrabold text-lg text-[#818CF8] shrink-0">
                {form.name.trim().slice(0, 2).toUpperCase() || '?'}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-extrabold text-base truncate">
                {form.name.trim() || (isMs ? 'Nama Watak Belum Diisi' : 'Unnamed Character')}
              </div>
              <div className="font-mono text-xs text-[#00D9FF]">{form.characterCode}</div>
              <div className="text-xs text-[var(--cf-muted)] truncate">
                {getEffectiveSpecies(form)} · {form.role || 'Role'}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-[var(--cf-border)] pt-3">
            <div className="font-bold text-[#FACC15] uppercase tracking-wider text-[11px]">
              Immutable Identity
            </div>
            <p className="text-[var(--cf-muted)] leading-relaxed break-words">
              {liveCanonicalBlock ||
                (isMs
                  ? 'Masukkan nama watak untuk menjana blok identiti kekal.'
                  : 'Enter a character name to preview the immutable identity block.')}
            </p>
          </div>

          <div className="space-y-1.5 text-xs border-t border-[var(--cf-border)] pt-3">
            <div className="font-bold text-[#00D9FF] uppercase tracking-wider text-[11px]">
              Mutable Attributes
            </div>
            <div className="text-[var(--cf-muted)] space-y-1">
              <div>Outfit: {form.primaryOutfit || '—'}</div>
              <div>Pose: {form.defaultPose || 'Standing'}</div>
              <div>Expression: {form.defaultExpression}</div>
              <div>Style Anchor: {form.visualStyle}</div>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            disabled={!form.name.trim()}
            onClick={async () => {
              const txt = buildCharacterContinuityPrompt(form, form.version);
              await navigator.clipboard.writeText(txt);
              notify('Character Continuity Prompt disalin!', 'success');
            }}
          >
            <Copy className="w-3.5 h-3.5" />
            {isMs ? 'Salin Continuity Prompt' : 'Copy Continuity Prompt'}
          </Button>
        </Card>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="xl:hidden fixed bottom-16 inset-x-0 z-30 border-t border-[var(--cf-border)] bg-[var(--cf-surface)]/95 backdrop-blur-md px-3 py-2 flex items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={stepIdx === 0}
          onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={stepIdx === BUILDER_STEPS.length - 1}
          onClick={() => setStepIdx((s) => Math.min(BUILDER_STEPS.length - 1, s + 1))}
        >
          {isMs ? 'Seterusnya' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button type="button" size="sm" onClick={() => handleSave()} className="flex-1">
          <Plus className="w-4 h-4" />
          {t.actions.saveCharacter}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title={isMs ? 'Padam Watak?' : 'Delete Character?'}
        description={
          isMs
            ? 'Watak ini akan dipadam daripada Pustaka Watak. Projek sedia ada tidak akan dipadam.'
            : 'This character will be removed from Character Library. Existing projects will not be deleted.'
        }
        confirmLabel={t.actions.delete}
        cancelLabel={t.actions.cancel}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteCharacter(deleteTargetId);
            if (form.id === deleteTargetId) handleNew();
            notify(isMs ? 'Watak dipadam.' : 'Character deleted.', 'default');
          }
          setDeleteTargetId(null);
        }}
      />

      {/* Controlled Identity Revision Confirmation */}
      <ConfirmDialog
        open={confirmIdentityRevision}
        title={isMs ? 'Sahkan Semakan Identiti Tetap' : 'Confirm Immutable Identity Revision'}
        description={
          isMs
            ? 'Anda telah mengubah ciri identiti kekal (ID, spesies, bentuk muka atau ciri khas) bagi watak sedia ada. Teruskan simpan perubahan ini?'
            : 'You modified immutable identity traits (ID, species, facial structure, or distinguishing features) on an existing character. Save this revision?'
        }
        confirmLabel={t.actions.confirm}
        cancelLabel={t.actions.cancel}
        onCancel={() => setConfirmIdentityRevision(false)}
        onConfirm={commitSaveCharacter}
      />
    </div>
  );
}
