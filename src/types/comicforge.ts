import { z } from 'zod';

// ============================================================================
// CORE ENUMS & CONSTANTS
// ============================================================================

export const UI_LANGUAGES = ['ms-MY', 'en'] as const;
export type UILanguage = (typeof UI_LANGUAGES)[number];

export const STORY_LANGUAGES = ['ms-MY', 'en', 'bilingual'] as const;
export type StoryLanguage = (typeof STORY_LANGUAGES)[number];

export const THEMES = ['dark', 'light'] as const;
export type ThemeMode = (typeof THEMES)[number];

export const ENGINE_MODES = ['auto', 'gemini', 'local'] as const;
export type EngineMode = (typeof ENGINE_MODES)[number];

export const ENGINE_IDS = ['gemini', 'local'] as const;
export type EngineId = (typeof ENGINE_IDS)[number];

export const EXPORT_TARGETS = ['chatgpt', 'gemini'] as const;
export type ExportTarget = (typeof EXPORT_TARGETS)[number];

export const COMIC_GENRES = [
  'Action',
  'Adventure',
  'Romance',
  'Comedy',
  'Horror',
  'Mystery',
  'Thriller',
  'Fantasy',
  'Science Fiction',
  'Slice of Life',
  'School Life',
  'Family',
  'Historical',
  'Superhero',
  'Educational',
  'Custom Genre',
] as const;
export type ComicGenre = (typeof COMIC_GENRES)[number];

export const TARGET_AUDIENCES = [
  'Children',
  'Teenagers',
  'Young Adults',
  'Adults',
  'General Audience',
] as const;
export type TargetAudience = (typeof TARGET_AUDIENCES)[number];

export const STORY_TONES = [
  'Funny',
  'Emotional',
  'Dramatic',
  'Dark',
  'Inspirational',
  'Suspenseful',
  'Wholesome',
  'Cinematic',
] as const;
export type StoryTone = (typeof STORY_TONES)[number];

export const PUBLISHING_FORMATS = [
  'Traditional Comic',
  'Vertical Webtoon',
  'Social Media Comic',
  'Single-Panel Comic',
  'Educational Comic',
  'Comic Strip',
] as const;
export type PublishingFormat = (typeof PUBLISHING_FORMATS)[number];

export const ASPECT_RATIOS = ['9:16', '3:4', '4:5', '1:1', '16:9', 'A4 Portrait'] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const ART_STYLE_IDS = [
  'Japanese Manga — Black & White',
  'Japanese Manga — Full Color',
  'Korean Webtoon',
  'Western Comic Book',
  'Cinematic Graphic Novel',
  'Malaysian Cartoon',
  '3D Stylized Cartoon',
  'Chibi',
  'Semi-Realistic Illustration',
  'Watercolor Comic',
  "Children's Storybook",
  'Pixel Art Comic',
  'Custom Art Style',
] as const;
export type ArtStyleId = (typeof ART_STYLE_IDS)[number];

export const CHARACTER_EXPRESSIONS = [
  'Neutral',
  'Happy',
  'Sad',
  'Angry',
  'Shocked',
  'Crying',
  'Confused',
  'Excited',
  'Custom Expression',
] as const;
export type CharacterExpression = (typeof CHARACTER_EXPRESSIONS)[number];

export const CHARACTER_VISUAL_STYLES = [
  'Manga',
  'Webtoon',
  'Cartoon',
  'Semi-Realistic',
  '3D Stylized',
  'Custom',
] as const;
export type CharacterVisualStyle = (typeof CHARACTER_VISUAL_STYLES)[number];

// ============================================================================
// ZOD SCHEMAS — CHARACTER STUDIO
// ============================================================================

