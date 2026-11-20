import { describe, expect, it } from 'vitest';
import {
  ComicEpisodeSchema,
  ComicProjectSchema,
  PAGE_PLAN_STATUSES,
  PlannedPageSchema,
  STORY_ARC_PRESETS,
} from '@/types/comicforge';
import { TRANSLATIONS } from '@/lib/i18n/translations';

describe('Phase 2B-2 — Visual Story & Page Planner', () => {
  it('validates PlannedPageSchema with all 6 status states and continuity recap', () => {
    for (const status of PAGE_PLAN_STATUSES) {
      const parsed = PlannedPageSchema.safeParse({
        id: `pg-${status}`,
        pageNumber: 1,
        episodeNumber: 1,
        storyBeat: 'Opening confrontation',
        sceneSummary: 'Hero enters the kopitiam.',
        charactersPresent: ['Aiman'],
        location: 'Kopitiam Sentral',
        panelCount: 4,
        status,
        recap: 'Aiman found the glowing note.',
      });
      expect(parsed.success).toBe(true);
    }
  });

  it('supports editable story arcs on ComicEpisodeSchema and preserves backward compatibility', () => {
    expect(STORY_ARC_PRESETS).toContain('Beginning / Setup');
    expect(STORY_ARC_PRESETS).toContain('Climax');

    const epWithArc = ComicEpisodeSchema.safeParse({
      id: 'ep-1',
      episode_number: 1,
      title: 'Awakening',
      storyArc: 'Custom Arc — Act I',
      synopsis: 'Setup episode.',
      scenes: [],
    });
    expect(epWithArc.success).toBe(true);

    const legacyProject = ComicProjectSchema.safeParse({
      id: 'proj-v1',
      title: 'Legacy Comic',
      genre: 'Action',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(legacyProject.success).toBe(true);
  });

  it('exposes Comic Workspace navigation labels in BM and EN', () => {
    expect(TRANSLATIONS['ms-MY'].nav.workspace).toBe('Ruang Kerja Komik');
    expect(TRANSLATIONS['en'].nav.workspace).toBe('Comic Workspace');
  });
});
