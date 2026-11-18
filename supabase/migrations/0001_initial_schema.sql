-- ============================================================================
-- AFFIE TECH ComicForge AI V1.0 — Supabase PostgreSQL Schema & RLS
-- Normalized schema with UUID primary keys, strict foreign keys, indexes,
-- timestamps, Row Level Security (RLS), and private Storage bucket.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Creator',
  preferred_language TEXT NOT NULL DEFAULT 'ms-MY' CHECK (preferred_language IN ('ms-MY', 'en')),
  preferred_theme TEXT NOT NULL DEFAULT 'dark' CHECK (preferred_theme IN ('dark', 'light')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. comic_projects
CREATE TABLE IF NOT EXISTS public.comic_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  synopsis TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT 'General Audience',
  language TEXT NOT NULL DEFAULT 'ms-MY' CHECK (language IN ('ms-MY', 'en', 'bilingual')),
  art_style TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'Vertical Webtoon',
  aspect_ratio TEXT NOT NULL DEFAULT '9:16',
  tone TEXT NOT NULL DEFAULT 'Cinematic',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comic_projects_user_id ON public.comic_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_comic_projects_status ON public.comic_projects(user_id, status);

CREATE TRIGGER trg_comic_projects_updated_at
  BEFORE UPDATE ON public.comic_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. characters (Independent of projects — deleting a project does NOT delete shared characters)
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  identity_lock JSONB NOT NULL DEFAULT '{}'::jsonb,
  reference_image_path TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_status ON public.characters(user_id, status);

CREATE TRIGGER trg_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. project_characters (Many-to-many join; project deletion removes link, NOT character)
CREATE TABLE IF NOT EXISTS public.project_characters (
  project_id UUID NOT NULL REFERENCES public.comic_projects(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT 'Supporting',
  project_specific_notes TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (project_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_project_characters_character_id ON public.project_characters(character_id);

-- 5. episodes
CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.comic_projects(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL CHECK (episode_number >= 1),
  title TEXT NOT NULL,
  synopsis TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episodes_project_id ON public.episodes(project_id);

CREATE TRIGGER trg_episodes_updated_at
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. scenes
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL CHECK (scene_number >= 1),
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  continuity_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (episode_id, scene_number)
);

CREATE INDEX IF NOT EXISTS idx_scenes_episode_id ON public.scenes(episode_id);

-- 7. comic_panels
CREATE TABLE IF NOT EXISTS public.comic_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  panel_number INTEGER NOT NULL CHECK (panel_number >= 1),
  panel_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_prompt TEXT NOT NULL DEFAULT '',
  negative_prompt TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scene_id, panel_number)
);

CREATE INDEX IF NOT EXISTS idx_comic_panels_scene_id ON public.comic_panels(scene_id);

CREATE TRIGGER trg_comic_panels_updated_at
  BEFORE UPDATE ON public.comic_panels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. generated_prompts
CREATE TABLE IF NOT EXISTS public.generated_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.comic_projects(id) ON DELETE SET NULL,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('panel', 'character_reference', 'story_outline', 'template')),
  engine_used TEXT NOT NULL CHECK (engine_used IN ('gemini', 'local')),
  prompt_text TEXT NOT NULL,
  structured_output JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_prompts_user_id ON public.generated_prompts(user_id, created_at DESC);

-- 9. generation_logs (No raw user prompts or provider secrets stored)
CREATE TABLE IF NOT EXISTS public.generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  engine TEXT NOT NULL CHECK (engine IN ('gemini', 'local')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'fallback')),
  fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
  error_category TEXT,
  token_usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON public.generation_logs(user_id, created_at DESC);

-- 10. user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_engine TEXT NOT NULL DEFAULT 'auto' CHECK (default_engine IN ('auto', 'gemini', 'local')),
  default_style TEXT NOT NULL DEFAULT 'Korean Webtoon',
  default_language TEXT NOT NULL DEFAULT 'ms-MY' CHECK (default_language IN ('ms-MY', 'en', 'bilingual')),
  default_aspect_ratio TEXT NOT NULL DEFAULT '9:16',
  export_target TEXT NOT NULL DEFAULT 'chatgpt' CHECK (export_target IN ('chatgpt', 'gemini')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comic_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comic_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- comic_projects policies
CREATE POLICY "comic_projects_all_own" ON public.comic_projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- characters policies
CREATE POLICY "characters_all_own" ON public.characters
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- project_characters policies (user must own both the project and the character)
CREATE POLICY "project_characters_select_own" ON public.project_characters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.comic_projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "project_characters_insert_own" ON public.project_characters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comic_projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "project_characters_update_own" ON public.project_characters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.comic_projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "project_characters_delete_own" ON public.project_characters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.comic_projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- episodes policies (via project ownership)
CREATE POLICY "episodes_all_own" ON public.episodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.comic_projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comic_projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- scenes policies (via episode -> project ownership)
CREATE POLICY "scenes_all_own" ON public.scenes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.episodes e
      JOIN public.comic_projects p ON p.id = e.project_id
      WHERE e.id = episode_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.episodes e
      JOIN public.comic_projects p ON p.id = e.project_id
      WHERE e.id = episode_id AND p.user_id = auth.uid()
    )
  );

-- comic_panels policies (via scene -> episode -> project ownership)
CREATE POLICY "comic_panels_all_own" ON public.comic_panels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.scenes s
      JOIN public.episodes e ON e.id = s.episode_id
      JOIN public.comic_projects p ON p.id = e.project_id
      WHERE s.id = scene_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scenes s
      JOIN public.episodes e ON e.id = s.episode_id
      JOIN public.comic_projects p ON p.id = e.project_id
      WHERE s.id = scene_id AND p.user_id = auth.uid()
    )
  );

-- generated_prompts policies
CREATE POLICY "generated_prompts_all_own" ON public.generated_prompts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- generation_logs policies
CREATE POLICY "generation_logs_select_own" ON public.generation_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "generation_logs_insert_own" ON public.generation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_preferences policies
CREATE POLICY "user_preferences_all_own" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PRIVATE STORAGE BUCKET FOR CHARACTER REFERENCE IMAGES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'character-references',
  'character-references',
  false,
  5242880, -- 5 MB max
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "character_refs_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'character-references'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "character_refs_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'character-references'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "character_refs_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'character-references'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "character_refs_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'character-references'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