export const CharacterIdentityLockSchema = z.object({
  lockNameAndId: z.boolean().default(true),
  lockFacialStructure: z.boolean().default(true),
  lockHair: z.boolean().default(true),
  lockEyeColor: z.boolean().default(true),
  lockSkinTone: z.boolean().default(true),
  lockSignatureOutfit: z.boolean().default(true),
  lockAccessories: z.boolean().default(true),
  lockDistinguishingFeatures: z.boolean().default(true),
  lockArtStyle: z.boolean().default(true),
  canonicalIdentityBlock: z.string().default(''),
});
export type CharacterIdentityLock = z.infer<typeof CharacterIdentityLockSchema>;

export const CharacterProfileSchema = z.object({
  id: z.string().min(1),
  characterCode: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  genderIdentity: z.string().max(80).default('Unspecified'),
  ageRange: z.string().max(60).default('Young Adult'),
  nationality: z.string().max(80).default('Malaysian'),
  role: z.string().max(80).default('Protagonist'),
  personality: z.string().max(500).default(''),
  biography: z.string().max(1500).default(''),

  // Physical Appearance
  faceShape: z.string().max(80).default('Oval'),
  skinTone: z.string().max(80).default('Warm tan'),
  eyeShape: z.string().max(80).default('Almond'),
  eyeColor: z.string().max(80).default('Dark brown'),
  hairStyle: z.string().max(120).default('Medium layered'),
  hairColor: z.string().max(80).default('Jet black'),
  height: z.string().max(60).default('Average height'),
  bodyBuild: z.string().max(80).default('Slim athletic'),
  distinguishingFeatures: z.string().max(300).default('None'),

  // Outfit
  primaryOutfit: z.string().max(300).default(''),
  secondaryOutfit: z.string().max(300).default(''),
  outfitColors: z.string().max(160).default(''),
  accessories: z.string().max(240).default(''),
  footwear: z.string().max(160).default(''),

  // Expression & Style
  defaultExpression: z.string().max(80).default('Neutral'),
  customExpression: z.string().max(120).default(''),
  visualStyle: z.string().max(80).default('Webtoon'),
  customVisualStyle: z.string().max(160).default(''),

  // Identity Lock & Reference
  identityLock: CharacterIdentityLockSchema,
  referencePrompt: z.string().default(''),
  referenceImageUrl: z.string().optional(),
  version: z.number().int().min(1).default(1),
  status: z.enum(['active', 'archived']).default('active'),
  // V2.0 Extensions (optional for V1 backward compatibility)
  species: z.string().max(80).optional(),
  customSpecies: z.string().max(120).optional(),
  defaultPose: z.string().max(80).optional(),
  continuityPrompt: z.string().optional(),
  // Phase 2A Visual Character Studio 2.0 Extensions (all optional for full compatibility)
  signatureItem: z.string().max(200).optional(),
  motivations: z.string().max(400).optional(),
  strengths: z.string().max(400).optional(),
  weaknesses: z.string().max(400).optional(),
  relationships: z.string().max(500).optional(),
  speakingStyle: z.string().max(240).optional(),
  speciesTraits: z
    .object({
      horns: z.string().max(160).optional(),
      wings: z.string().max(160).optional(),
      tail: z.string().max(160).optional(),
      ears: z.string().max(160).optional(),
      scales: z.string().max(160).optional(),
      fur: z.string().max(160).optional(),
      slimeBody: z.string().max(160).optional(),
      mechanicalParts: z.string().max(160).optional(),
      customAnatomy: z.string().max(240).optional(),
    })
    .optional(),
  outfits: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    description: z.string(),
    colors: z.string(),
    accessories: z.string(),
    footwear: z.string(),
  })).optional(),
  versions: z.array(z.object({
    versionNumber: z.number().int().min(1),
    label: z.string(),
    ageRange: z.string(),
    outfitName: z.string(),
    hairStyle: z.string(),
    equipment: z.string(),
    physicalCondition: z.string(),
    status: z.enum(['active', 'injured', 'deceased', 'missing']),
    notes: z.string(),
    createdAt: z.string(),
  })).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CharacterProfile = z.infer<typeof CharacterProfileSchema>;

