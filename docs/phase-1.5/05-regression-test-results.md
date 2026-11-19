# 05 — Regression Test Results (Phase 1.5)

**Project:** AFFIE TECH ComicForge AI  
**Branch:** `phase-1.5/verification-and-hardening`

## Static, Unit & Real-Browser Verification

| Check | Command / Tool | Result | Status |
| :--- | :--- | :--- | :--- |
| ESLint | `npm run lint` | `0 errors, 0 warnings` | **PASSED** |
| TypeScript | `npm run typecheck` | Exit code `0` | **PASSED** |
| Unit & Regression Suite | `npm run test` (`vitest run`) | **4 files, 22/22 tests passed** | **PASSED** |
| Production Build | `npm run build` (`next build`) | Exit code `0`, 17 routes compiled | **PASSED** |
| Playwright Viewport Matrix | Chromium `320–1440px` × 11 routes (77 loads) | `0` overflow, `0` console/page errors, `0` "Story Bible" hits | **PASSED** |
| Playwright E2E Workflows | Character + Version + Creator + Projects + Focus Trap + Esc | All workflow assertions `true` | **PASSED** |
| Local Engine API | `POST /api/generate` (`engineMode: "local"`) | `HTTP 200`, valid `StoryOutline` | **PASSED** |
| Live Gemini API | External Gemini API | No `GEMINI_API_KEY` in VM | **BLOCKED** |
| Live Supabase Auth / DB | External Supabase Cloud | No Supabase credentials in VM | **BLOCKED** |
| Lighthouse CLI Audit | `lighthouse` | CLI not installed in VM | **BLOCKED** |
