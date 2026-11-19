import type {
  CharacterProfile,
  ExportTarget,
  StructuredPanel,
} from '@/types/comicforge';
import { getArtStylePromptBlock, getTargetPresetNote } from '@/lib/styles/art-styles';

/**
 * Builds the canonical Character Identity Block separating immutable identity
 * traits from mutable scene properties.
 */
export function getEffectiveSpecies(character: CharacterProfile): string {
  if (character.species === 'Custom Species' && character.customSpecies?.trim()) {
    return character.customSpecies.trim();
  }
  return character.species || 'Human';
}

export function buildSpeciesTraitsSummary(character: CharacterProfile): string[] {
  const st = character.speciesTraits;
  if (!st) return [];
  const entries: [string, string | undefined][] = [
    ['horns', st.horns],
    ['wings', st.wings],
    ['tail', st.tail],
    ['ears', st.ears],
    ['scales', st.scales],
    ['fur', st.fur],
    ['slime body', st.slimeBody],
    ['mechanical parts', st.mechanicalParts],
    ['custom anatomy', st.customAnatomy],
  ];
  return entries
    .filter(([, val]) => Boolean(val && val.trim()))
    .map(([label, val]) => `${label}: ${val!.trim()}`);
}

export function buildCanonicalIdentityBlock(character: CharacterProfile): string {
  const lock = character.identityLock;
  const parts: string[] = [];
  const speciesLabel = getEffectiveSpecies(character);

  if (lock.lockNameAndId) {
    const meta = [speciesLabel, character.ageRange, character.genderIdentity, character.nationality]
      .filter((v) => Boolean(v && v.trim()))
      .join(', ');
    parts.push(`[${character.characterCode}] ${character.name} (${meta})`);
  } else {
    parts.push(`${character.name} (${speciesLabel})`);
  }

  const immutableTraits: string[] = [];
  if (lock.lockFacialStructure) {
    immutableTraits.push(`${character.faceShape} face, ${character.eyeShape} eyes`);
  }
  if (lock.lockEyeColor) {
    immutableTraits.push(`${character.eyeColor} eye color`);
  }
  if (lock.lockSkinTone) {
    immutableTraits.push(`${character.skinTone} skin/surface tone`);
  }
  if (lock.lockHair && character.hairStyle && character.hairStyle !== 'None') {
    immutableTraits.push(`${character.hairStyle} (${character.hairColor})`);
  }
  if (lock.lockDistinguishingFeatures && character.distinguishingFeatures && character.distinguishingFeatures !== 'None') {
    immutableTraits.push(`distinguishing features: ${character.distinguishingFeatures}`);
  }
  const speciesTraits = buildSpeciesTraitsSummary(character);
  if (speciesTraits.length > 0) {
    immutableTraits.push(`species traits (${speciesTraits.join(', ')})`);
  }

  if (immutableTraits.length > 0) {
    parts.push(`Immutable Identity: ${immutableTraits.join(', ')}, ${character.height}, ${character.bodyBuild} build`);
  }

  const outfitParts: string[] = [];
  if (lock.lockSignatureOutfit && character.primaryOutfit) {
    outfitParts.push(`outfit: ${character.primaryOutfit}${character.outfitColors ? ` (${character.outfitColors})` : ''}`);
  }
  if (lock.lockAccessories && character.accessories) {
    outfitParts.push(`accessories: ${character.accessories}`);
  }
  if (character.signatureItem?.trim()) {
    outfitParts.push(`signature item: ${character.signatureItem.trim()}`);
  }
  if (character.footwear) {
    outfitParts.push(`footwear: ${character.footwear}`);
  }
  if (outfitParts.length > 0) {
    parts.push(`Signature Attire: ${outfitParts.join('; ')}`);
  }

  if (lock.lockArtStyle) {
    const styleName =
      character.visualStyle === 'Custom' && character.customVisualStyle
        ? character.customVisualStyle
        : character.visualStyle;
    parts.push(`Character Style Anchor: ${styleName}`);
  }

  return parts.join(' | ');
}

/**
 * Generates a complete Character Reference Sheet Prompt for ChatGPT Images or Gemini.
 */