export const CHARACTER_VISUAL_STYLES_2A = [
  'Manga',
  'Korean Webtoon',
  'Manhwa',
  'Western Comic',
  'Anime',
  '3D Stylized',
  'Photorealistic',
  'Custom',
] as const;

export const SPECIES_CATEGORIES = [
  {
    category: 'Human',
    items: ['Human', 'Modern Human', 'Historical Human'],
  },
  {
    category: 'Fantasy / Isekai',
    items: ['Elf', 'Dark Elf', 'Half-Elf', 'Dwarf', 'Goblin', 'Orc', 'Beastfolk', 'Fairy'],
  },
  {
    category: 'Supernatural',
    items: ['Vampire', 'Werewolf', 'Demon', 'Angel', 'Spirit', 'Undead'],
  },
  {
    category: 'Other',
    items: ['Slime', 'Dragonkin', 'Android', 'Robot', 'Alien', 'Custom Species'],
  },
] as const;

export function isNonHumanSpecies(species?: string): boolean {
  if (!species) return false;
  return !['Human', 'Modern Human', 'Historical Human'].includes(species);
}

// ============================================================================
// ZOD SCHEMAS — COMIC PANEL & STORY STRUCTURE (FORMAT B)
// ============================================================================

export const PanelCharacterAppearanceSchema = z.object({
  character_id: z.string(),
  name: z.string(),
  expression: z.string(),
  action: z.string(),
});
export type PanelCharacterAppearance = z.infer<typeof PanelCharacterAppearanceSchema>;

export const PanelDialogueLineSchema = z.object({
  speaker: z.string(),
  text: z.string(),
});
export type PanelDialogueLine = z.infer<typeof PanelDialogueLineSchema>;

export const StructuredPanelSchema = z.object({
  project_id: z.string(),
  episode_number: z.number().int().min(1),
  scene_number: z.number().int().min(1),
  panel_number: z.number().int().min(1),
  art_style: z.string(),
  aspect_ratio: z.string(),
  scene_context: z.string().default(''),
  characters: z.array(PanelCharacterAppearanceSchema).default([]),
  environment: z.string(),
  camera: z.string(),
  composition: z.string().default('Balanced comic framing'),
  lighting: z.string(),
  mood: z.string().default('Engaging'),
  dialogue: z.array(PanelDialogueLineSchema).default([]),
  narration: z.string().default(''),
  image_prompt: z.string(),
  negative_prompt: z.string(),
  continuity_notes: z.array(z.string()).default([]),
  human_readable_prompt: z.string().optional(),
  generation_notes: z.string().optional(),
  // V2.0 Smart Panel Director fields
  stable_panel_id: z.string().optional(),
  scene_purpose: z.string().optional(),
  shot_type: z.string().optional(),
  sound_effects: z.string().optional(),
  art_style_override: z.string().optional(),
  revisions: z.array(z.object({
    revisionNumber: z.number().int().min(1),
    camera: z.string(),
    shotType: z.string(),
    composition: z.string(),
    lighting: z.string(),
    dialogue: z.array(PanelDialogueLineSchema),
    imagePrompt: z.string(),
    negativePrompt: z.string(),
    engineUsed: z.enum(ENGINE_IDS),
    createdAt: z.string(),
  })).optional(),
});
export type StructuredPanel = z.infer<typeof StructuredPanelSchema>;

export const ComicSceneSchema = z.object({
  id: z.string(),
  scene_number: z.number().int().min(1),
  title: z.string().default(''),
  description: z.string(),
  location: z.string(),
  continuity_summary: z.string().default(''),
  panels: z.array(StructuredPanelSchema),
});
export type ComicScene = z.infer<typeof ComicSceneSchema>;

export const PAGE_PLAN_STATUSES = [
  'Not Started',
  'Planned',
  'Prompt Ready',
  'Awaiting Artwork',
  'In Progress',
  'Completed',
] as const;
export type PagePlanStatus = (typeof PAGE_PLAN_STATUSES)[number];

