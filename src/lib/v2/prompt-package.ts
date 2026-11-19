import type {
  CharacterProfile,
  ComicProject,
  EngineId,
  ExportTarget,
  PromptPackage,
  PromptQualityWarning,
  StoryWorld,
  StructuredPanel,
} from '@/types/comicforge';
import { buildCanonicalIdentityBlock } from '@/lib/ai/prompt-formatter';
import { getArtStylePromptBlock, getTargetPresetNote } from '@/lib/styles/art-styles';
import { generateId } from '@/lib/utils';

export function buildCharacterContinuityPrompt(
  character: CharacterProfile,
  versionNumber?: number
): string {
  const canonical = buildCanonicalIdentityBlock(character);
  const activeVer = character.versions?.find((v) => v.versionNumber === versionNumber);
  const speciesText =
    character.species === 'Custom Species' && character.customSpecies
      ? character.customSpecies
      : character.species || 'Human';

  return [
    `CHARACTER CONTINUITY INSTRUCTION — ${character.name.toUpperCase()} (${character.characterCode})`,
    `SPECIES / ORIGIN: ${speciesText} · ${character.nationality}`,
    `CANONICAL IDENTITY (IMMUTABLE): ${canonical}`,
    activeVer
      ? `ACTIVE VERSION: v${activeVer.versionNumber} (${activeVer.label}) — Age: ${activeVer.ageRange}, Outfit: ${activeVer.outfitName}, Hair: ${activeVer.hairStyle || character.hairStyle}, Equipment: ${activeVer.equipment || 'Standard'}, Condition: ${activeVer.physicalCondition}, Status: ${activeVer.status}.`
      : `ACTIVE VERSION: v${character.version} — Outfit: ${character.primaryOutfit || 'Signature attire'}`,
    `POSE / EXPRESSION DEFAULT: ${character.defaultPose || 'Standing'} · ${character.defaultExpression}`,
    `REFERENCE USAGE: Attach this character's reference image in ChatGPT Images or Google Gemini where supported. Note: External AI memory and exact face reproduction depend on the external provider and are not guaranteed.`,
    `PERMITTED SCENE CHANGES ONLY: Facial expression, camera angle, lighting, pose, and environment.`,
  ].join('\n');
}

export function validatePromptPackage(pkg: PromptPackage): PromptQualityWarning[] {
  const warnings: PromptQualityWarning[] = [];

  if (!pkg.characterIdentityBlocks.trim() || pkg.characterIdentityBlocks.includes('No primary')) {
    warnings.push({
      code: 'MISSING_CHARACTER_IDENTITY',
      severity: 'warning',
      message: 'No locked Character Identity Block detected. Characters may drift across panels.',
    });
  }

  if (!pkg.artStyleInstructions.trim()) {
    warnings.push({
      code: 'MISSING_VISUAL_STYLE',
      severity: 'error',
      message: 'Art Style instructions are missing.',
    });
  }

  if (
    pkg.cameraInstructions.includes('Extreme Close-Up') &&
    pkg.cameraInstructions.includes("Bird's Eye View")
  ) {
    warnings.push({
      code: 'CONTRADICTORY_CAMERA',
      severity: 'error',
      message: 'Contradictory camera instructions: Extreme Close-Up + Bird’s Eye View.',
    });
  }

  if (!pkg.sceneDescription.trim()) {
    warnings.push({
      code: 'MISSING_SCENE_CONTEXT',
      severity: 'warning',
      message: 'Scene description is empty.',
    });
  }

  if (!pkg.continuityInstructions.trim()) {
    warnings.push({
      code: 'MISSING_CONTINUITY',
      severity: 'warning',
      message: 'Continuity instructions are empty.',
    });
  }

  // Detect excessive word repetition in main prompt
  const words = pkg.mainImagePrompt.toLowerCase().split(/\s+/).filter((w) => w.length > 5);
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  for (const [word, count] of freq.entries()) {
    if (count >= 6) {
      warnings.push({
        code: 'EXCESSIVE_REPETITION',
        severity: 'warning',
        message: `Word "${word}" repeats ${count} times in the main prompt; consider trimming.`,
      });
      break;
    }
  }

  return warnings;
}

