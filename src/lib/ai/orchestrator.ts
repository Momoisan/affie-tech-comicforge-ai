import type {
  EngineId,
  GenerateComicRequest,
  StoryOutline,
} from '@/types/comicforge';
import {
  GeminiEngineError,
  generateWithGeminiEngine,
  getGeminiConfig,
} from '@/lib/ai/gemini-engine';
import { generateWithLocalEngine } from '@/lib/ai/local-engine';

export interface OrchestratedGenerationResult {
  ok: true;
  engineUsed: EngineId;
  fallbackUsed: boolean;
  fallbackReason?: string;
  outline: StoryOutline;
  tokenUsage?: Record<string, unknown>;
}

export interface OrchestratedGenerationFailure {
  ok: false;
  engineUsed: EngineId;
  errorCategory: string;
  message: string;
}

export type OrchestratorResult =
  | OrchestratedGenerationResult
  | OrchestratedGenerationFailure;

export async function orchestrateComicGeneration(
  input: GenerateComicRequest
): Promise<OrchestratorResult> {
  const mode = input.engineMode;

  // 1. Local Only
  if (mode === 'local') {
    const outline = generateWithLocalEngine(input);
    return {
      ok: true,
      engineUsed: 'local',
      fallbackUsed: false,
      outline,
    };
  }

  // 2. Gemini Only (never silently switches to local)
  if (mode === 'gemini') {
    try {
      const { outline, tokenUsage } = await generateWithGeminiEngine(input);
      return {
        ok: true,
        engineUsed: 'gemini',
        fallbackUsed: false,
        outline,
        tokenUsage,
      };
    } catch (err) {
      const category =
        err instanceof GeminiEngineError ? err.category : 'PROVIDER_ERROR';
      const message =
        err instanceof Error ? err.message : 'Gemini provider error.';
      return {
        ok: false,
        engineUsed: 'gemini',
        errorCategory: category,
        message,
      };
    }
  }

  // 3. Auto Mode — Gemini primary with Local Prompt Engine fallback
  const cfg = getGeminiConfig();
  const allowFallback = process.env.ENABLE_LOCAL_FALLBACK !== 'false';

  if (cfg.configured) {
    try {
      const { outline, tokenUsage } = await generateWithGeminiEngine(input);
      return {
        ok: true,
        engineUsed: 'gemini',
        fallbackUsed: false,
        outline,
        tokenUsage,
      };
    } catch (err) {
      if (!allowFallback) {
        const category =
          err instanceof GeminiEngineError ? err.category : 'PROVIDER_ERROR';
        return {
          ok: false,
          engineUsed: 'gemini',
          errorCategory: category,
          message: err instanceof Error ? err.message : 'Gemini failed and fallback is disabled.',
        };
      }
      const reason =
        err instanceof GeminiEngineError ? err.category : 'PROVIDER_ERROR';
      const outline = generateWithLocalEngine(input);
      return {
        ok: true,
        engineUsed: 'local',
        fallbackUsed: true,
        fallbackReason: reason,
        outline,
      };
    }
  }

  // Gemini not configured -> Auto mode invokes Local Engine transparently
  const outline = generateWithLocalEngine(input);
  return {
    ok: true,
    engineUsed: 'local',
    fallbackUsed: true,
    fallbackReason: 'GEMINI_NOT_CONFIGURED',
    outline,
  };
}