export const STORY_ARC_PRESETS = [
  'Beginning / Setup',
  'Development / Rising Action',
  'Climax',
  'Resolution',
] as const;

export const PlannedPageSchema = z.object({
  id: z.string(),
  pageNumber: z.number().int().min(1),
  episodeNumber: z.number().int().min(1).default(1),
  sceneId: z.string().optional(),
  storyBeat: z.string().default(''),
  sceneSummary: z.string().default(''),
  charactersPresent: z.array(z.string()).default([]),
  location: z.string().default(''),
  panelCount: z.number().int().min(1).max(12).default(4),
  status: z.enum(PAGE_PLAN_STATUSES).default('Planned'),
  recap: z.string().default(''),
});
export type PlannedPage = z.infer<typeof PlannedPageSchema>;

export const ComicEpisodeSchema = z.object({
  id: z.string(),
  episode_number: z.number().int().min(1),
  title: z.string(),
  storyArc: z.string().optional(),
  synopsis: z.string(),
  cliffhanger: z.string().default(''),
  scenes: z.array(ComicSceneSchema),
});
export type ComicEpisode = z.infer<typeof ComicEpisodeSchema>;

export const StoryOutlineSchema = z.object({
  title: z.string(),
  genre: z.string(),
  main_premise: z.string(),
  world_setting: z.string(),
  main_conflict: z.string(),
  character_relationships: z.array(z.string()).default([]),
  story_arc: z.string(),
  episodes: z.array(ComicEpisodeSchema),
});
export type StoryOutline = z.infer<typeof StoryOutlineSchema>;

export const ComicProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(160),
  genre: z.string().min(1).max(80),
  customGenre: z.string().max(80).optional(),
  targetAudience: z.string().default('General Audience'),
  language: z.enum(STORY_LANGUAGES).default('ms-MY'),
  premise: z.string().max(3000).default(''),
  tone: z.string().default('Cinematic'),
  artStyle: z.string().default('Korean Webtoon'),
  customArtStyle: z.string().max(300).optional(),
  format: z.string().default('Vertical Webtoon'),
  aspectRatio: z.string().default('9:16'),
  panelCount: z.number().int().min(1).max(18).default(4),
  episodeCount: z.number().int().min(1).max(5).default(1),
  scenesPerEpisode: z.number().int().min(1).max(5).default(2),
  panelsPerScene: z.number().int().min(1).max(9).default(3),
  dialogueLength: z.enum(['short', 'medium', 'detailed']).default('medium'),
  pacing: z.enum(['fast', 'balanced', 'slow-burn']).default('balanced'),
  assignedCharacterIds: z.array(z.string()).default([]),
  worldId: z.string().optional(),
  dialogueStyle: z.string().optional(),
  regionalDialect: z.string().optional(),
  culturalContext: z.string().optional(),
  // Phase 2B-1 Optional Project Metadata (backward-compatible)
  coverThumbnailUrl: z.string().optional(),
  currentEpisode: z.number().int().min(1).optional(),
  totalPages: z.number().int().min(0).optional(),
  exportStatus: z.enum(['not_exported', 'exported']).optional(),
  characterRoles: z.record(z.string(), z.string()).optional(),
  props: z.array(z.string()).optional(),
  // Phase 2B-2 Optional Page Planning Metadata (backward-compatible)
  plannedPages: z.array(PlannedPageSchema).optional(),
  storyOutline: StoryOutlineSchema.optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'archived']).default('draft'),
  lastEngineUsed: z.enum(ENGINE_IDS).optional(),
  fallbackUsed: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ComicProject = z.infer<typeof ComicProjectSchema>;

// ============================================================================
// ZOD SCHEMAS — SAVED PROMPTS & PREFERENCES
// ============================================================================