export function buildPromptPackage({
  project,
  panel,
  characters,
  world,
  targetPlatform,
  engineUsed,
  version = 1,
}: {
  project: ComicProject;
  panel: StructuredPanel;
  characters: CharacterProfile[];
  world?: StoryWorld;
  targetPlatform: ExportTarget;
  engineUsed: EngineId;
  version?: number;
}): PromptPackage {
  const effectiveStyle = panel.art_style_override || panel.art_style || project.artStyle;
  const artStyleInstructions = getArtStylePromptBlock(effectiveStyle, project.customArtStyle);

  const matchedChars = characters.filter((c) =>
    panel.characters.some((pc) => pc.character_id === c.characterCode || pc.name === c.name)
  );
  const charsToUse = matchedChars.length > 0 ? matchedChars : characters;

  const characterIdentityBlocks =
    charsToUse.length > 0
      ? charsToUse.map((c) => `- ${buildCanonicalIdentityBlock(c)}`).join('\n')
      : 'No primary character assigned (environmental shot).';

  const characterReferenceInstructions =
    charsToUse.length > 0
      ? charsToUse
          .map(
            (c) =>
              `Attach reference image for ${c.name} (${c.characterCode}) if supported by ${
                targetPlatform === 'chatgpt' ? 'ChatGPT Images' : 'Google Gemini'
              }.`
          )
          .join(' ') + ' Note: External tools do not guarantee 100% identical reproduction.'
      : 'No character reference attachment required.';

  const cameraInstructions = `${panel.shot_type || 'Medium Shot'} · ${panel.camera} · ${panel.composition}`;
  const dialogueReference =
    panel.dialogue.length > 0
      ? panel.dialogue.map((d) => `${d.speaker}: "${d.text}"`).join('\n')
      : panel.narration || 'Silent visual panel.';

  const worldRuleNotes =
    world && world.worldRules.length > 0
      ? `World Rules (${world.worldName}): ${world.worldRules.join('; ')}`
      : '';

  const continuityInstructions = [
    ...panel.continuity_notes,
    ...(worldRuleNotes ? [worldRuleNotes] : []),
  ].join(' | ');

  const presetNote = getTargetPresetNote(targetPlatform);

  const fullPackageText = [
    `=== AFFIE TECH COMICFORGE AI — PROMPT PACKAGE (${targetPlatform.toUpperCase()}) ===`,
    `PROJECT: ${project.title} | EP ${panel.episode_number} · SC ${panel.scene_number} · PANEL ${panel.panel_number}`,
    `PRESET GUIDANCE: ${presetNote}`,
    '',
    '1. MAIN IMAGE PROMPT:',
    panel.image_prompt,
    '',
    '2. CHARACTER IDENTITY BLOCKS:',
    characterIdentityBlocks,
    '',
    '3. CHARACTER REFERENCE INSTRUCTIONS:',
    characterReferenceInstructions,
    '',
    '4. SCENE DESCRIPTION:',
    panel.scene_context || panel.environment,
    '',
    '5. CAMERA INSTRUCTIONS:',
    cameraInstructions,
    '',
    '6. ART STYLE INSTRUCTIONS:',
    artStyleInstructions,
    '',
    '7. LIGHTING INSTRUCTIONS:',
    panel.lighting,
    '',
    '8. ENVIRONMENT DESCRIPTION:',
    panel.environment,
    '',
    '9. DIALOGUE REFERENCE (Keep outside image artwork unless requested):',
    dialogueReference,
    '',
    '10. NEGATIVE PROMPT:',
    panel.negative_prompt,
    '',
    '11. CONTINUITY INSTRUCTIONS:',
    continuityInstructions || 'Preserve established character and location continuity.',
  ].join('\n');

  const jsonExport: Record<string, unknown> = {
    project_id: project.id,
    project_title: project.title,
    target_platform: targetPlatform,
    engine_used: engineUsed,
    episode_number: panel.episode_number,
    scene_number: panel.scene_number,
    panel_number: panel.panel_number,
    stable_panel_id: panel.stable_panel_id || `p_${panel.episode_number}_${panel.scene_number}_${panel.panel_number}`,
    art_style: effectiveStyle,
    aspect_ratio: panel.aspect_ratio,
    camera: cameraInstructions,
    lighting: panel.lighting,
    environment: panel.environment,
    characters: panel.characters,
    dialogue: panel.dialogue,
    sound_effects: panel.sound_effects || '',
    image_prompt: panel.image_prompt,
    negative_prompt: panel.negative_prompt,
    continuity_instructions: continuityInstructions,
  };

  return {
    id: generateId('pkg'),
    projectId: project.id,
    projectTitle: project.title,
    scope: 'panel',
    targetPlatform,
    engineUsed,
    mainImagePrompt: panel.image_prompt,
    characterIdentityBlocks,
    characterReferenceInstructions,
    sceneDescription: panel.scene_context || panel.environment,
    cameraInstructions,
    artStyleInstructions,
    lightingInstructions: panel.lighting,
    environmentDescription: panel.environment,
    dialogueReference,
    negativePrompt: panel.negative_prompt,
    continuityInstructions,
    fullPackageText,
    jsonExport,
    version,
    createdAt: new Date().toISOString(),
  };
}
