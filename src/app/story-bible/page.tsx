'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  Globe2,
  MapPin,
  Plus,
  Shield,
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
  FANTASY_SPECIES,
  UNIVERSE_PRESETS,
  type StoryEvent,
  type StoryWorld,
  type WorldFaction,
  type WorldLocation,
} from '@/types/comicforge';
import { validateWorldContinuity } from '@/lib/v2/continuity-validator';
import { generateId } from '@/lib/utils';

function createBlankWorld(): StoryWorld {
  return {
    id: 'world_draft',
    worldName: '',
    universePreset: 'Modern Fantasy',
    worldDescription: '',
    genre: 'Fantasy',
    historicalPeriod: 'Contemporary',
    technologyLevel: 'Modern',
    geography: '',
    climate: 'Tropical',
    culture: '',
    society: '',
    politicalStructure: '',
    magicSystem: '',
    powerSystem: '',
    customSpeciesNote: '',
    worldRules: [],
    locations: [],
    factions: [],
    timeline: [],
    createdAt: '',
    updatedAt: '',
  };
}

export default function StoryBiblePage() {
  const { worlds, saveWorld, deleteWorld, characters, preferences, notify } = useComicForge();
  const isMs = preferences.uiLanguage === 'ms-MY';

  const [world, setWorld] = useState<StoryWorld>(() => worlds[0] ?? createBlankWorld());
  const [tab, setTab] = useState<'profile' | 'rules' | 'locations' | 'factions' | 'timeline'>('profile');

  // Quick-add states
  const [newRule, setNewRule] = useState('');
  const [locForm, setLocForm] = useState<Partial<WorldLocation>>({
    name: '',
    locationType: 'Urban / Interior',
    lightingCharacteristics: 'Natural daylight',
    isDestroyed: false,
  });
  const [facForm, setFacForm] = useState<Partial<WorldFaction>>({
    name: '',
    factionType: 'Organization',
    alignment: 'Neutral',
  });
  const [evForm, setEvForm] = useState<Partial<StoryEvent>>({
    episodeNumber: 1,
    timelinePosition: 1,
    eventType: 'plot',
    title: '',
    locationName: '',
    isFlashbackOrException: false,
  });
  const [evCharsInput, setEvCharsInput] = useState('');

  const continuityWarnings = useMemo(
    () => validateWorldContinuity(world, characters),
    [world, characters]
  );

  const handleSaveWorld = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!world.worldName.trim()) {
      notify(isMs ? 'Sila masukkan nama dunia.' : 'Please enter a world name.', 'error');
      return;
    }
    const now = new Date().toISOString();
    const toSave: StoryWorld = {
      ...world,
      id: world.id === 'world_draft' ? generateId('world') : world.id,
      createdAt: world.createdAt || now,
      updatedAt: now,
    };
    saveWorld(toSave);
    setWorld(toSave);
    notify(isMs ? `Story Universe "${toSave.worldName}" disimpan!` : `Story Universe "${toSave.worldName}" saved!`, 'success');
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    setWorld((w) => ({ ...w, worldRules: [...w.worldRules, newRule.trim()] }));
    setNewRule('');
  };

  const addLocation = () => {
    if (!locForm.name?.trim()) return;
    const loc: WorldLocation = {
      id: generateId('loc'),
      name: locForm.name.trim(),
      locationType: locForm.locationType || 'Urban',
      description: locForm.description || '',
      architecture: locForm.architecture || '',
      environment: locForm.environment || '',
      lightingCharacteristics: locForm.lightingCharacteristics || 'Natural daylight',
      importantObjects: locForm.importantObjects || '',
      historicalContext: locForm.historicalContext || '',
      continuityNotes: locForm.continuityNotes || '',
      isDestroyed: Boolean(locForm.isDestroyed),
    };
    setWorld((w) => ({ ...w, locations: [...w.locations, loc] }));
    setLocForm({ name: '', locationType: 'Urban / Interior', lightingCharacteristics: 'Natural daylight', isDestroyed: false });
  };

  const addFaction = () => {
    if (!facForm.name?.trim()) return;
    const fac: WorldFaction = {
      id: generateId('fac'),
      name: facForm.name.trim(),
      factionType: facForm.factionType || 'Organization',
      description: facForm.description || '',
      alignment: facForm.alignment || 'Neutral',
      keyRulesOrGoals: facForm.keyRulesOrGoals || '',
    };
    setWorld((w) => ({ ...w, factions: [...w.factions, fac] }));
    setFacForm({ name: '', factionType: 'Organization', alignment: 'Neutral' });
  };

  const addEvent = () => {
    if (!evForm.title?.trim()) return;
    const ev: StoryEvent = {
      id: generateId('ev'),
      episodeNumber: Number(evForm.episodeNumber) || 1,
      timelinePosition: Number(evForm.timelinePosition) || 1,
      eventType: evForm.eventType || 'plot',
      title: evForm.title.trim(),
      description: evForm.description || '',
      locationName: evForm.locationName || '',
      charactersInvolved: evCharsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      isFlashbackOrException: Boolean(evForm.isFlashbackOrException),
      exceptionReason: evForm.exceptionReason || '',
    };
    setWorld((w) => ({
      ...w,
      timeline: [...w.timeline, ev].sort(
        (a, b) => a.episodeNumber - b.episodeNumber || a.timelinePosition - b.timelinePosition
      ),
    }));
    setEvForm({ episodeNumber: 1, timelinePosition: 1, eventType: 'plot', title: '', locationName: '', isFlashbackOrException: false });
    setEvCharsInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="-skew-x-6 bg-[#FACC15] text-[#090D1A] px-2.5 py-0.5 text-xs font-black uppercase border-2 border-[#090D1A]">
              V2.0 STORY UNIVERSE STUDIO
            </span>
            <Badge variant="cyan">World &amp; Continuity Engine</Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Story Universe Studio</h1>
          <p className="text-sm text-[var(--cf-muted)]">
            {isMs
              ? 'Pangkalan data kesinambungan dunia, peraturan, lokasi, puak dan garis masa komik anda.'
              : 'Central continuity database for worlds, immutable rules, locations, factions, and story timeline.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setWorld(createBlankWorld())}>
            <Plus className="w-4 h-4 text-[#00D9FF]" />
            {isMs ? 'Dunia Baharu' : 'New World'}
          </Button>
          <Button onClick={() => handleSaveWorld()}>
            <Sparkles className="w-4 h-4" />
            {isMs ? 'Simpan Story Universe' : 'Save Story Universe'}
          </Button>
        </div>
      </div>

      {/* Saved Worlds Selector */}
      {worlds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {worlds.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWorld(w)}
              className={`px-3.5 py-2 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all min-h-[44px] ${
                world.id === w.id
                  ? 'cf-selected-ring bg-[#6366F1]/20'
                  : 'border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-muted)]'
              }`}
            >
              {w.worldName} ({w.universePreset})
            </button>
          ))}
        </div>
      )}

      {/* Continuity Warnings Banner */}
      <Card className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00D9FF]" />
            Continuity Validation ({continuityWarnings.length})
          </h2>
          {continuityWarnings.filter((w) => w.severity === 'warning').length === 0 && (
            <Badge variant="success">
              <CheckCircle2 className="w-3 h-3" /> No Contradictions
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          {continuityWarnings.map((w) => (
            <div
              key={w.id}
              className={`rounded-xl border p-3 text-xs flex items-start gap-2.5 ${
                w.severity === 'warning'
                  ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
                  : 'border-[#00D9FF]/30 bg-[var(--cf-surface-2)] text-[var(--cf-muted)]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#FACC15]" />
              <div>
                <div className="font-semibold">{w.message}</div>
                <div className="opacity-80 mt-0.5">{w.suggestion}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['profile', 'World Profile & Species', Globe2],
            ['rules', `World Rules (${world.worldRules.length})`, BookMarked],
            ['locations', `Location Library (${world.locations.length})`, MapPin],
            ['factions', `Factions (${world.factions.length})`, Users],
            ['timeline', `Timeline (${world.timeline.length})`, Sparkles],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer min-h-[44px] ${
              tab === key
                ? 'bg-[#6366F1] text-white'
                : 'bg-[var(--cf-surface)] border border-[var(--cf-border)] text-[var(--cf-muted)]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* TAB: WORLD PROFILE */}
      {tab === 'profile' && (
        <Card className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>World Name *</Label>
            <Input
              value={world.worldName}
              onChange={(e) => setWorld({ ...world, worldName: e.target.value })}
              placeholder="e.g. Neo Nusantara 2099 / Eldoria"
            />
          </div>
          <div>
            <Label>Universe Preset</Label>
            <Select
              value={world.universePreset}
              onChange={(e) => setWorld({ ...world, universePreset: e.target.value })}
            >
              {UNIVERSE_PRESETS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Genre</Label>
            <Input
              value={world.genre}
              onChange={(e) => setWorld({ ...world, genre: e.target.value })}
            />
          </div>
          <div>
            <Label>Historical Period &amp; Tech Level</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={world.historicalPeriod}
                onChange={(e) => setWorld({ ...world, historicalPeriod: e.target.value })}
                placeholder="Period"
              />
              <Input
                value={world.technologyLevel}
                onChange={(e) => setWorld({ ...world, technologyLevel: e.target.value })}
                placeholder="Tech level"
              />
            </div>
          </div>
          <div>
            <Label>Geography &amp; Climate</Label>
            <Input
              value={world.geography}
              onChange={(e) => setWorld({ ...world, geography: e.target.value })}
              placeholder="Floating archipelago, neon megacity, tropical valleys..."
            />
          </div>
          <div>
            <Label>Culture, Society &amp; Politics</Label>
            <Input
              value={world.politicalStructure}
              onChange={(e) => setWorld({ ...world, politicalStructure: e.target.value })}
              placeholder="Guild council, constitutional monarchy, corporate syndicates..."
            />
          </div>
          <div>
            <Label>Magic System</Label>
            <Input
              value={world.magicSystem}
              onChange={(e) => setWorld({ ...world, magicSystem: e.target.value })}
              placeholder="Elemental runes requiring mana crystals..."
            />
          </div>
          <div>
            <Label>Power System</Label>
            <Input
              value={world.powerSystem}
              onChange={(e) => setWorld({ ...world, powerSystem: e.target.value })}
              placeholder="Cybernetic resonance tiers 1–5..."
            />
          </div>
          <div className="md:col-span-2">
            <Label>World Description</Label>
            <Textarea
              rows={3}
              value={world.worldDescription}
              onChange={(e) => setWorld({ ...world, worldDescription: e.target.value })}
              placeholder="Core premise, atmosphere, and visual identity of this universe..."
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Supported Species in This World (Reference)</Label>
            <div className="flex flex-wrap gap-1.5">
              {FANTASY_SPECIES.map((sp) => (
                <Badge key={sp} variant="default">
                  {sp}
                </Badge>
              ))}
            </div>
            <Input
              value={world.customSpeciesNote}
              onChange={(e) => setWorld({ ...world, customSpeciesNote: e.target.value })}
              placeholder="Original species notes (distinct traits, cultures, visual differences)..."
            />
          </div>
          {world.id !== 'world_draft' && (
            <div className="md:col-span-2 flex justify-end">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteWorld(world.id);
                  setWorld(createBlankWorld());
                  notify(isMs ? 'Story Universe dipadam.' : 'Story Universe deleted.', 'default');
                }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete World
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* TAB: WORLD RULES */}
      {tab === 'rules' && (
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="e.g. Magic requires mana; teleportation only works via ancient gates"
            />
            <Button onClick={addRule}>
              <Plus className="w-4 h-4" /> Add Rule
            </Button>
          </div>
          {world.worldRules.length === 0 ? (
            <p className="text-xs text-[var(--cf-muted)]">No immutable world rules yet.</p>
          ) : (
            <ul className="space-y-2">
              {world.worldRules.map((rule, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] px-3.5 py-2.5 text-xs"
                >
                  <span>
                    <strong className="text-[#FACC15]">RULE #{idx + 1}:</strong> {rule}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setWorld((w) => ({
                        ...w,
                        worldRules: w.worldRules.filter((_, i) => i !== idx),
                      }))
                    }
                    className="p-1.5 text-rose-400 hover:opacity-80 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* TAB: LOCATION LIBRARY */}
      {tab === 'locations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-5 space-y-3">
            <h3 className="font-bold text-sm">Add Reusable Location</h3>
            <Input
              placeholder="Location Name *"
              value={locForm.name || ''}
              onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
            />
            <Input
              placeholder="Type (e.g. School Rooftop, Ancient Shrine)"
              value={locForm.locationType || ''}
              onChange={(e) => setLocForm({ ...locForm, locationType: e.target.value })}
            />
            <Input
              placeholder="Lighting Characteristics"
              value={locForm.lightingCharacteristics || ''}
              onChange={(e) =>
                setLocForm({ ...locForm, lightingCharacteristics: e.target.value })
              }
            />
            <Textarea
              rows={2}
              placeholder="Architecture, environment, important objects..."
              value={locForm.description || ''}
              onChange={(e) => setLocForm({ ...locForm, description: e.target.value })}
            />
            <Input
              placeholder="Continuity Notes"
              value={locForm.continuityNotes || ''}
              onChange={(e) => setLocForm({ ...locForm, continuityNotes: e.target.value })}
            />
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(locForm.isDestroyed)}
                onChange={(e) => setLocForm({ ...locForm, isDestroyed: e.target.checked })}
                className="accent-[#6366F1]"
              />
              <span>Mark as Destroyed (triggers continuity warning if reused)</span>
            </label>
            <Button onClick={addLocation} className="w-full">
              <Plus className="w-4 h-4" /> Add Location
            </Button>
          </Card>

          <Card className="lg:col-span-7 space-y-3">
            <h3 className="font-bold text-sm">Saved Locations ({world.locations.length})</h3>
            {world.locations.length === 0 ? (
              <p className="text-xs text-[var(--cf-muted)]">No locations added yet.</p>
            ) : (
              <div className="space-y-2.5">
                {world.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] p-3 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="font-bold flex items-center gap-2">
                        {loc.name}
                        <Badge variant="cyan">{loc.locationType}</Badge>
                        {loc.isDestroyed && <Badge variant="danger">Destroyed</Badge>}
                      </div>
                      <p className="text-[var(--cf-muted)]">{loc.description}</p>
                      <div className="text-[11px] text-[#00D9FF]">
                        Lighting: {loc.lightingCharacteristics}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setWorld((w) => ({
                          ...w,
                          locations: w.locations.filter((l) => l.id !== loc.id),
                        }))
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB: FACTIONS */}
      {tab === 'factions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-5 space-y-3">
            <h3 className="font-bold text-sm">Add Faction / Organization</h3>
            <Input
              placeholder="Faction Name *"
              value={facForm.name || ''}
              onChange={(e) => setFacForm({ ...facForm, name: e.target.value })}
            />
            <Input
              placeholder="Alignment / Type"
              value={facForm.alignment || ''}
              onChange={(e) => setFacForm({ ...facForm, alignment: e.target.value })}
            />
            <Textarea
              rows={2}
              placeholder="Goals, hierarchy, visual emblems..."
              value={facForm.description || ''}
              onChange={(e) => setFacForm({ ...facForm, description: e.target.value })}
            />
            <Button onClick={addFaction} className="w-full">
              <Plus className="w-4 h-4" /> Add Faction
            </Button>
          </Card>
          <Card className="lg:col-span-7 space-y-3">
            <h3 className="font-bold text-sm">World Factions ({world.factions.length})</h3>
            {world.factions.map((fac) => (
              <div
                key={fac.id}
                className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] p-3 flex items-start justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold">
                    {fac.name} <Badge variant="indigo">{fac.alignment}</Badge>
                  </div>
                  <p className="text-[var(--cf-muted)] mt-1">{fac.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setWorld((w) => ({
                      ...w,
                      factions: w.factions.filter((f) => f.id !== fac.id),
                    }))
                  }
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </Button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* TAB: TIMELINE */}
      {tab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-5 space-y-3">
            <h3 className="font-bold text-sm">Add Timeline Event</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Episode #</Label>
                <Input
                  type="number"
                  min={1}
                  value={evForm.episodeNumber || 1}
                  onChange={(e) =>
                    setEvForm({ ...evForm, episodeNumber: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Timeline Pos</Label>
                <Input
                  type="number"
                  min={1}
                  value={evForm.timelinePosition || 1}
                  onChange={(e) =>
                    setEvForm({ ...evForm, timelinePosition: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <Input
              placeholder="Event Title *"
              value={evForm.title || ''}
              onChange={(e) => setEvForm({ ...evForm, title: e.target.value })}
            />
            <Input
              placeholder="Location Name"
              value={evForm.locationName || ''}
              onChange={(e) => setEvForm({ ...evForm, locationName: e.target.value })}
            />
            <Input
              placeholder="Characters Involved (comma-separated, e.g. Alya, Arif)"
              value={evCharsInput}
              onChange={(e) => setEvCharsInput(e.target.value)}
            />
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(evForm.isFlashbackOrException)}
                onChange={(e) =>
                  setEvForm({ ...evForm, isFlashbackOrException: e.target.checked })
                }
                className="accent-[#6366F1]"
              />
              <span>Intentional Exception (Flashback / Time Travel / Alt Universe)</span>
            </label>
            <Button onClick={addEvent} className="w-full">
              <Plus className="w-4 h-4" /> Add Timeline Event
            </Button>
          </Card>

          <Card className="lg:col-span-7 space-y-3">
            <h3 className="font-bold text-sm">Chronological Timeline ({world.timeline.length})</h3>
            {world.timeline.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-2)] p-3 flex items-start justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="yellow">Ep {ev.episodeNumber} · #{ev.timelinePosition}</Badge>
                    <span className="font-bold">{ev.title}</span>
                    {ev.isFlashbackOrException && <Badge variant="indigo">Exception</Badge>}
                  </div>
                  {ev.locationName && (
                    <div className="text-[var(--cf-muted)]">Location: {ev.locationName}</div>
                  )}
                  {ev.charactersInvolved.length > 0 && (
                    <div className="text-[#00D9FF]">
                      Characters: {ev.charactersInvolved.join(', ')}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setWorld((w) => ({
                      ...w,
                      timeline: w.timeline.filter((item) => item.id !== ev.id),
                    }))
                  }
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </Button>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