export const SavedPromptSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  projectTitle: z.string().optional(),
  characterId: z.string().optional(),
  characterName: z.string().optional(),
  promptType: z.enum(['panel', 'character_reference', 'story_outline', 'template']),
  engineUsed: z.enum(ENGINE_IDS),
  fallbackUsed: z.boolean().default(false),
  artStyle: z.string().optional(),
  exportTarget: z.enum(EXPORT_TARGETS).default('chatgpt'),
  promptText: z.string(),
  structuredOutput: z.record(z.string(), z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
});
export type SavedPrompt = z.infer<typeof SavedPromptSchema>;

export const UserPreferencesSchema = z.object({
  uiLanguage: z.enum(UI_LANGUAGES).default('ms-MY'),
  theme: z.enum(THEMES).default('dark'),
  preferredEngine: z.enum(ENGINE_MODES).default('auto'),
  defaultStyle: z.string().default('Korean Webtoon'),
  defaultAspectRatio: z.string().default('9:16'),
  defaultStoryLanguage: z.enum(STORY_LANGUAGES).default('ms-MY'),
  exportTarget: z.enum(EXPORT_TARGETS).default('chatgpt'),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// ============================================================================
// API REQUEST / RESPONSE SCHEMAS
// ============================================================================

export const GenerateComicRequestSchema = z.object({
  mode: z.enum(['title', 'premise_expand', 'full_story']).default('full_story'),
  engineMode: z.enum(ENGINE_MODES).default('auto'),
  exportTarget: z.enum(EXPORT_TARGETS).default('chatgpt'),
  seed: z.number().int().optional(),
  project: z.object({
    id: z.string().min(1).max(100),
    title: z.string().max(160).default('Untitled Comic'),
    genre: z.string().min(1).max(80),
    customGenre: z.string().max(80).optional(),
    targetAudience: z.string().max(80).default('General Audience'),
    language: z.enum(STORY_LANGUAGES).default('ms-MY'),
    premise: z.string().max(3000).default(''),
    tone: z.string().max(80).default('Cinematic'),
    artStyle: z.string().max(120).default('Korean Webtoon'),
    customArtStyle: z.string().max(300).optional(),
    format: z.string().max(80).default('Vertical Webtoon'),
    aspectRatio: z.string().max(40).default('9:16'),
    episodeCount: z.number().int().min(1).max(3).default(1),
    scenesPerEpisode: z.number().int().min(1).max(4).default(2),
    panelsPerScene: z.number().int().min(1).max(6).default(3),
    dialogueLength: z.enum(['short', 'medium', 'detailed']).default('medium'),
    pacing: z.enum(['fast', 'balanced', 'slow-burn']).default('balanced'),
    dialogueStyle: z.string().max(80).optional(),
    regionalDialect: z.string().max(80).optional(),
    culturalContext: z.string().max(120).optional(),
  }),
  characters: z.array(CharacterProfileSchema).max(10).default([]),
  worldRules: z.array(z.string()).max(20).optional(),
  worldName: z.string().max(120).optional(),
});
export type GenerateComicRequest = z.infer<typeof GenerateComicRequestSchema>;

export const GenerateCharacterRefRequestSchema = z.object({
  engineMode: z.enum(ENGINE_MODES).default('auto'),
  exportTarget: z.enum(EXPORT_TARGETS).default('chatgpt'),
  character: CharacterProfileSchema,
});
export type GenerateCharacterRefRequest = z.infer<typeof GenerateCharacterRefRequestSchema>;

export interface EngineStatusSummary {
  geminiConfigured: boolean;
  geminiModel: string;
  localEngineReady: boolean;
  supabaseConfigured: boolean;
  defaultEngineMode: EngineMode;
  activeStorageMode: 'supabase' | 'local-browser';
}

// ============================================================================
// V2.0 CONSTANTS & SCHEMAS — STORY BIBLE, CHARACTER V2, DIRECTOR, PACKAGE
// ============================================================================

export const UNIVERSE_PRESETS = [
  'Medieval Fantasy',
  'Modern Fantasy',
  'Isekai',
  'Dark Fantasy',
  'Science Fantasy',
  'Cyberpunk',
  'Post-Apocalyptic',
  'Supernatural',
  'Mythological',
  'Custom Universe',
] as const;
export type UniversePreset = (typeof UNIVERSE_PRESETS)[number];

export const FANTASY_SPECIES = [
  'Human',
  'Elf',
  'Dark Elf',
  'Dwarf',
  'Goblin',
  'Orc',
  'Beastfolk',
  'Dragonkin',
  'Demon',
  'Angel',
  'Slime',
  'Undead',
  'Vampire',
  'Fairy',
  'Spirit',
  'Hybrid Species',
  'Custom Species',
] as const;
export type FantasySpecies = (typeof FANTASY_SPECIES)[number];

export const POSE_PRESETS = [
  'Standing',
  'Sitting',
  'Walking',
  'Running',
  'Fighting',
  'Jumping',
  'Looking Back',
  'Pointing',
  'Custom Pose',
] as const;
export type PosePreset = (typeof POSE_PRESETS)[number];

export const CAMERA_ANGLES_V2 = [
  'Eye Level',
  'Low Angle',
  'High Angle',
  "Bird's Eye View",
  'Over-the-Shoulder',
  'Dutch Angle',
  'First-Person POV',
] as const;

export const SHOT_TYPES_V2 = [
  'Extreme Close-Up',
  'Close-Up',
  'Medium Shot',
  'Full Shot',
  'Wide Shot',
  'Establishing Shot',
  'Dynamic Action Shot',
] as const;

export const COMPOSITIONS_V2 = [
  'Rule of Thirds',
  'Centered Composition',
  'Symmetrical',
  'Diagonal Composition',
  'Foreground Framing',
  'Cinematic Depth',
] as const;

export const MALAYSIAN_DIALOGUE_STYLES = [
  'Standard Malaysian Malay',
  'Casual Malaysian Malay',
  'Gen-Z Malaysian Malay',
  'Formal Malaysian Malay',
  'Regional Dialogue',
] as const;

export const MALAYSIAN_REGIONAL_PRESETS = [
  'None',
  'Kedah',
  'Kelantan',
  'Terengganu',
  'Negeri Sembilan',
  'Johor',
  'Sabah',
  'Sarawak',
] as const;

export const MALAYSIAN_CULTURAL_CONTEXTS = [
  'None (Universal)',
  'Malaysian School',
  'University Life',
  'Kampung',
  'Urban Kuala Lumpur',
  'Malaysian Office',
  'Family Drama',
  'Local Comedy',
  'Malaysian Superhero',
  'Malaysian Fantasy',
  'Local Folklore',
] as const;

// Story Bible Schemas
export const WorldLocationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  locationType: z.string().default('Urban / Interior'),
  description: z.string().default(''),
  architecture: z.string().default(''),
  environment: z.string().default(''),
  lightingCharacteristics: z.string().default('Natural daylight'),
  importantObjects: z.string().default(''),
  historicalContext: z.string().default(''),
  referenceImageUrl: z.string().optional(),
  continuityNotes: z.string().default(''),
  isDestroyed: z.boolean().default(false),
});
export type WorldLocation = z.infer<typeof WorldLocationSchema>;

