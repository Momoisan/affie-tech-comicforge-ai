import type {
  CharacterProfile,
  ContinuityWarning,
  StoryWorld,
  StructuredPanel,
} from '@/types/comicforge';

/**
 * Deterministic Story Bible continuity validator.
 * Surfaces warnings rather than silently rewriting user stories.
 * Honors intentional exceptions (flashbacks, alternate universes, time travel).
 */
export function validateWorldContinuity(
  world: StoryWorld,
  characters: CharacterProfile[]
): ContinuityWarning[] {
  const warnings: ContinuityWarning[] = [];
  const destroyedLocations = new Set(
    world.locations.filter((l) => l.isDestroyed).map((l) => l.name.toLowerCase())
  );

  // 1. Check destroyed locations appearing in non-exception events
  for (const ev of world.timeline) {
    if (ev.isFlashbackOrException) continue;
    const locLower = ev.locationName.trim().toLowerCase();
    if (locLower && destroyedLocations.has(locLower)) {
      warnings.push({
        id: `warn_loc_${ev.id}`,
        severity: 'warning',
        category: 'location',
        message: `Event "${ev.title}" (Ep ${ev.episodeNumber}) uses destroyed location "${ev.locationName}".`,
        suggestion: 'Mark event as a flashback/exception or update the location status.',
      });
    }
  }

  // 2. Check character simultaneous distant locations at same timelinePosition
  const slotMap = new Map<string, { location: string; eventTitle: string }>();
  for (const ev of world.timeline) {
    if (ev.isFlashbackOrException || !ev.locationName.trim()) continue;
    for (const charName of ev.charactersInvolved) {
      const key = `${charName.toLowerCase()}::ep${ev.episodeNumber}::pos${ev.timelinePosition}`;
      const existing = slotMap.get(key);
      if (existing && existing.location.toLowerCase() !== ev.locationName.trim().toLowerCase()) {
        warnings.push({
          id: `warn_sim_${ev.id}_${charName}`,
          severity: 'warning',
          category: 'character',
          message: `${charName} appears in "${existing.location}" and "${ev.locationName}" at Ep ${ev.episodeNumber} Position ${ev.timelinePosition}.`,
          suggestion: 'Adjust timeline position or mark one event as an alternate timeline/flashback.',
        });
      } else {
        slotMap.set(key, { location: ev.locationName.trim(), eventTitle: ev.title });
      }
    }
  }

  // 3. Check deceased characters appearing in non-exception events
  const deceasedNames = new Set(
    characters
      .filter((c) => c.versions?.some((v) => v.status === 'deceased'))
      .map((c) => c.name.toLowerCase())
  );
  for (const ev of world.timeline) {
    if (ev.isFlashbackOrException) continue;
    for (const charName of ev.charactersInvolved) {
      if (deceasedNames.has(charName.toLowerCase())) {
        warnings.push({
          id: `warn_dec_${ev.id}_${charName}`,
          severity: 'warning',
          category: 'timeline',
          message: `Character "${charName}" has a deceased version status but appears in "${ev.title}".`,
          suggestion: 'Mark as flashback/resurrection exception or update character version status.',
        });
      }
    }
  }

  // 4. World rules reminder if empty
  if (world.worldRules.length === 0) {
    warnings.push({
      id: 'info_rules_empty',
      severity: 'info',
      category: 'world_rule',
      message: 'No immutable World Rules defined yet.',
      suggestion: 'Add at least 1 world rule (e.g. magic cost or tech limit) to guide prompt generation.',
    });
  }

  return warnings;
}

export function validateCharacterConsistency(
  character: CharacterProfile,
  selectedVersionNumber?: number
): ContinuityWarning[] {
  const warnings: ContinuityWarning[] = [];
  if (!character.primaryOutfit.trim()) {
    warnings.push({
      id: `char_outfit_${character.id}`,
      severity: 'warning',
      category: 'character',
      message: `${character.name} has no Primary Outfit specified.`,
      suggestion: 'Add an outfit description or select one from the Outfit Library for visual consistency.',
    });
  }
  if (selectedVersionNumber && character.versions?.length) {
    const ver = character.versions.find((v) => v.versionNumber === selectedVersionNumber);
    if (ver && ver.status === 'deceased') {
      warnings.push({
        id: `char_ver_dec_${character.id}`,
        severity: 'warning',
        category: 'character',
        message: `${character.name} (v${ver.versionNumber}: ${ver.label}) is marked deceased.`,
        suggestion: 'Ensure this scene is a flashback or switch to an active character version.',
      });
    }
  }
  return warnings;
}

export function validatePanelContinuity(
  panel: StructuredPanel,
  prevPanel?: StructuredPanel,
  nextPanel?: StructuredPanel,
  world?: StoryWorld
): ContinuityWarning[] {
  const warnings: ContinuityWarning[] = [];

  if (
    panel.shot_type === 'Extreme Close-Up' &&
    (panel.camera === "Bird's Eye View" || panel.camera === 'First-Person POV')
  ) {
    warnings.push({
      id: `panel_cam_${panel.panel_number}`,
      severity: 'warning',
      category: 'timeline',
      message: `Panel ${panel.panel_number} combines "${panel.shot_type}" with "${panel.camera}", which may conflict in image generators.`,
      suggestion: 'Use Eye Level or Close-Up for clear facial framing.',
    });
  }

  if (prevPanel && prevPanel.environment !== panel.environment && !panel.continuity_notes.length) {
    warnings.push({
      id: `panel_loc_jump_${panel.panel_number}`,
      severity: 'info',
      category: 'location',
      message: `Panel ${panel.panel_number} changes location from "${prevPanel.environment}" to "${panel.environment}".`,
      suggestion: 'Add a transition note in Continuity Notes if this is an intentional cut.',
    });
  }

  if (nextPanel && nextPanel.characters.length > 0 && panel.characters.length === 0) {
    warnings.push({
      id: `panel_char_intro_${panel.panel_number}`,
      severity: 'info',
      category: 'character',
      message: `Panel ${panel.panel_number} has no characters before Panel ${nextPanel.panel_number}.`,
      suggestion: 'Confirm this is an intentional establishing/cutaway shot.',
    });
  }

  if (world) {
    const destroyed = world.locations.find(
      (l) => l.isDestroyed && l.name.toLowerCase() === panel.environment.toLowerCase()
    );
    if (destroyed) {
      warnings.push({
        id: `panel_destroyed_${panel.panel_number}`,
        severity: 'warning',
        category: 'location',
        message: `Panel ${panel.panel_number} uses destroyed location "${destroyed.name}".`,
        suggestion: 'Update environment or mark as flashback in Continuity Notes.',
      });
    }
  }

  return warnings;
}
