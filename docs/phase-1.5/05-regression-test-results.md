# 05 — Regression Test Results (Phase 1.5)

**Project:** AFFIE TECH ComicForge AI  
**Branch:** `phase-1.5/verification-and-hardening`

## Static & Automated Test Execution

| Check | Command | Result | Status |
| :--- | :--- | :--- | :--- |
| ESLint | `npm run lint` | `0 errors, 0 warnings` | **VERIFIED** |
| TypeScript | `npm run typecheck` (`tsc --noEmit`) | Exit code `0` | **VERIFIED** |
| Unit & Regression Suite | `npm run test` (`vitest run`) | **4 test files, 22/22 tests passed** (`1.21s`) | **VERIFIED** |
| Production Build | `npm run build` (`next build`) | Exit code `0`, 17 routes compiled | **VERIFIED** |
| Live Local Production Routes | `curl` against `next start -p 3000` | All 12 routes returned `HTTP 200` | **VERIFIED** |
| Local Engine API (`/api/generate`) | `POST /api/generate` (`engineMode: "local"`) | `HTTP 200`, `{"ok":true,"engineUsed":"local"}` | **VERIFIED** |
| Live Gemini API | External Gemini API call | No `GEMINI_API_KEY` in VM | **BLOCKED** |
| Live Supabase Cloud Auth / DB | External Supabase call | No Supabase credentials in VM | **BLOCKED** |
| Browser Viewport Matrix (`320px–1440px`) | Playwright / Browser E2E | `playwright` package not installed in repo | **NOT TESTED** |

## Test Suites Breakdown (`vitest run`)

1. `src/app/api/__tests__/api-routes.test.ts` — 4 passed
2. `src/lib/ai/__tests__/comicforge.test.ts` — 7 passed
3. `src/lib/v2/__tests__/v2-features.test.ts` — 6 passed
4. `src/lib/v2/__tests__/phase15-regression.test.ts` — 5 passed (malformed JSON recovery, `QuotaExceededError` handling, `Story Universe Studio` terminology, prompt output hygiene, project/character relationship integrity)
