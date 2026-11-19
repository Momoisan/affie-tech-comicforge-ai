import type {
  ArtStyleId,
  CharacterProfile,
  ComicEpisode,
  ComicScene,
  GenerateComicRequest,
  StoryLanguage,
  StoryOutline,
  StructuredPanel,
} from '@/types/comicforge';
import { ART_STYLES, getArtStylePromptBlock } from '@/lib/styles/art-styles';
import {
  buildCanonicalIdentityBlock,
  formatPanelHumanReadable,
} from '@/lib/ai/prompt-formatter';

// ============================================================================
// DETERMINISTIC SEEDED PRNG (Variation Engine)
// ============================================================================
function createSeededRng(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ============================================================================
// STORY TEMPLATE LIBRARY
// ============================================================================
interface GenreTemplate {
  worldSetting: { ms: string; en: string };
  conflictCore: { ms: string; en: string };
  locations: string[];
  moods: string[];
}

const GENRE_TEMPLATES: Record<string, GenreTemplate> = {
  Action: {
    worldSetting: {
      ms: 'Bandar raya moden dengan zon latihan berteknologi tinggi dan lorong malam yang penuh cabaran',
      en: 'A kinetic modern metropolis with high-tech training districts and neon-lit alleyways',
    },
    conflictCore: {
      ms: 'Pertembungan antara prinsip keadilan dan ancaman sindiket misteri yang semakin menghampiri',
      en: 'A clash between personal conviction and an encroaching covert syndicate',
    },
    locations: ['Rooftop overlooking neon city', 'Underground training arena', 'Rainy downtown intersection'],
    moods: ['High-energy', 'Tense', 'Adrenaline-charged'],
  },
  'School Life': {
    worldSetting: {
      ms: 'Sekolah menengah moden di Malaysia lengkap dengan koridor terbuka, kantin meriah dan bilik kelab',
      en: 'A lively modern Malaysian secondary school with sunlit corridors, bustling canteen, and clubrooms',
    },
    conflictCore: {
      ms: 'Persaingan sihat, salah faham persahabatan dan tekanan menjelang pertandingan peringkat negeri',
      en: 'Friendly rivalry, unspoken misunderstandings, and pressure before the state finals',
    },
    locations: ['Modern Malaysian classroom', 'School rooftop garden at recess', 'Bustling school canteen'],
    moods: ['Warm', 'Relatable', 'Bittersweet'],
  },
  Mystery: {
    worldSetting: {
      ms: 'Pekan bersejarah dengan perpustakaan lama, lorong berkabus dan rahsia yang tersembunyi sejak puluhan tahun',
      en: 'A quiet heritage town with an old archive library, misty lanes, and decades-old secrets',
    },
    conflictCore: {
      ms: 'Petunjuk ganjil yang muncul satu demi satu memaksa watak utama membongkar kebenaran sebelum terlambat',
      en: 'A trail of cryptic clues forces the lead to uncover the truth before time runs out',
    },
    locations: ['Dimly lit heritage archive room', 'Foggy streetlamp alleyway', 'Abandoned clocktower balcony'],
    moods: ['Suspenseful', 'Intriguing', 'Shadowy'],
  },
  Fantasy: {
    worldSetting: {
      ms: 'Alam Nusantara fantasi di mana kuasa purba, pulau terapung dan kota batu bersatu',
      en: 'An enchanted Nusantara-inspired realm where ancient relics, floating isles, and stone citadels meet',
    },
    conflictCore: {
      ms: 'Kebangkitan semula kuasa terlarang yang menguji kesetiaan dan keberanian pengembara muda',
      en: 'The awakening of a sealed ancient force testing the courage of young travelers',
    },
    locations: ['Sunlit ancient temple courtyard', 'Misty emerald forest clearing', 'Crystal-lit mountain shrine'],
    moods: ['Wonder-filled', 'Epic', 'Mystical'],
  },
  Comedy: {
    worldSetting: {
      ms: 'Kejiranan mesra di Malaysia dengan kedai kopi, pasar malam dan gelagat harian yang mencuit hati',
      en: 'A cheerful Malaysian neighborhood with a bustling kopitiam, night market, and everyday chaos',
    },
    conflictCore: {
      ms: 'Rancangan ringkas yang bertukar menjadi kekecohan lucu akibat salah faham bertindan',
      en: 'A simple everyday plan spirals into hilarious chaos due to escalating misunderstandings',
    },
    locations: ['Cozy Malaysian kopitiam', 'Colorful night market stall', 'Living room with chaotic props'],
    moods: ['Playful', 'Lighthearted', 'Comedic'],
  },
};

const DEFAULT_TEMPLATE: GenreTemplate = {
  worldSetting: {
    ms: 'Latar dunia kontemporari yang kaya dengan emosi, konflik hubungan dan pilihan sukar',
    en: 'A grounded contemporary world rich with emotional stakes, relationships, and turning points',
  },
  conflictCore: {
    ms: 'Ujian besar yang memaksa watak utama keluar daripada zon selesa untuk melindungi apa yang paling berharga',
    en: 'A defining challenge that forces the protagonist out of their comfort zone to protect what matters',
  },
  locations: ['Modern urban cafe', 'Quiet lakeside boardwalk at dusk', 'Bright contemporary studio'],
  moods: ['Engaging', 'Emotional', 'Cinematic'],
};

const CAMERA_ANGLES = [
  'Wide establishing shot',
  'Medium shot at eye level',
  'Over-the-shoulder shot',
  'Dynamic low-angle shot',
  'Expressive close-up on face',
  'Three-quarter medium-wide shot',
] as const;

const COMPOSITIONS = [
  'Rule-of-thirds framing with clear negative space for speech bubbles',
  'Dynamic diagonal lead-in lines drawing focus to the main character',
  'Balanced two-shot framing highlighting character interaction',
  'Foreground framing element adding depth and cinematic scale',
] as const;

const LIGHTING_PROFILES: Record<string, string[]> = {
  Dark: ['Moody chiaroscuro lighting with cool cyan rim light', 'Low-key dramatic shadows with single overhead beam'],
  Funny: ['Bright cheerful daylight with crisp soft shadows', 'Warm vibrant indoor lighting'],
  Emotional: ['Golden-hour warm sunlight with gentle lens glow', 'Soft rainy-window diffused light'],
  Cinematic: ['Dramatic volumetric lighting with warm/cool contrast', 'High-contrast rim lighting with atmospheric haze'],
};

// ============================================================================
// TITLE & PREMISE HELPERS
// ============================================================================
export function generateLocalTitle(genre: string, language: StoryLanguage, seed = Date.now()): string {
  const rng = createSeededRng(seed);
  const msTitles: Record<string, string[]> = {
    Action: ['Bayang Kota Neon', 'Jejak Pendekar Siber', 'Detik Terakhir di Kuala'],
    'School Life': ['Nota di Bangku Belakang', 'Kelab Komik & Rahsia', 'Langit Petang Sekolah'],
    Mystery: ['Misteri Jam Tengah Malam', 'Surat Tanpa Pengirim', 'Di Sebalik Pintu Arkib'],
    Fantasy: ['Legenda Pulau Awan', 'Penjaga Keris Cahaya', 'Gerbang Rimba Purba'],
    Comedy: ['Kecoh di Kopitiam Pak Mat', 'Misi Roti Canai Terbang', 'Operasi Rumah Bujang'],
  };
  const enTitles: Record<string, string[]> = {
    Action: ['Neon Horizon Protocol', 'Shadow of the Iron Spire', 'Zero Hour Strike'],
    'School Life': ['After-School Echoes', 'Sketchbook Promises', 'The Rooftop Club'],
    Mystery: ['The Midnight Archive', 'Whispers Behind Glass', 'Seven Clues to Dawn'],
    Fantasy: ['Chronicles of the Sky Citadel', 'Blade of Starlight', 'The Emerald Seal'],
    Comedy: ['Kopitiam Chaos', 'Operation Late Delivery', 'Too Many Roommates'],
  };

  if (language === 'en') {
    const pool = enTitles[genre] ?? [`Echoes of ${genre}`, `The ${genre} Horizon`, `Beyond ${genre}`];
    return pick(pool, rng);
  }
  const pool = msTitles[genre] ?? [`Kisah ${genre} Terpilih`, `Detik ${genre} Bermula`, `Cahaya di Sebalik ${genre}`];
  return pick(pool, rng);
}

export function expandLocalPremise(
  genre: string,
  tone: string,
  language: StoryLanguage,
  existingPremise: string
): string {
  const base = existingPremise.trim();
  const tpl = GENRE_TEMPLATES[genre] ?? DEFAULT_TEMPLATE;
  if (language === 'en') {
    return base
      ? `${base} Set in ${tpl.worldSetting.en.toLowerCase()}, the story escalates as ${tpl.conflictCore.en.toLowerCase()} with a ${tone.toLowerCase()} tone.`
      : `In ${tpl.worldSetting.en.toLowerCase()}, an unlikely protagonist faces ${tpl.conflictCore.en.toLowerCase()}, driving a ${tone.toLowerCase()} ${genre.toLowerCase()} comic series.`;
  }
  return base
    ? `${base} Berlatarkan ${tpl.worldSetting.ms.toLowerCase()}, konflik memuncak apabila ${tpl.conflictCore.ms.toLowerCase()} dengan nada ${tone.toLowerCase()}.`
    : `Berlatarkan ${tpl.worldSetting.ms.toLowerCase()}, watak utama berdepan ${tpl.conflictCore.ms.toLowerCase()} dalam sebuah siri komik ${genre} bernada ${tone.toLowerCase()}.`;
}

// ============================================================================
// DIALOGUE GENERATOR (BM Malaysia / English / Bilingual)
// ============================================================================
function buildPanelDialogue(
  language: StoryLanguage,
  speakers: CharacterProfile[],
  panelIndex: number,
  totalPanels: number,
  genre: string,
  dialogueLength: 'short' | 'medium' | 'detailed'
): { speaker: string; text: string }[] {
  if (speakers.length === 0) return [];
  const lead = speakers[0].name;
  const second = speakers[1]?.name;

  const isOpening = panelIndex === 0;
  const isClimax = panelIndex === totalPanels - 1;

  if (language === 'ms-MY') {
    if (isOpening) {
      return [
        {
          speaker: lead,
          text:
            dialogueLength === 'short'
              ? 'Eh, kenapa suasana hari ni rasa lain macam?'
              : 'Eh, cuba tengok tu... kenapa suasana hari ni rasa lain macam daripada biasa?',
        },
      ];
    }
    if (isClimax) {
      return [
        {
          speaker: lead,
          text: 'Kita tak boleh berundur sekarang. Apa pun jadi, kita hadap bersama!',
        },
        ...(second
          ? [{ speaker: second, text: 'Baik! Saya ikut belakang awak!' }]
          : []),
      ];
    }
    return [
      {
        speaker: lead,
        text:
          genre === 'Comedy'
            ? 'Alamak, jangan cakap plan kita baru saja bocor!'
            : 'Tunggu sekejap—ada sesuatu yang kita terlepas pandang tadi.',
      },
      ...(second && dialogueLength !== 'short'
        ? [{ speaker: second, text: 'Betul tu. Jom periksa sebelum terlambat.' }]
        : []),
    ];
  }

  if (language === 'bilingual') {
    if (isOpening) {
      return [{ speaker: lead, text: 'Wait—kenapa tempat ni tiba-tiba sunyi semacam?' }];
    }
    if (isClimax) {
      return [{ speaker: lead, text: 'No turning back now—kita selesaikan benda ni hari ni juga!' }];
    }
    return [{ speaker: lead, text: 'Hold on, ada clue penting yang kita belum check lagi.' }];
  }

  // English
  if (isOpening) {
    return [
      {
        speaker: lead,
        text:
          dialogueLength === 'short'
            ? 'Something feels off about today.'
            : 'Hold on—does everything look unusually quiet to you?',
      },
    ];
  }
  if (isClimax) {
    return [
      { speaker: lead, text: 'No turning back now. Whatever comes next, we face it together!' },
      ...(second ? [{ speaker: second, text: 'Right behind you. Let’s do this!' }] : []),
    ];
  }
  return [
    {
      speaker: lead,
      text: 'Wait a second—there is a detail here we completely missed earlier.',
    },
    ...(second && dialogueLength !== 'short'
      ? [{ speaker: second, text: 'Good catch. Let’s move before it’s too late.' }]
      : []),
  ];
}

// ============================================================================
// FULL STORY & PANEL PROMPT GENERATOR (ENGINE B)
// ============================================================================
export function generateWithLocalEngine(input: GenerateComicRequest): StoryOutline {
  const { project, characters, exportTarget } = input;
  const effectiveGenre =
    project.genre === 'Custom Genre' && project.customGenre?.trim()
      ? project.customGenre.trim()
      : project.genre;
  const tpl = GENRE_TEMPLATES[effectiveGenre] ?? DEFAULT_TEMPLATE;
  const seed = input.seed ?? Date.now();
  const rng = createSeededRng(seed);

  const title =
    project.title.trim() && project.title !== 'Untitled Comic'
      ? project.title.trim()
      : generateLocalTitle(effectiveGenre, project.language, seed);

  const premise =
    project.premise.trim() ||
    expandLocalPremise(effectiveGenre, project.tone, project.language, '');

  const styleSpec =
    ART_STYLES[project.artStyle as ArtStyleId] ?? ART_STYLES['Korean Webtoon'];
  const styleBlock = getArtStylePromptBlock(project.artStyle, project.customArtStyle);

  const fallbackCharacter: CharacterProfile = characters[0] ?? {
    id: 'char_default_01',
    characterCode: 'CHAR-001',
    name: project.language === 'en' ? 'Aria' : 'Alya',
    genderIdentity: 'Female',
    ageRange: 'Young Adult',
    nationality: 'Malaysian',
    role: 'Protagonist',
    personality: 'Determined and observant',
    biography: '',
    faceShape: 'Oval',
    skinTone: 'Warm tan',
    eyeShape: 'Almond',
    eyeColor: 'Dark brown',
    hairStyle: 'Shoulder-length layered',
    hairColor: 'Jet black',
    height: 'Average height',
    bodyBuild: 'Slim athletic',
    distinguishingFeatures: 'Small silver hairpin',
    primaryOutfit: 'Modern casual jacket over crisp tee and dark trousers',
    secondaryOutfit: '',
    outfitColors: 'Navy, cyan, white',
    accessories: 'Wristwatch',
    footwear: 'White sneakers',
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const activeChars = characters.length > 0 ? characters : [fallbackCharacter];

  const relationships =
    activeChars.length >= 2
      ? activeChars.slice(0, -1).map((c, idx) => {
          const partner = activeChars[idx + 1];
          return `${c.name} (${c.role}) & ${partner.name} (${partner.role}) — bound by shared stakes in ${effectiveGenre}`;
        })
      : [`${activeChars[0].name} (${activeChars[0].role}) — central anchor of the story`];

  const lightingPool = LIGHTING_PROFILES[project.tone] ?? LIGHTING_PROFILES.Cinematic;
  const episodes: ComicEpisode[] = [];

  for (let epIdx = 0; epIdx < project.episodeCount; epIdx++) {
    const epNum = epIdx + 1;
    const scenes: ComicScene[] = [];

    for (let scIdx = 0; scIdx < project.scenesPerEpisode; scIdx++) {
      const scNum = scIdx + 1;
      const location = tpl.locations[(epIdx + scIdx) % tpl.locations.length];
      const sceneLighting = pick(lightingPool, rng);
      const panels: StructuredPanel[] = [];

      for (let pIdx = 0; pIdx < project.panelsPerScene; pIdx++) {
        const pNum = pIdx + 1;
        const camera = CAMERA_ANGLES[(pIdx + scIdx) % CAMERA_ANGLES.length];
        const composition = pick(COMPOSITIONS, rng);
        const mood = pick(tpl.moods, rng);

        // Select up to 2 characters for the panel
        const panelChars = activeChars.slice(0, Math.min(2, activeChars.length));
        const expressions = ['Focused', 'Surprised', 'Determined', 'Thoughtful', 'Alert'];
        const actions = [
          'entering the scene and scanning the surroundings',
          'reacting sharply to an unexpected discovery',
          'pointing toward a crucial detail in the environment',
          'stepping forward with resolute posture',
        ];

        const charAppearances = panelChars.map((c, ci) => ({
          character_id: c.characterCode,
          name: c.name,
          expression: expressions[(pIdx + ci) % expressions.length],
          action: actions[(pIdx + scIdx + ci) % actions.length],
        }));

        const identityBlocks = panelChars
          .map((c) => buildCanonicalIdentityBlock(c))
          .join(' ; ');

        const dialogue = buildPanelDialogue(
          project.language,
          panelChars,
          pIdx,
          project.panelsPerScene,
          effectiveGenre,
          project.dialogueLength
        );

        const sceneContext =
          pIdx === 0
            ? `Establishing beat in ${location}: introducing the ${project.tone.toLowerCase()} atmosphere.`
            : pIdx === project.panelsPerScene - 1
              ? `Turning point beat in ${location}: escalating tension toward the next scene.`
              : `Developing character interaction inside ${location}.`;

        const imagePrompt = [
          `${project.artStyle} comic panel (${project.aspectRatio} aspect ratio, ${project.format}).`,
          styleBlock,
          `Scene: ${sceneContext}`,
          `Environment: ${location}.`,
          `Characters: ${identityBlocks}.`,
          `Action & Expression: ${charAppearances.map((ca) => `${ca.name} is ${ca.action} with a ${ca.expression.toLowerCase()} expression`).join('; ')}.`,
          `Camera & Composition: ${camera}, ${composition}.`,
          `Lighting & Mood: ${sceneLighting}, ${mood.toLowerCase()} mood.`,
          `No speech bubbles or embedded text overlays inside the artwork.`,
        ].join(' ');

        const negativePrompt = `${styleSpec.negativeKeywords}, inconsistent character face, changing outfit colors, extra fingers, deformed anatomy, blurry text, watermark`;

        const culturalNote =
          project.culturalContext && project.culturalContext !== 'None (Universal)'
            ? `Cultural setting: ${project.culturalContext}. `
            : '';

        const worldRulesNote =
          input.worldRules && input.worldRules.length > 0
            ? [`World Rules (${input.worldName || 'Story Universe Studio'}): ${input.worldRules.join('; ')}`]
            : [];

        const continuityNotes = [
          `Maintain locked identity & signature outfit for ${panelChars.map((c) => c.name).join(', ')}`,
          `Location continuity: ${location} (${sceneLighting})`,
          `Project art style locked to ${project.artStyle}`,
          ...worldRulesNote,
        ];

        const shotTypes = ['Establishing Shot', 'Medium Shot', 'Close-Up', 'Dynamic Action Shot'];
        const shotType = shotTypes[pIdx % shotTypes.length];

        const structuredPanel: StructuredPanel = {
          project_id: project.id,
          stable_panel_id: `pnl_${project.id}_e${epNum}_s${scNum}_p${pNum}`,
          episode_number: epNum,
          scene_number: scNum,
          panel_number: pNum,
          art_style: project.artStyle,
          aspect_ratio: project.aspectRatio,
          scene_context: `${culturalNote}${sceneContext}`,
          scene_purpose: pIdx === 0 ? 'Scene Setup' : pIdx === project.panelsPerScene - 1 ? 'Turning Point' : 'Action / Dialogue Beat',
          shot_type: shotType,
          characters: charAppearances,
          environment: culturalNote ? `${location} (${project.culturalContext})` : location,
          camera,
          composition,
          lighting: sceneLighting,
          mood,
          dialogue,
          narration:
            pIdx === 0
              ? project.language === 'en'
                ? `Episode ${epNum}, Scene ${scNum}: ${location}.`
                : `Episod ${epNum}, Babak ${scNum}: ${location}.`
              : '',
          image_prompt: imagePrompt,
          negative_prompt: negativePrompt,
          continuity_notes: continuityNotes,
        };

        structuredPanel.human_readable_prompt = formatPanelHumanReadable(
          structuredPanel,
          title,
          activeChars,
          exportTarget,
          project.customArtStyle
        );

        panels.push(structuredPanel);
      }

      scenes.push({
        id: `ep${epNum}_sc${scNum}`,
        scene_number: scNum,
        title:
          project.language === 'en'
            ? `Scene ${scNum}: ${location}`
            : `Babak ${scNum}: ${location}`,
        description: `Set at ${location}, advancing the ${effectiveGenre.toLowerCase()} plot with ${project.pacing} pacing.`,
        location,
        continuity_summary: `Characters retain locked attire and appearance; lighting remains ${sceneLighting}.`,
        panels,
      });
    }

    episodes.push({
      id: `ep_${epNum}`,
      episode_number: epNum,
      title:
        project.language === 'en'
          ? `Episode ${epNum}: Rising Sparks`
          : `Episod ${epNum}: Titik Permulaan`,
      synopsis:
        project.language === 'en'
          ? `Episode ${epNum} follows ${activeChars[0].name} as the central conflict of "${title}" unfolds.`
          : `Episod ${epNum} mengikuti ${activeChars[0].name} tatkala konflik utama "${title}" mula terungkai.`,
      cliffhanger:
        project.language === 'en'
          ? 'An unexpected figure steps out of the shadows just as the truth comes into view.'
          : 'Kelibat misteri muncul di sebalik bayang tepat ketika rahsia hampir terbongkar.',
      scenes,
    });
  }

  return {
    title,
    genre: effectiveGenre,
    main_premise: premise,
    world_setting: project.language === 'en' ? tpl.worldSetting.en : tpl.worldSetting.ms,
    main_conflict: project.language === 'en' ? tpl.conflictCore.en : tpl.conflictCore.ms,
    character_relationships: relationships,
    story_arc:
      project.language === 'en'
        ? `Beginning in ${tpl.locations[0]} -> Escalating tension -> Turning-point cliffhanger.`
        : `Permulaan di ${tpl.locations[0]} -> Konflik memuncak -> Klimaks tergantung (cliffhanger).`,
    episodes,
  };
}