export const WorldFactionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  factionType: z.string().default('Organization'),
  description: z.string().default(''),
  alignment: z.string().default('Neutral'),
  keyRulesOrGoals: z.string().default(''),
});
export type WorldFaction = z.infer<typeof WorldFactionSchema>;

export const StoryEventSchema = z.object({
  id: z.string(),
  episodeNumber: z.number().int().min(1).default(1),
  timelinePosition: z.number().int().min(1).default(1),
  eventType: z.enum(['plot', 'character', 'world_change', 'conflict', 'exception']).default('plot'),
  title: z.string().min(1),
  description: z.string().default(''),
  locationName: z.string().default(''),
  charactersInvolved: z.array(z.string()).default([]),
  isFlashbackOrException: z.boolean().default(false),
  exceptionReason: z.string().default(''),
});
export type StoryEvent = z.infer<typeof StoryEventSchema>;

export const StoryWorldSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  worldName: z.string().min(1),
  universePreset: z.string().default('Modern Fantasy'),
  worldDescription: z.string().default(''),
  genre: z.string().default('Fantasy'),
  historicalPeriod: z.string().default('Contemporary'),
  technologyLevel: z.string().default('Modern'),
  geography: z.string().default(''),
  climate: z.string().default('Tropical'),
  culture: z.string().default(''),
  society: z.string().default(''),
  politicalStructure: z.string().default(''),
  magicSystem: z.string().default(''),
  powerSystem: z.string().default(''),
  customSpeciesNote: z.string().default(''),
  worldRules: z.array(z.string()).default([]),
  locations: z.array(WorldLocationSchema).default([]),
  factions: z.array(WorldFactionSchema).default([]),
  timeline: z.array(StoryEventSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StoryWorld = z.infer<typeof StoryWorldSchema>;

export interface ContinuityWarning {
  id: string;
  severity: 'warning' | 'info';
  category: 'location' | 'character' | 'world_rule' | 'timeline';
  message: string;
  suggestion: string;
}

// Character Studio V2 Extensions
export const CharacterOutfitSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.string().default('Casual'),
  description: z.string().default(''),
  colors: z.string().default(''),
  accessories: z.string().default(''),
  footwear: z.string().default(''),
});
export type CharacterOutfit = z.infer<typeof CharacterOutfitSchema>;

