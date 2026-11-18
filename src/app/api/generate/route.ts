import { NextRequest, NextResponse } from 'next/server';
import { GenerateComicRequestSchema } from '@/types/comicforge';
import { orchestrateComicGeneration } from '@/lib/ai/orchestrator';
import {
  expandLocalPremise,
  generateLocalTitle,
} from '@/lib/ai/local-engine';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { checkContentPolicy } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-client';
    const rate = checkRateLimit(`generate:${clientIp}`);

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many generation requests. Please wait a moment before trying again.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rate.resetAt),
          },
        }
      );
    }

    const rawBody = await req.text();
    if (rawBody.length > 100_000) {
      return NextResponse.json(
        { error: 'PAYLOAD_TOO_LARGE', message: 'Request payload exceeds maximum allowed size.' },
        { status: 413 }
      );
    }

    const json = JSON.parse(rawBody);
    const parsed = GenerateComicRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid generation request parameters.',
          details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Content safety check
    const combinedText = [
      data.project.title,
      data.project.premise,
      data.project.customGenre || '',
      data.project.customArtStyle || '',
    ].join(' ');
    const safety = checkContentPolicy(combinedText);
    if (!safety.allowed) {
      return NextResponse.json(
        { error: 'CONTENT_POLICY_VIOLATION', message: safety.reason },
        { status: 400 }
      );
    }

    if (data.mode === 'title') {
      const title = generateLocalTitle(
        data.project.genre,
        data.project.language,
        data.seed ?? Date.now()
      );
      return NextResponse.json({
        ok: true,
        engineUsed: 'local',
        fallbackUsed: false,
        title,
      });
    }

    if (data.mode === 'premise_expand') {
      const premise = expandLocalPremise(
        data.project.genre,
        data.project.tone,
        data.project.language,
        data.project.premise
      );
      return NextResponse.json({
        ok: true,
        engineUsed: 'local',
        fallbackUsed: false,
        premise,
      });
    }

    const result = await orchestrateComicGeneration(data);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          engineUsed: result.engineUsed,
          error: result.errorCategory,
          message: result.message,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': String(rate.remaining),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Unable to process generation request.' },
      { status: 500 }
    );
  }
}