export function buildCharacterReferencePrompt(
  character: CharacterProfile,
  exportTarget: ExportTarget = 'chatgpt'
): string {
  const canonical = buildCanonicalIdentityBlock(character);
  const speciesLabel = getEffectiveSpecies(character);
  const speciesTraits = buildSpeciesTraitsSummary(character);
  const styleLabel =
    character.visualStyle === 'Custom' && character.customVisualStyle
      ? character.customVisualStyle
      : character.visualStyle;
  const expr =
    character.defaultExpression === 'Custom Expression' && character.customExpression
      ? character.customExpression
      : character.defaultExpression;

  return [
    `CHARACTER REFERENCE SHEET — ${character.name.toUpperCase()} (${character.characterCode})`,
    `SPECIES: ${speciesLabel}${speciesTraits.length > 0 ? ` | SPECIES FEATURES: ${speciesTraits.join(', ')}` : ''}`,
    `TARGET MODEL PRESET: ${exportTarget === 'chatgpt' ? 'ChatGPT Images' : 'Google Gemini Image Generation'}`,
    `NOTE: ${getTargetPresetNote(exportTarget)}`,
    '',
    'CANONICAL IDENTITY BLOCK (IMMUTABLE TRAITS):',
    canonical,
    '',
    'MUTABLE ATTRIBUTES (CAN VARY PER SCENE):',
    `Pose (${character.defaultPose || 'Standing'}), facial expression (default: ${expr}), lighting, scene environment, and alternate/temporary outfits.`,
    '',
    'SHEET LAYOUT REQUIREMENTS:',
    '- Clean neutral studio background (#F3F4F6 or soft light gray) with crisp layout spacing.',
    '- Include 4 full-character views side-by-side: (1) Front view, (2) Three-quarter view, (3) Side profile view, (4) Full-body standing pose.',
    '- Include a row of 4 facial expression headshots at the bottom: Neutral, Happy, Angry, Shocked (plus default expression: ' + expr + ').',
    '- Maintain consistent clothing, outfit colors, accessories, species anatomy, and proportions across all views (note: external AI models may still vary details slightly).',
    '- Clear, readable, model-sheet quality with no overlapping limbs or text clutter.',
    '',
    'IMAGE PROMPT:',
    `Professional ${styleLabel} character reference sheet of ${character.name}, a ${speciesLabel} (${character.role}). ${canonical}. Multiple views on one clean sheet: front view, three-quarter view, side profile view, and full-body view showing footwear (${character.footwear || 'matching footwear'}), plus 4 facial expression insets (neutral, happy, angry, shocked). Crisp linework, flat even studio lighting, accurate proportions, consistent outfit and accessories across every pose.`,
    '',
    'NEGATIVE PROMPT:',
    'inconsistent face or anatomy between views, changing outfit, extra limbs, extra fingers, cropped head, cluttered background, watermark, blurry text, photorealistic distortion',
  ].join('\n');
}

/**
 * Formats a StructuredPanel into Format A (Human-Readable Prompt).
 */
export function formatPanelHumanReadable(
  panel: StructuredPanel,
  projectTitle: string,
  characters: CharacterProfile[],
  exportTarget: ExportTarget = 'chatgpt',
  customArtStyle?: string
): string {
  const charMap = new Map(characters.map((c) => [c.characterCode, c]));
  const charById = new Map(characters.map((c) => [c.id, c]));

  const charBlocks =
    panel.characters.length > 0
      ? panel.characters.map((pc) => {
          const found = charMap.get(pc.character_id) || charById.get(pc.character_id);
          if (found) {
            return `- ${buildCanonicalIdentityBlock(found)}`;
          }
          return `- [${pc.character_id}] ${pc.name}`;
        })
      : ['- Environmental / narrative establishing panel (no primary character focus)'];

  const actionsText =
    panel.characters.length > 0
      ? panel.characters.map((c) => `${c.name}: ${c.action}`).join('; ')
      : 'Establish setting and atmosphere';

  const expressionsText =
    panel.characters.length > 0
      ? panel.characters.map((c) => `${c.name}: ${c.expression}`).join('; ')
      : 'N/A';

  const dialogueText =
    panel.dialogue.length > 0
      ? panel.dialogue.map((d) => `${d.speaker}: "${d.text}"`).join('\n')
      : panel.narration
        ? `[Narration]: ${panel.narration}`
        : 'Silent visual beat (no dialogue)';

  const styleBlock = getArtStylePromptBlock(panel.art_style, customArtStyle);

  return [
    `COMIC PROJECT: ${projectTitle}`,
    `EPISODE: ${panel.episode_number}`,
    `SCENE: ${panel.scene_number}`,
    `PANEL: ${panel.panel_number}`,
    `ASPECT RATIO: ${panel.aspect_ratio}`,
    `TARGET PRESET: ${exportTarget === 'chatgpt' ? 'ChatGPT Images' : 'Google Gemini'}`,
    '',
    `ART STYLE: ${panel.art_style}`,
    styleBlock,
    '',
    'CHARACTERS (CANONICAL IDENTITY BLOCKS):',
    ...charBlocks,
    '',
    'SCENE DESCRIPTION:',
    panel.scene_context || panel.environment,
    '',
    'ACTION:',
    actionsText,
    '',
    'FACIAL EXPRESSION:',
    expressionsText,
    '',
    'CAMERA:',
    panel.camera,
    '',
    'ENVIRONMENT:',
    panel.environment,
    '',
    'LIGHTING:',
    panel.lighting,
    '',
    'COMPOSITION:',
    panel.composition,
    '',
    'CONTINUITY:',
    panel.continuity_notes.length > 0 ? panel.continuity_notes.join(' | ') : 'Preserve established character appearance and scene lighting.',
    '',
    'DIALOGUE REFERENCE (For comic lettering / context):',
    dialogueText,
    '',
    'IMAGE PROMPT:',
    panel.image_prompt,
    '',
    'NEGATIVE PROMPT:',
    panel.negative_prompt,
  ].join('\n');
}
