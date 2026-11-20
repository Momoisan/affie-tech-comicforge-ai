# 02 — UI/UX Implementation (Visual Character Studio 2.0)

**Branch:** `feature/phase-2a-character-studio`

## Before / After UI Architecture

- **Desktop Layout (3-Column Hybrid Premium):**
  - **Left (`xl:col-span-3`):** **Character Library** with search, species filter, Character ID (`JetBrains Mono`), Species, Story Role, Visual Style, lazy-loaded Reference Thumbnail, Last Updated, Edit, Duplicate, Archive, Delete, and Version badge.
  - **Center (`xl:col-span-6`):** **7-Step Visual Character Builder** (`1. Identity`, `2. Species`, `3. Appearance`, `4. Outfit`, `5. Personality`, `6. Visual Style`, `7. Review & Lock`).
  - **Right (`xl:col-span-3`):** **Live Character Profile Preview** showing Character ID, Immutable Identity block, Mutable Attributes summary, Reference thumbnail / clean placeholder, and 1-click Copy Continuity Prompt.
- **Mobile Layout (`320px–430px`):**
  - Adapts into single-column layout with `min-h-[44px]` touch targets, zero horizontal overflow, and a sticky mobile bottom action bar (`Previous`, `Next`, `Save Character`).
- **Controlled Identity Revision:** Editing immutable identity fields (`characterCode`, `species`, `faceShape`, `distinguishingFeatures`) on an existing character triggers a confirmation dialog before saving.
