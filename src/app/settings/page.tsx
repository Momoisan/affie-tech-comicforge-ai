'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Cpu, Database, ShieldCheck } from 'lucide-react';
import { useComicForge } from '@/components/providers/comicforge-provider';
import {
  Badge,
  Card,
  Label,
  Select,
} from '@/components/ui/primitives';
import {
  ART_STYLE_IDS,
  ASPECT_RATIOS,
  type EngineMode,
  type ExportTarget,
  type ThemeMode,
  type UILanguage,
} from '@/types/comicforge';

export default function SettingsPage() {
  const { t, preferences, updatePreferences, engineStatus, notify } = useComicForge();

  const update = (patch: Parameters<typeof updatePreferences>[0]) => {
    updatePreferences(patch);
    notify(t.settings.savedToast, 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t.settings.title}</h1>
        <p className="text-sm text-[var(--cf-muted)]">{t.settings.subtitle}</p>
      </div>

      <Card className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <Label>{t.settings.interfaceLanguage}</Label>
          <Select
            value={preferences.uiLanguage}
            onChange={(e) => update({ uiLanguage: e.target.value as UILanguage })}
          >
            <option value="ms-MY">Bahasa Melayu Malaysia (Default)</option>
            <option value="en">English</option>
          </Select>
        </div>

        <div>
          <Label>{t.settings.themeMode}</Label>
          <Select
            value={preferences.theme}
            onChange={(e) => update({ theme: e.target.value as ThemeMode })}
          >
            <option value="dark">Dark Mode (Default)</option>
            <option value="light">Light Mode</option>
          </Select>
        </div>

        <div>
          <Label>{t.settings.preferredEngine}</Label>
          <Select
            value={preferences.preferredEngine}
            onChange={(e) => update({ preferredEngine: e.target.value as EngineMode })}
          >
            <option value="auto">Auto — Gemini with Local Fallback</option>
            <option value="gemini">Gemini Only</option>
            <option value="local">Local Prompt Engine Only</option>
          </Select>
        </div>

        <div>
          <Label>{t.settings.exportTarget}</Label>
          <Select
            value={preferences.exportTarget}
            onChange={(e) => update({ exportTarget: e.target.value as ExportTarget })}
          >
            <option value="chatgpt">ChatGPT Images</option>
            <option value="gemini">Google Gemini</option>
          </Select>
        </div>

        <div>
          <Label>{t.settings.defaultStyle}</Label>
          <Select
            value={preferences.defaultStyle}
            onChange={(e) => update({ defaultStyle: e.target.value })}
          >
            {ART_STYLE_IDS.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>{t.settings.defaultAspectRatio}</Label>
          <Select
            value={preferences.defaultAspectRatio}
            onChange={(e) => update({ defaultAspectRatio: e.target.value })}
          >
            {ASPECT_RATIOS.map((ar) => (
              <option key={ar} value={ar}>
                {ar}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Account, AI Engine & Storage Status */}
      <Card className="space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00D9FF]" />
          {t.settings.accountTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-[var(--cf-surface-2)] p-4 border border-[var(--cf-border)] space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#6366F1]" />
              Gemini Server Integration
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--cf-muted)]">Status</span>
              <Badge variant={engineStatus?.geminiConfigured ? 'success' : 'yellow'}>
                {engineStatus?.geminiConfigured ? 'Configured' : 'Local Fallback Active'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--cf-muted)]">Model</span>
              <span className="font-mono">{engineStatus?.geminiModel || 'gemini-2.5-flash'}</span>
            </div>
          </div>

          <div className="rounded-xl bg-[var(--cf-surface-2)] p-4 border border-[var(--cf-border)] space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#00D9FF]" />
              Supabase Cloud Persistence
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--cf-muted)]">Status</span>
              <Badge variant={engineStatus?.supabaseConfigured ? 'success' : 'cyan'}>
                {engineStatus?.supabaseConfigured ? 'Connected' : 'Browser Local Mode'}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--cf-muted)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Schema & RLS migration ready in supabase/migrations/</span>
            </div>
            <div className="pt-1">
              <Link
                href="/auth"
                className="inline-flex items-center text-xs font-semibold text-[#00D9FF] hover:underline"
              >
                {preferences.uiLanguage === 'ms-MY'
                  ? 'Urus Akaun & Log Masuk Supabase →'
                  : 'Manage Account & Supabase Auth →'}
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
