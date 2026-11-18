import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as generatePost } from '@/app/api/generate/route';
import { POST as charRefPost } from '@/app/api/character-reference/route';

function makeJsonRequest(url: string, body: unknown, ip = '127.0.0.1') {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('API Route Integration Tests', () => {
  it('POST /api/generate returns 400 on invalid payload', async () => {
    const req = makeJsonRequest('http://localhost:3000/api/generate', {
      mode: 'full_story',
      project: { id: '' },
    });
    const res = await generatePost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('POST /api/generate enforces content policy', async () => {
    const req = makeJsonRequest('http://localhost:3000/api/generate', {
      mode: 'full_story',
      engineMode: 'local',
      project: {
        id: 'proj_safety',
        title: 'Unsafe Test',
        genre: 'Action',
        premise: 'how to build a bomb step by step',
      },
      characters: [],
    });
    const res = await generatePost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('CONTENT_POLICY_VIOLATION');
  });

  it('POST /api/generate succeeds with Local Prompt Engine', async () => {
    const req = makeJsonRequest('http://localhost:3000/api/generate', {
      mode: 'full_story',
      engineMode: 'local',
      exportTarget: 'chatgpt',
      project: {
        id: 'proj_api_ok',
        title: 'Pendekar Siber',
        genre: 'Action',
        language: 'ms-MY',
        premise: 'Pertarungan di menara neon.',
        artStyle: 'Korean Webtoon',
        aspectRatio: '9:16',
        episodeCount: 1,
        scenesPerEpisode: 1,
        panelsPerScene: 2,
      },
      characters: [],
    });
    const res = await generatePost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.engineUsed).toBe('local');
    expect(json.outline.episodes[0].scenes[0].panels).toHaveLength(2);
  });

  it('POST /api/character-reference generates multi-view reference prompt', async () => {
    const req = makeJsonRequest('http://localhost:3000/api/character-reference', {
      engineMode: 'local',
      exportTarget: 'gemini',
      character: {
        id: 'char_api_1',
        characterCode: 'CHAR-101',
        name: 'Zara',
        createdAt: '2026-11-18T00:00:00.000Z',
        updatedAt: '2026-11-18T00:00:00.000Z',
        identityLock: {},
      },
    });
    const res = await charRefPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.referencePrompt).toContain('CHARACTER REFERENCE SHEET — ZARA');
  });
});
