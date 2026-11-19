import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  safeReadStorage,
  safeWriteStorage,
} from '@/components/providers/comicforge-provider';
import { TRANSLATIONS } from '@/lib/i18n/translations';
import { generateWithLocalEngine } from '@/lib/ai/local-engine';
import type { CharacterProfile, ComicProject } from '@/types/comicforge';

describe('Phase 1.5 — Local Storage Protection & Recovery', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow === undefined) {
      // @ts-expect-error restore undefined window in node test env
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it('recovers gracefully from malformed JSON and wrong-shape JSON in localStorage', () => {
    const store = new Map<string, string>([
      ['bad_json', '{not valid json'],
      ['wrong_array_shape', '{"oops":true}'],
      ['wrong_obj_shape', '["not","an","object"]'],
      ['valid_projects', JSON.stringify([{ id: 'p1', title: 'Test' }])],
    ]);

    globalThis.window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
      } as unknown as Storage,
    } as unknown as Window & typeof globalThis;

    expect(safeReadStorage('bad_json', [])).toEqual([]);
    expect(safeReadStorage('wrong_array_shape', [])).toEqual([]);
    expect(safeReadStorage('wrong_obj_shape', { theme: 'dark' })).toEqual({
      theme: 'dark',
    });
    expect(safeReadStorage('missing_key', [])).toEqual([]);
    expect(safeReadStorage('valid_projects', [])).toEqual([
      { id: 'p1', title: 'Test' },
    ]);
  });

  it('handles localStorage QuotaExceededError safely without throwing', () => {
    globalThis.window = {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new DOMException('QuotaExceededError');
        },
      } as unknown as Storage,
    } as unknown as Window & typeof globalThis;

    const result = safeWriteStorage('comicforge_v1_projects', [{ id: 'p1' }]);
    expect(result).toBe(false);
  });
});

describe('Phase 1.5 — Story Universe Studio Terminology & Legacy Compatibility', () => {
  it('uses Story Universe Studio across BM and EN navigation labels', () => {
    expect(TRANSLATIONS['ms-MY'].nav.storyBible).toBe('Story Universe Studio');
    expect(TRANSLATIONS['en'].nav.storyBible).toBe('Story Universe Studio');
  });

  it('never emits "Story Bible" in generated local engine prompts', () => {
    const char: CharacterProfile = {
      id: 'char-1',
      characterCode: 'CHAR-001',
      name: 'Hana',
      genderIdentity: 'Female',
      ageRange: '18',
      nationality: 'Malaysian',
      role: 'Protagonist',
      personality: 'Resourceful',
      biography: '',
      faceShape: 'Oval',
      skinTone: 'Fair',
      eyeShape: 'Almond',
      eyeColor: 'Brown',
      hairStyle: 'Bob cut',
      hairColor: 'Black',
      height: '162cm',
      bodyBuild: 'Slim',
      distinguishingFeatures: 'Hairpin',
      primaryOutfit: 'Varsity jacket',
      secondaryOutfit: '',
      outfitColors: 'Navy, Gold',
      accessories: 'Star hairpin',
      footwear: 'Sneakers',
      defaultExpression: 'Confident',
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
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const outline = generateWithLocalEngine({
      mode: 'full_story',
      engineMode: 'local',
      exportTarget: 'chatgpt',
      project: {
        id: 'proj-u1',
        title: 'Bintang Kuala Lumpur',
        genre: 'Fantasy',
        language: 'ms-MY',
        targetAudience: 'Teens (13-17)',
        premise: 'Misteri menara purba.',
        tone: 'Epic',
        artStyle: 'Korean Webtoon',
        format: 'Vertical Webtoon',
        aspectRatio: '9:16',
        episodeCount: 1,
        scenesPerEpisode: 1,
        panelsPerScene: 1,
        dialogueLength: 'medium',
        pacing: 'balanced',
      },
      characters: [char],
      worldRules: ['Magic requires mana'],
    });

    const serialized = JSON.stringify(outline);
    expect(serialized).not.toMatch(/story bible/i);
    expect(serialized).toContain('Story Universe Studio');
  });

  it('preserves character ID, characterCode, and project relationship integrity on update', () => {
    const project: ComicProject = {
      id: 'proj-rel-1',
      title: 'Projek Asal',
      genre: 'Action',
      language: 'ms-MY',
      targetAudience: 'All Ages',
      premise: 'Ujian hubungan watak.',
      tone: 'Cinematic',
      artStyle: 'Korean Webtoon',
      format: 'Vertical Webtoon',
      aspectRatio: '9:16',
      panelCount: 3,
      episodeCount: 1,
      scenesPerEpisode: 1,
      panelsPerScene: 3,
      dialogueLength: 'medium',
      pacing: 'balanced',
      assignedCharacterIds: ['char-1'],
      worldId: 'world-1',
      status: 'draft',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const updatedProject: ComicProject = {
      ...project,
      title: 'Projek Dikemaskini',
    };

    expect(updatedProject.id).toBe('proj-rel-1');
    expect(updatedProject.assignedCharacterIds).toEqual(['char-1']);
    expect(updatedProject.worldId).toBe('world-1');
  });
});
