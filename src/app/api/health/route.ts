import { NextResponse } from 'next/server';
import { getGeminiConfig } from '@/lib/ai/gemini-engine';
import type { EngineMode, EngineStatusSummary } from '@/types/comicforge';

export async function GET() {
  const gemini = getGeminiConfig();
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );

  const envPrimary = process.env.AI_PRIMARY_ENGINE?.trim();
  const defaultEngineMode: EngineMode =
    envPrimary === 'local' ? 'local' : gemini.configured ? 'auto' : 'auto';

  const summary: EngineStatusSummary = {
    geminiConfigured: gemini.configured,
    geminiModel: gemini.model,
    localEngineReady: true,
    supabaseConfigured,
    defaultEngineMode,
    activeStorageMode: supabaseConfigured ? 'supabase' : 'local-browser',
  };

  return NextResponse.json(summary);
}
