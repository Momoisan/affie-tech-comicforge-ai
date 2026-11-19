# 03 — Character Data Model & Compatibility

**Branch:** `feature/phase-2a-character-studio`

## Additive Schema Extensions (`src/types/comicforge.ts`)

All new Phase 2A fields on `CharacterProfileSchema` are strictly `.optional()`:
- `signatureItem?: string`
- `motivations?: string`, `strengths?: string`, `weaknesses?: string`, `relationships?: string`, `speakingStyle?: string`
- `speciesTraits?: { horns?, wings?, tail?, ears?, scales?, fur?, slimeBody?, mechanicalParts?, customAnatomy? }`

## Categorized Species (`SPECIES_CATEGORIES`)
- **Human:** `Human`, `Modern Human`, `Historical Human`
- **Fantasy / Isekai:** `Elf`, `Dark Elf`, `Half-Elf`, `Dwarf`, `Goblin`, `Orc`, `Beastfolk`, `Fairy`
- **Supernatural:** `Vampire`, `Werewolf`, `Demon`, `Angel`, `Spirit`, `Undead`
- **Other:** `Slime`, `Dragonkin`, `Android`, `Robot`, `Alien`, `Custom Species`

## Backward Compatibility
- Existing V1 and V2 `localStorage` (`comicforge_v1_characters`) and Supabase records parse cleanly with `CharacterProfileSchema.safeParse`.
- Existing `id`, `characterCode`, `versions`, `outfits`, `referenceImageUrl`, and project `assignedCharacterIds` are preserved without mutation.
- No destructive database migrations were introduced.
