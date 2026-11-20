import { describe, expect, it } from 'vitest';
import { ComicProjectSchema } from '@/types/comicforge';

describe('Phase 2B-1 — Comic Creator Dashboard & Story Wizard Compatibility', () => {
  const legacyProject = {
    id: 'proj-legacy-1',
    title: 'Bayang Kota Neon',
    genre: 'Action',
    language: 'ms-MY' as const,
    targetAudience: 'Teenagers',
    premise: 'A neon cyberpunk mystery.',
    tone: 'Cinematic',
    artStyle: 'Korean Webtoon',
    format: 'Vertical Webtoon',
    aspectRatio: '9:16',
    panelCount: 6,
    episodeCount: 1,
    scenesPerEpisode: 2,
    panelsPerScene: 3,
    dialogueLength: 'medium' as const,
    pacing: 'balanced' as const,
    assignedCharacterIds: ['char-1'],
    status: 'draft' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('parses legacy projects cleanly without Phase 2B-1 optional fields', () => {
    const parsed = ComicProjectSchema.safeParse(legacyProject);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBe('proj-legacy-1');
      expect(parsed.data.assignedCharacterIds).toEqual(['char-1']);
    }
  });

  it('supports Phase 2B-1 metadata: characterRoles, props, currentEpisode, totalPages, exportStatus', () => {
    const enhanced = ComicProjectSchema.safeParse({
      ...legacyProject,
      worldId: 'world-1',
      currentEpisode: 2,
      totalPages: 12,
      exportStatus: 'exported',
      characterRoles: { 'char-1': 'Lead Investigator' },
      props: ['Glowing Blue Wristwatch', 'Ancient Keris'],
    });
    expect(enhanced.success).toBe(true);
    if (enhanced.success) {
      expect(enhanced.data.worldId).toBe('world-1');
      expect(enhanced.data.currentEpisode).toBe(2);
      expect(enhanced.data.totalPages).toBe(12);
      expect(enhanced.data.exportStatus).toBe('exported');
      expect(enhanced.data.characterRoles?.['char-1']).toBe('Lead Investigator');
      expect(enhanced.data.props).toEqual(['Glowing Blue Wristwatch', 'Ancient Keris']);
    }
  });
});
