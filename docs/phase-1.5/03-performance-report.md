# 03 — Performance Report (Phase 1.5)

**Project:** AFFIE TECH ComicForge AI  
**Branch:** `phase-1.5/verification-and-hardening`

## Measured Build & Bundle Metrics

- **Production Static Bundle (`du -sh .next/static`):** `1.6M` total across all routes/chunks.
- **Largest Client Chunks (`.next/static/chunks/`):** `264K`, `224K`, `161K`, `120K`, `110K`.
- **Production Build Time (`next build`):** Turbopack compile `3.4s`, TypeScript check `3.5s`, static page generation (17/17 routes) `520ms`.

## Real-Browser Chromium Navigation Timing (`/`)

Measured against local `next start -p 3001` via Playwright + Chromium:

| Viewport | DOMContentLoaded | Load | First Contentful Paint (FCP) |
| :--- | :--- | :--- | :--- |
| Desktop (`1440×900`) | `40ms` | `71ms` | `372ms` |
| Mobile (`375×812`) | `38ms` | `80ms` | `172ms` |

## Performance Improvements Applied

1. **Memoized Context Provider Value (FIXED):** `ComicForgeProvider` wraps `contextValue` in `useMemo` to prevent unnecessary consumer re-renders.
2. **Font Loading (VERIFIED):** `Space_Grotesk`, `Plus_Jakarta_Sans`, and `JetBrains_Mono` use `display: 'swap'`.
3. **Image Lazy Loading (VERIFIED):** Character thumbnails use `loading="lazy"`.
4. **Reduced Motion (VERIFIED):** `@media (prefers-reduced-motion: reduce)` disables marquee, pop-in, and hover transitions.

## Lighthouse Audit

- **Lighthouse Mobile & Desktop CLI Audits:** **BLOCKED** (`lighthouse` CLI is not installed in the VM). Real-browser Chromium navigation/paint timings above were recorded instead.
