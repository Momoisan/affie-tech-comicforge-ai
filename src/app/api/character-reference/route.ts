import { NextRequest, NextResponse } from 'next/server';
import { GenerateCharacterRefRequestSchema } from '@/types/comicforge';
import {
  buildCanonicalIdentityBlock,
  buildCharacterReferencePrompt,
} from '@/lib/ai/prompt-formatter';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { checkContentPolicy } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-client';
    const rate = checkRateLimit(`charref:${clientIp}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = GenerateCharacterRefRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid character profile data.',
        },
        { status: 400 }
      );
    }

    const { character, exportTarget } = parsed.data;
    const safety = checkContentPolicy(
      `${character.name} ${character.biography} ${character.primaryOutfit}`
    );
    if (!safety.allowed) {
      return NextResponse.json(
        { error: 'CONTENT_POLICY_VIOLATION', message: safety.reason },
        { status: 400 }
      );
    }

    const canonicalIdentityBlock = buildCanonicalIdentityBlock(character);
    const referencePrompt = buildCharacterReferencePrompt(character, exportTarget);

    return NextResponse.json({
      ok: true,
      engineUsed: 'local',
      canonicalIdentityBlock,
      referencePrompt,
    });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Unable to generate character reference prompt.' },
      { status: 500 }
    );
  }
}
