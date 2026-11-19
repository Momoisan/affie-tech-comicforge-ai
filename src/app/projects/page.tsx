'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Archive, Copy, FolderPlus, Play, Trash2 } from 'lucide-react';
import { useComicForge } from '@/components/providers/comicforge-provider';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
} from '@/components/ui/primitives';
import { formatDateShort } from '@/lib/utils';

export default function MyProjectsPage() {
  const {
    t,
    projects,
    preferences,
    duplicateProject,
    archiveProject,
    deleteProject,
    notify,
  } = useComicForge();

  const [showArchived, setShowArchived] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const visibleProjects = projects.filter((p) =>
    showArchived ? p.status === 'archived' : p.status !== 'archived'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t.projects.title}</h1>
          <p className="text-sm text-[var(--cf-muted)]">{t.projects.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowArchived((s) => !s)}
          >
            <Archive className="w-4 h-4" />
            {showArchived ? 'Active Projects' : 'Archived'}
          </Button>
          <Link href="/creator">
            <Button>
              <FolderPlus className="w-4 h-4" />
              {t.projects.newProject}
            </Button>
          </Link>
        </div>
      </div>

      {visibleProjects.length === 0 ? (
        <Card className="text-center py-12 space-y-4">
          <p className="text-sm text-[var(--cf-muted)]">{t.projects.empty}</p>
          <Link href="/creator">
            <Button>{t.actions.createComic}</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleProjects.map((proj) => (
            <Card key={proj.id} className="flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold text-lg leading-tight">{proj.title}</h2>
                  <Badge variant={proj.status === 'archived' ? 'yellow' : 'cyan'}>
                    {proj.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="indigo">{proj.genre}</Badge>
                  <Badge variant="default">{proj.artStyle}</Badge>
                  <Badge variant="default">{proj.aspectRatio}</Badge>
                </div>
                {proj.premise && (
                  <p className="text-xs text-[var(--cf-muted)] line-clamp-2">
                    {proj.premise}
                  </p>
                )}
                <div className="text-[11px] text-[var(--cf-muted)]">
                  Updated: {formatDateShort(proj.updatedAt, preferences.uiLanguage)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--cf-border)]">
                <Link href={`/creator?projectId=${encodeURIComponent(proj.id)}`}>
                  <Button size="sm">
                    <Play className="w-3.5 h-3.5" />
                    {t.actions.continueProject}
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const copy = duplicateProject(proj.id);
                    if (copy) notify(`Duplicated "${proj.title}"`, 'success');
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {t.actions.duplicate}
                </Button>
                {proj.status !== 'archived' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      archiveProject(proj.id);
                      notify('Projek diarkibkan.', 'default');
                    }}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    {t.actions.archive}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t.actions.delete}
                  title={t.actions.delete}
                  onClick={() => setDeleteTargetId(proj.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title={t.actions.delete}
        description={t.projects.confirmDelete}
        confirmLabel={t.actions.confirm}
        cancelLabel={t.actions.cancel}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteProject(deleteTargetId);
            notify('Projek dipadam.', 'default');
          }
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}
