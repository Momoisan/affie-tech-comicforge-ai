import { describe, expect, it } from 'vitest';
import {
  validatePanelContinuity,
  validateWorldContinuity,
} from '@/lib/v2/continuity-validator';
import {
  buildCharacterContinuityPrompt,
  buildPromptPackage,
  validatePromptPackage,
} from '@/lib/v2/prompt-package';
import { generateWithLocalEngine } from '@/lib/ai/local-engine';
import type {
  CharacterProfile,
  ComicProject,
  StoryWorld,
  StructuredPanel,
} from '@/types/comicforge';

const sampleCharacter: CharacterProfile = {
  id: 'char-1',
  characterCode: 'CHAR-001',
  name: 'Aiman',
  role: 'Protagonist',
  species: 'Human',
  ageRange: '17',
  genderIdentity: 'Male',
  nationality: 'Malaysian',
  personality: 'Brave, observant',
  biography: 'Student at SMK Sentosa.',
  faceShape: 'Oval',
  skinTone: 'Warm tan',
  eyeShape: 'Almond',
  eyeColor: 'Dark brown',
  hairStyle: 'Messy black hair',
  hairColor: 'Jet black',
  height: '172cm',
  bodyBuild: 'Athletic',
  distinguishingFeatures: 'Sharp eyebrows',
  primaryOutfit: 'Blue Malaysian school blazer',
  secondaryOutfit: 'Casual hoodie',
  outfitColors: 'Navy, Cyan',
  accessories: 'Silver wristwatch',
  footwear: 'White sneakers',
  defaultPose: 'Standing',
  defaultExpression: 'Determined',
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
  versions: [
    {
      versionNumber: 1,
      label: 'Arc 1 — Active',
      ageRange: '17',
      outfitName: 'School Blazer',
      hairStyle: 'Messy black hair',
      equipment: 'Notebook',
      physicalCondition: 'Healthy',
      status: 'active',
      notes: '',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      versionNumber: 2,
      label: 'Arc 3 — Fallen',
      ageRange: '19',
      outfitName: 'Torn Coat',
      hairStyle: 'Longer hair',
      equipment: 'None',
      physicalCondition: 'Fallen in battle',
      status: 'deceased',
      notes: '',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const sampleWorld: StoryWorld = {
  id: 'world-1',
  worldName: 'Nusantara Aether',
  universePreset: 'Modern Fantasy',
  worldDescription: 'A modern Malaysian realm infused with ancient mana conduits.',
  genre: 'Fantasy',
  historicalPeriod: '2026',
  technologyLevel: 'Modern + Mana Tech',
  geography: 'Archipelago',
  climate: 'Tropical',
  culture: 'Malaysian Nusantara',
  society: 'Guilds and schools',
  politicalStructure: 'Council of Elders',
  magicSystem: 'Mana requires verbal seal.',
  powerSystem: 'Aether Resonance',
  customSpeciesNote: '',
  worldRules: ['Magic requires mana', 'No teleportation without a portal'],
  locations: [
    {
      id: 'loc-1',
      name: 'Old Clocktower',
      locationType: 'Landmark',
      description: 'Collapsed tower',
      architecture: 'Colonial stone',
      environment: 'Ruins',
      lightingCharacteristics: 'Overcast',
      importantObjects: 'Broken bell',
      historicalContext: 'Destroyed in Episode 1',
      continuityNotes: 'Remains ruined',
      isDestroyed: true,
    },
    {
      id: 'loc-2',
      name: 'Kopitiam Sentral',
      locationType: 'Cafe',
      description: 'Busy neighborhood cafe',
      architecture: 'Shophouse',
      environment: 'Urban',
      lightingCharacteristics: 'Warm tungsten',
      importantObjects: 'Marble tables',
      historicalContext: 'Safe meeting spot',
      continuityNotes: 'Intact',
      isDestroyed: false,
    },
  ],
  factions: [],
  timeline: [
    {
      id: 'ev-1',
      eventType: 'plot',
      title: 'Battle at Ruins',
      episodeNumber: 2,
      timelinePosition: 1,
      description: 'Aiman investigates the ruins.',
      locationName: 'Old Clocktower',
      charactersInvolved: ['Aiman'],
      isFlashbackOrException: false,
      exceptionReason: '',
    },
    {
      id: 'ev-2',
      eventType: 'character',
      title: 'Tea Briefing',
      episodeNumber: 2,
      timelinePosition: 1,
      description: 'Aiman drinks teh tarik.',
      locationName: 'Kopitiam Sentral',
      charactersInvolved: ['Aiman'],
      isFlashbackOrException: false,
      exceptionReason: '',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const samplePanel: StructuredPanel = {
  stable_panel_id: 'ep1_sc1_p1',
  project_id: 'proj-1',
  episode_number: 1,
  scene_number: 1,
  panel_number: 1,
  art_style: 'Korean Webtoon',
  aspect_ratio: '9:16',
  scene_context: 'Aiman enters the kopitiam before dusk.',
  scene_purpose: 'Establish setting',
  characters: [
    {
      character_id: 'CHAR-001',
      name: 'Aiman',
      expression: 'Focused',
      action: 'Walking inside',
    },
  ],
  environment: 'Kopitiam Sentral',
  camera: 'Eye Level',
  shot_type: 'Medium Shot',
  composition: 'Rule of Thirds',
  lighting: 'Warm dusk',
  mood: 'Intriguing',
  dialogue: [{ speaker: 'Aiman', text: 'Kita jumpa di sini.' }],
  narration: 'Senja mula melabuhkan tirai.',
  image_prompt: 'Korean webtoon panel of Aiman in a Malaysian kopitiam at dusk.',
  negative_prompt: 'blurry, extra limbs',
  continuity_notes: ['Maintain blue school blazer'],
};

describe('V2.0 Story Bible Continuity Validator', () => {
  it('flags destroyed location, simultaneous distant locations, and deceased character', () => {
    const warnings = validateWorldContinuity(sampleWorld, [sampleCharacter]);
    expect(warnings.some((w) => w.category === 'location' && w.message.includes('Old Clocktower'))).toBe(true);
    expect(warnings.some((w) => w.category === 'character' && w.message.includes('Kopitiam Sentral'))).toBe(true);
    expect(warnings.some((w) => w.category === 'timeline' && w.message.includes('deceased'))).toBe(true);
  });

  it('honors flashback/exception flag and suppresses non-applicable timeline warnings', () => {
    const exceptionWorld: StoryWorld = {
      ...sampleWorld,
      timeline: sampleWorld.timeline.map((ev) => ({ ...ev, isFlashbackOrException: true })),
    };
    const warnings = validateWorldContinuity(exceptionWorld, [sampleCharacter]);
    expect(warnings.filter((w) => w.severity === 'warning')).toHaveLength(0);
  });

  it('flags contradictory camera + shot type in panel continuity', () => {
    const badPanel: StructuredPanel = {
      ...samplePanel,
      shot_type: 'Extreme Close-Up',
      camera: "Bird's Eye View",
    };
    const warnings = validatePanelContinuity(badPanel);
    expect(warnings.some((w) => w.message.includes('Extreme Close-Up'))).toBe(true);
  });
});

describe('V2.0 Prompt Package Studio & Character Continuity', () => {
  it('builds a 12-part prompt package and validates quality cleanly', () => {
    const project: ComicProject = {
      id: 'proj-1',
      title: 'Aether Kopitiam',
      genre: 'Fantasy',
      language: 'ms-MY',
      targetAudience: 'Teens (13-17)',
      premise: 'A mystery at a Malaysian kopitiam.',
      tone: 'Cinematic',
      artStyle: 'Korean Webtoon',
      format: 'Vertical Webtoon',
      aspectRatio: '9:16',
      panelCount: 1,
      episodeCount: 1,
      scenesPerEpisode: 1,
      panelsPerScene: 1,
      dialogueLength: 'medium',
      pacing: 'balanced',
      assignedCharacterIds: ['char-1'],
      status: 'draft',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const pkg = buildPromptPackage({
      project,
      panel: samplePanel,
      characters: [sampleCharacter],
      world: sampleWorld,
      targetPlatform: 'chatgpt',
      engineUsed: 'local',
    });

    expect(pkg.fullPackageText).toContain('1. MAIN IMAGE PROMPT:');
    expect(pkg.fullPackageText).toContain('11. CONTINUITY INSTRUCTIONS:');
    expect(pkg.continuityInstructions).toContain('Magic requires mana');

    const warnings = validatePromptPackage(pkg);
    expect(warnings.filter((w) => w.severity === 'error')).toHaveLength(0);
  });

  it('builds character continuity prompt with version and species details', () => {
    const text = buildCharacterContinuityPrompt(sampleCharacter, 1);
    expect(text).toContain('AIMAN (CHAR-001)');
    expect(text).toContain('v1 (Arc 1 — Active)');
    expect(text).toContain('Human');
  });
});

describe('V2.0 Local Engine with World Rules & Malaysian Context', () => {
  it('injects worldRules and culturalContext into generated panels', () => {
    const outline = generateWithLocalEngine({
      mode: 'full_story',
      engineMode: 'local',
      exportTarget: 'gemini',
      project: {
        id: 'proj-my',
        title: 'Rahsia Kantin',
        genre: 'School Life',
        language: 'ms-MY',
        targetAudience: 'Teens (13-17)',
        premise: 'Misteri bilik kelab lama.',
        tone: 'Mysterious',
        artStyle: 'Korean Webtoon',
        format: 'Vertical Webtoon',
        aspectRatio: '9:16',
        episodeCount: 1,
        scenesPerEpisode: 1,
        panelsPerScene: 2,
        dialogueLength: 'medium',
        pacing: 'balanced',
        dialogueStyle: 'Casual Malaysian Malay',
        regionalDialect: 'Kelantan',
        culturalContext: 'Malaysian School',
      },
      characters: [sampleCharacter],
      worldName: 'SMK Sentosa',
      worldRules: ['Magic requires mana'],
    });

    const firstPanel = outline.episodes[0].scenes[0].panels[0];
    expect(firstPanel.stable_panel_id).toBe('pnl_proj-my_e1_s1_p1');
    expect(firstPanel.continuity_notes.some((n) => n.includes('Magic requires mana'))).toBe(true);
    expect(firstPanel.environment).toContain('Malaysian School');
    expect(firstPanel.scene_context).toContain('Malaysian School');
  });
});
