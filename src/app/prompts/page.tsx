'use client';

import React, { useMemo, useState } from 'react';
import { Copy, Download, Search, Trash2 } from 'lucide-react';
import { useComicForge } from '@/components/providers/comicforge-provider';
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Textarea,
} from '@/components/ui/primitives';
import { formatDateShort } from '@/lib/utils';

export default function PromptLibraryPage() {
  const { t, prompts, preferences, deletePrompt, notify } = useComicForge();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prompts.filter((p) => {
      if (typeFilter !== 'all' && p.promptType !== typeFilter) return false;
      if (!q) return true;
      return (
        (p.projectTitle || '').toLowerCase().includes(q) ||
        (p.characterName || '').toLowerCase().includes(q) ||
        (p.artStyle || '').toLowerCase().includes(q) ||
        p.promptText.toLowerCase().includes(q)
      );
    });
  }, [prompts, search, typeFilter]);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    notify(`${label} disalin!`, 'success');
  };

  const downloadTxt = (text: string, name: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t.prompts.title}</h1>
        <p className="text-sm text-[var(--cf-muted)]">{t.prompts.subtitle}</p>
      </div>

      <Card className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--cf-muted)] absolute left-3 top-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.prompts.searchPlaceholder}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="sm:w-52"
        >
          <option value="all">{t.prompts.filterAll}</option>
          <option value="panel">Comic Panel</option>
          <option value="character_reference">Character Reference</option>
          <option value="story_outline">Story Outline</option>
          <option value="template">Template</option>
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <Card className="text-center py-12 text-sm text-[var(--cf-muted)]">
          {t.prompts.empty}
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((pr) => (
            <Card key={pr.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm">
                    {pr.projectTitle || pr.characterName || 'Saved Prompt'}
                  </span>
                  <Badge variant={pr.engineUsed === 'gemini' ? 'indigo' : 'cyan'}>
                    {pr.engineUsed === 'gemini' ? 'Gemini' : 'Local Engine'}
                  </Badge>
                  {pr.artStyle && <Badge variant="yellow">{pr.artStyle}</Badge>}
                  <span className="text-xs text-[var(--cf-muted)]">
                    {formatDateShort(pr.createdAt, preferences.uiLanguage)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => copy(pr.promptText, 'Prompt')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {t.actions.copyPrompt}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copy(JSON.stringify(pr.structuredOutput, null, 2), 'JSON')
                    }
                  >
                    {t.actions.copyJson}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadTxt(pr.promptText, pr.id)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    TXT
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      deletePrompt(pr.id);
                      notify('Prompt dipadam.', 'default');
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </Button>
                </div>
              </div>
              <Textarea
                rows={6}
                readOnly
                value={pr.promptText}
                className="font-mono text-xs"
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