export const CharacterVersionEntrySchema = z.object({
  versionNumber: z.number().int().min(1),
  label: z.string().default('Base Version'),
  ageRange: z.string().default('Young Adult'),
  outfitName: z.string().default('Primary Outfit'),
  hairStyle: z.string().default(''),
  equipment: z.string().default(''),
  physicalCondition: z.string().default('Healthy'),
  status: z.enum(['active', 'injured', 'deceased', 'missing']).default('active'),
  notes: z.string().default(''),
  createdAt: z.string(),
});
export type CharacterVersionEntry = z.infer<typeof CharacterVersionEntrySchema>;

// Panel Revision & Prompt Package V2
export const PanelRevisionSchema = z.object({
  revisionNumber: z.number().int().min(1),
  camera: z.string(),
  shotType: z.string().default('Medium Shot'),
  composition: z.string(),
  lighting: z.string(),
  dialogue: z.array(PanelDialogueLineSchema).default([]),
  imagePrompt: z.string(),
  negativePrompt: z.string(),
  engineUsed: z.enum(ENGINE_IDS),
  createdAt: z.string(),
});
export type PanelRevision = z.infer<typeof PanelRevisionSchema>;

export interface PromptQualityWarning {
  code: string;
  severity: 'warning' | 'error';
  message: string;
}

export const PromptPackageSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  projectTitle: z.string().default('Untitled'),
  scope: z.enum(['panel', 'scene', 'episode']).default('panel'),
  targetPlatform: z.enum(EXPORT_TARGETS).default('chatgpt'),
  engineUsed: z.enum(ENGINE_IDS).default('local'),
  mainImagePrompt: z.string(),
  characterIdentityBlocks: z.string(),
  characterReferenceInstructions: z.string(),
  sceneDescription: z.string(),
  cameraInstructions: z.string(),
  artStyleInstructions: z.string(),
  lightingInstructions: z.string(),
  environmentDescription: z.string(),
  dialogueReference: z.string(),
  negativePrompt: z.string(),
  continuityInstructions: z.string(),
  fullPackageText: z.string(),
  jsonExport: z.record(z.string(), z.unknown()),
  version: z.number().int().min(1).default(1),
  createdAt: z.string(),
});
export type PromptPackage = z.infer<typeof PromptPackageSchema>;

