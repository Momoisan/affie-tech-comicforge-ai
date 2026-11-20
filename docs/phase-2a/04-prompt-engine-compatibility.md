# 04 — Prompt Engine Compatibility

**Branch:** `feature/phase-2a-character-studio`

## Serialization Updates

1. **`buildCanonicalIdentityBlock` (`src/lib/ai/prompt-formatter.ts`):**
   - Serializes effective species (`getEffectiveSpecies`), conditional non-human `speciesTraits` (`buildSpeciesTraitsSummary`), `signatureItem`, immutable physical traits, and visual style anchor.
2. **`buildCharacterReferencePrompt` (`src/lib/ai/prompt-formatter.ts`):**
   - Includes `SPECIES`, `SPECIES FEATURES`, `CANONICAL IDENTITY BLOCK (IMMUTABLE TRAITS)`, and `MUTABLE ATTRIBUTES (CAN VARY PER SCENE)`.
   - Explicitly notes that external AI image models do not guarantee 100% identical reproduction.
3. **`buildCharacterContinuityPrompt` (`src/lib/v2/prompt-package.ts`):**
   - Includes `SPECIES / ORIGIN`, `SPECIES-SPECIFIC FEATURES`, `VISUAL STYLE ANCHOR`, `CANONICAL IDENTITY (IMMUTABLE)`, `ACTIVE VERSION`, and `MUTABLE ATTRIBUTES (PERMITTED SCENE CHANGES ONLY)`.
4. **Local Prompt Engine & Gemini Workflow:**
   - Verified via `phase2a-character-studio.test.ts` that `generateWithLocalEngine` automatically propagates `species`, `speciesTraits`, and `signatureItem` into panel `image_prompt` outputs without breaking any existing export formats.
