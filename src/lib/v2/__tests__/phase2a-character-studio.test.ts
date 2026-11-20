import { describe, expect, it } from 'vitest';
import {
  CharacterProfileSchema,
  SPECIES_CATEGORIES,
  isNonHumanSpecies,
  type CharacterProfile,
} from '@/types/comicforge';
import {
  buildCanonicalIdentityBlock,
  buildCharacterReferencePrompt,
  buildSpeciesTraitsSummary,
  getEffectiveSpecies,
} from '@/lib/ai/prompt-formatter';
import { buildCharacterContinuityPrompt } from '@/lib/v2/prompt-package';
import { generateWithLocalEngine } from '@/lib/ai/local-engine';

const baseV1Character = {
  id: 'char-legacy-1',
  characterCode: 'CHAR-001',
  name: 'Rizal',
  genderIdentity: 'Male',
  ageRange: '20',
  nationality: 'Malaysian',
  role: 'Protagonist',
  personality: 'Calm, tactical',
  biography: 'Courier in Kuala Lumpur.',
  faceShape: 'Square',
  skinTone: 'Tan',
  eyeShape: 'Almond',
  eyeColor: 'Dark brown',
  hairStyle: 'Short fade',
  hairColor: 'Black',
  height: '175cm',
  bodyBuild: 'Athletic',
  distinguishingFeatures: 'Left eyebrow scar',
  primaryOutfit: 'Techwear windbreaker',
  secondaryOutfit: '',
  outfitColors: 'Navy, Cyan',
  accessories: 'AR visor',
  footwear: 'Combat boots',
  defaultExpression: 'Neutral',
  customExpression: '',
  visualStyle: 'Korean Webtoon',
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
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Phase 2A — Visual Character Studio 2.0', () => {
  it('validates required character name and preserves legacy V1 character compatibility', () => {
    const emptyName = CharacterProfileSchema.safeParse({
      ...baseV1Character,
      name: '',
    });
    expect(emptyName.success).toBe(false);

    const legacyParsed = CharacterProfileSchema.safeParse(baseV1Character);
    expect(legacyParsed.success).toBe(true);
    if (legacyParsed.success) {
      expect(legacyParsed.data.id).toBe('char-legacy-1');
      expect(legacyParsed.data.characterCode).toBe('CHAR-001');
      expect(getEffectiveSpecies(legacyParsed.data)).toBe('Human');
    }
  });

  it('categorizes Human, Fantasy/Isekai, Supernatural, and Other species & detects non-human types', () => {
    expect(SPECIES_CATEGORIES.map((c) => c.category)).toEqual([
      'Human',
      'Fantasy / Isekai',
      'Supernatural',
      'Other',
    ]);
    expect(isNonHumanSpecies('Human')).toBe(false);
    expect(isNonHumanSpecies('Modern Human')).toBe(false);
    expect(isNonHumanSpecies('Historical Human')).toBe(false);
    expect(isNonHumanSpecies('Elf')).toBe(true);
    expect(isNonHumanSpecies('Slime')).toBe(true);
    expect(isNonHumanSpecies('Android')).toBe(true);
    expect(isNonHumanSpecies('Custom Species')).toBe(true);
  });

  it('supports custom species and conditional non-human anatomy traits in prompt serialization', () => {
    const dragonHero: CharacterProfile = {
      ...baseV1Character,
      id: 'char-dragon-1',
      characterCode: 'CHAR-009',
      name: 'Ignis',
      species: 'Custom Species',
      customSpecies: 'Celestial Dragonkin',
      signatureItem: 'Obsidian Ember Staff',
      speciesTraits: {
        horns: 'Swept obsidian horns',
        wings: 'Crystalline ember wings',
        tail: 'Armored dragon tail',
        scales: 'Gold-crimson forearm scales',
      },
    };

    expect(getEffectiveSpecies(dragonHero)).toBe('Celestial Dragonkin');
    const traits = buildSpeciesTraitsSummary(dragonHero);
    expect(traits).toContain('horns: Swept obsidian horns');
    expect(traits).toContain('wings: Crystalline ember wings');

    const canonical = buildCanonicalIdentityBlock(dragonHero);
    expect(canonical).toContain('[CHAR-009] Ignis (Celestial Dragonkin');
    expect(canonical).toContain('species traits (horns: Swept obsidian horns');
    expect(canonical).toContain('signature item: Obsidian Ember Staff');

    const refPrompt = buildCharacterReferencePrompt(dragonHero, 'chatgpt');
    expect(refPrompt).toContain('SPECIES: Celestial Dragonkin');
    expect(refPrompt).toContain('MUTABLE ATTRIBUTES (CAN VARY PER SCENE):');

    const contPrompt = buildCharacterContinuityPrompt(dragonHero);
    expect(contPrompt).toContain('SPECIES-SPECIFIC FEATURES:');
    expect(contPrompt).toContain('do not guarantee 100% identical reproduction');
  });

  it('integrates Phase 2A character traits cleanly into Local Prompt Engine', () => {
    const elfChar: CharacterProfile = {
      ...baseV1Character,
      species: 'Elf',
      speciesTraits: { ears: 'Long pointed elf ears' },
      signatureItem: 'Silver Rune Bow',
    };

    const outline = generateWithLocalEngine({
      mode: 'full_story',
      engineMode: 'local',
      exportTarget: 'gemini',
      project: {
        id: 'proj-2a',
        title: 'Hutan Cahaya',
        genre: 'Fantasy',
        language: 'ms-MY',
        targetAudience: 'Teens (13-17)',
        premise: 'Pengembaraan di rimba purba.',
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
      characters: [elfChar],
    });

    const panel = outline.episodes[0].scenes[0].panels[0];
    expect(panel.image_prompt).toContain('Elf');
    expect(panel.image_prompt).toContain('Long pointed elf ears');
    expect(panel.image_prompt).toContain('Silver Rune Bow');
  });
});
