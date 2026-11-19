# 07 — Phase 2 Readiness (Phase 1.5)

**Project:** AFFIE TECH ComicForge AI  
**Branch:** `phase-1.5/verification-and-hardening`

## Readiness Assessment

**Recommendation:** **READY FOR REVIEW & MERGE TO `main`**, with two explicit external verification items deferred to the user's Vercel/Supabase environment:

1. **Blocked in VM (Requires Production Env Vars):**
   - Live Google Gemini API generation (`GEMINI_API_KEY` in Vercel).
   - Live Supabase Auth & Cloud DB sync (`NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel + `0001_initial_schema.sql` & `0002_v2_upgrade.sql` executed in Supabase).
2. **Deferred / Not Tested in VM:**
   - Automated Playwright viewport matrix (`320px–1440px`) and Lighthouse profiling (no Playwright package in `devDependencies`; can be added in Phase 2 if desired).

## Risks & Rollback Procedure

- **Low Risk:** All Phase 1.5 changes are isolated on branch `phase-1.5/verification-and-hardening`; `main` (`5459495`) and production (`https://affie-tech-comicforge-ai.vercel.app/`) remain untouched.
- **Storage Backward Compatibility:** Zero changes to `localStorage` keys or JSON schemas. Existing user projects, characters, worlds, and prompt packages remain 100% compatible.
- **Rollback:** To discard Phase 1.5 changes before merge, switch back to `main` (`git checkout main`). If merged to `main` and rollback is needed, run `git revert <merge-commit>` without force-pushing.
