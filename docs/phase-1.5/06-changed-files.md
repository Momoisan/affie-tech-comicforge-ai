# 06 — Changed Files (Phase 1.5)

**Branch:** `phase-1.5/verification-and-hardening`  
**Base Commit (`main`):** `5459495`

| File | Change Summary |
| :--- | :--- |
| `src/components/providers/comicforge-provider.tsx` | Added `safeReadStorage` type/array guards, `safeWriteStorage` with `QuotaExceededError` toast warning, and `useMemo` on context value. |
| `src/components/ui/primitives.tsx` | Added `Tab`/`Shift+Tab` focus trap, `aria-labelledby`, and focus restoration to `ConfirmDialog`. |
| `src/components/layout/app-shell.tsx` | Added focus trap, `aria-modal="true"`, focus restoration on mobile drawer, `aria-hidden={mobileOpen}` on main content, and `/story-universe` active link matching. |
| `src/app/projects/page.tsx` | Added accessible `aria-label` and `title` to icon-only Delete button. |
| `src/lib/i18n/translations.ts` | Standardized navigation label to `Story Universe Studio` in both `ms-MY` and `en`. |
| `src/app/story-bible/page.tsx` | Updated badge, heading, save button, and toast notifications to `Story Universe Studio`. |
| `src/app/story-universe/page.tsx` | Added `/story-universe` route alias re-exporting `@/app/story-bible/page` (preserving `/story-bible` backward compatibility). |
| `src/app/creator/page.tsx` | Updated section heading and dropdown label to `Story Universe Studio` / `Story Universe`. |
| `src/lib/ai/local-engine.ts` | Updated fallback world-rules label in generated prompts to `Story Universe Studio`. |
| `src/lib/ai/gemini-engine.ts` | Updated system prompt world-rules label to `Story Universe Studio`. |
| `src/lib/v2/__tests__/phase15-regression.test.ts` | Added 5 regression tests for storage recovery, quota handling, terminology, and data relationships. |
| `docs/phase-1.5/01-audit-report.md` – `07-phase-2-readiness.md` | Phase 1.5 verification, performance, data integrity, and readiness deliverables. |
