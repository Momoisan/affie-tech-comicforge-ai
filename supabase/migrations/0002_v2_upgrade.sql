-- ============================================================================
-- AFFIE TECH ComicForge AI V2.0 — Safe Additive Database Migration
-- Extends V1.0 schema without altering or deleting existing tables/data.
-- ============================================================================

-- 1. story_worlds
CREATE TABLE IF NOT EXISTS public.story_worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.comic_projects(id) ON DELETE SET NULL,
  world_name TEXT NOT NULL,
  world_description TEXT NOT NULL DEFAULT '',
  world_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  world_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_worlds_user_id ON public.story_worlds(user_id);
CREATE INDEX IF NOT EXISTS idx_story_worlds_project_id ON public.story_worlds(project_id);

CREATE TRIGGER trg_story_worlds_updated_at
  BEFORE UPDATE ON public.story_worlds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. world_locations
CREATE TABLE IF NOT EXISTS public.world_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.story_worlds(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  location_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  reference_image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_world_locations_world_id ON public.world_locations(world_id);

-- 3. world_factions
CREATE TABLE IF NOT EXISTS public.world_factions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.story_worlds(id) ON DELETE CASCADE,
  faction_name TEXT NOT NULL,
  faction_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_world_factions_world_id ON public.world_factions(world_id);

-- 4. story_events
CREATE TABLE IF NOT EXISTS public.story_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.comic_projects(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL DEFAULT 'plot',
  event_description TEXT NOT NULL,
  timeline_position INTEGER NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_events_project_id ON public.story_events(project_id, timeline_position);

-- 5. character_versions
CREATE TABLE IF NOT EXISTS public.character_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  identity_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  outfit_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  character_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (character_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_character_versions_char_id ON public.character_versions(character_id);

-- 6. character_outfits
CREATE TABLE IF NOT EXISTS public.character_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  outfit_name TEXT NOT NULL,
  outfit_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_character_outfits_char_id ON public.character_outfits(character_id);

-- 7. panel_revisions
CREATE TABLE IF NOT EXISTS public.panel_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id UUID NOT NULL REFERENCES public.comic_panels(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL CHECK (revision_number >= 1),
  panel_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  prompt_text TEXT NOT NULL DEFAULT '',
  engine_used TEXT NOT NULL CHECK (engine_used IN ('gemini', 'local')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (panel_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_panel_revisions_panel_id ON public.panel_revisions(panel_id);

-- 8. prompt_packages
CREATE TABLE IF NOT EXISTS public.prompt_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.comic_projects(id) ON DELETE SET NULL,
  panel_id UUID REFERENCES public.comic_panels(id) ON DELETE SET NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('panel', 'scene', 'episode')),
  target_platform TEXT NOT NULL CHECK (target_platform IN ('chatgpt', 'gemini')),
  package_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_packages_user_id ON public.prompt_packages(user_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) FOR V2 TABLES
-- ============================================================================
ALTER TABLE public.story_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_worlds_all_own" ON public.story_worlds
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "world_locations_all_own" ON public.world_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.story_worlds w WHERE w.id = world_id AND w.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.story_worlds w WHERE w.id = world_id AND w.user_id = auth.uid())
  );

CREATE POLICY "world_factions_all_own" ON public.world_factions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.story_worlds w WHERE w.id = world_id AND w.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.story_worlds w WHERE w.id = world_id AND w.user_id = auth.uid())
  );

CREATE POLICY "story_events_all_own" ON public.story_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.comic_projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.comic_projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

CREATE POLICY "character_versions_all_own" ON public.character_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
  );

CREATE POLICY "character_outfits_all_own" ON public.character_outfits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
  );

CREATE POLICY "panel_revisions_all_own" ON public.panel_revisions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.comic_panels cp
      JOIN public.scenes s ON s.id = cp.scene_id
      JOIN public.episodes e ON e.id = s.episode_id
      JOIN public.comic_projects p ON p.id = e.project_id
      WHERE cp.id = panel_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comic_panels cp
      JOIN public.scenes s ON s.id = cp.scene_id
      JOIN public.episodes e ON e.id = s.episode_id
      JOIN public.comic_projects p ON p.id = e.project_id
      WHERE cp.id = panel_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "prompt_packages_all_own" ON public.prompt_packages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
