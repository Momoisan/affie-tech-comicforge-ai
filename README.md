# AFFIE TECH ComicForge AI V1.0

**Create Stories. Design Characters. Generate Comic Prompts.**

AFFIE TECH ComicForge AI is a dedicated AI comic story, character studio, and structured image-prompt creation platform built with Next.js App Router, TypeScript (strict mode), Tailwind CSS, Supabase PostgreSQL + RLS, and a dual AI prompt engine (Google Gemini API + deterministic Local Prompt Engine).

> **Important Product Rule:** ComicForge AI does **not** generate images internally. Users copy generated Format A (human-readable) or Format B (structured JSON) prompts into external tools such as **ChatGPT Images** or **Google Gemini** to generate comic illustrations.

---

## 1. Local Installation

```bash
git clone https://github.com/Momoisan/affie-tech-comicforge-ai.git
cd affie-tech-comicforge-ai
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

---

## 2. Environment Variables

Copy `.env.example` to `.env.local` (never commit `.env` or `.env.local`):

| Variable | Scope | Description |
|---|---|---|
| `GEMINI_API_KEY` | Server-only | Google Gemini API key (optional — Local Engine works without it) |
| `GEMINI_MODEL` | Server-only | Gemini text model ID (default: `gemini-2.5-flash`) |
| `AI_PRIMARY_ENGINE` | Server-only | `gemini` or `local` |
| `ENABLE_LOCAL_FALLBACK` | Server-only | `true` to fall back to Local Engine in `auto` mode |
| `NEXT_PUBLIC_SUPABASE_URL` | Client/Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client/Server | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Supabase service role key (never use `NEXT_PUBLIC_*`) |

---

## 3. Supabase Configuration & Database Migration

A separate Supabase project is recommended for ComicForge AI.

1. Create a new Supabase project.
2. Run the SQL migration in `supabase/migrations/0001_initial_schema.sql` via the Supabase SQL Editor or Supabase CLI (`supabase db push`).
3. Verify Row Level Security (RLS) is enabled on all 10 tables (`profiles`, `comic_projects`, `characters`, `project_characters`, `episodes`, `scenes`, `comic_panels`, `generated_prompts`, `generation_logs`, `user_preferences`) and the private `character-references` storage bucket is created.
4. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and Vercel environment variables.

---

## 4. Dual AI Engine Operation

- **Engine A — Google Gemini API:** Uses `@google/genai` server-side with structured JSON output, Zod validation, 25s timeout, and bounded exponential backoff retries.
- **Engine B — Local Prompt Engine:** Deterministic TypeScript generator with genre story templates, panel/character prompt composers, seeded variation engine, and continuity tracking. Works offline/without API keys.
- **Modes:**
  - **Auto:** Attempts Gemini first; transparently falls back to Local Prompt Engine on quota/timeout/missing key.
  - **Gemini Only:** Reports provider errors directly without silent switching.
  - **Local Only:** Runs Engine B directly.

---

## 5. Verification & Testing

```bash
npm run typecheck
npm run test
npm run build
```

---

## 6. Vercel Deployment

1. Import `Momoisan/affie-tech-comicforge-ai` into Vercel.
2. Configure the environment variables listed in Section 2 in Vercel Project Settings.
3. Deploy.

---

## 7. Troubleshooting

- **Gemini Only fails with `MISSING_API_KEY`:** Set `GEMINI_API_KEY` in `.env.local` (or Vercel) and restart the server, or switch Engine Mode to `Auto` / `Local Only`.
- **Storage shows `Local Browser` instead of `Supabase Cloud`:** Supply `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and run `supabase/migrations/0001_initial_schema.sql`.
