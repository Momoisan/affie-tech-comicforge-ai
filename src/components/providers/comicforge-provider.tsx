'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type {
  CharacterProfile,
  ComicProject,
  EngineStatusSummary,
  PromptPackage,
  SavedPrompt,
  StoryWorld,
  UserPreferences,
} from '@/types/comicforge';
import { TRANSLATIONS, type Translations } from '@/lib/i18n/translations';
import { generateId } from '@/lib/utils';

const STORAGE_KEYS = {
  projects: 'comicforge_v1_projects',
  characters: 'comicforge_v1_characters',
  prompts: 'comicforge_v1_prompts',
  preferences: 'comicforge_v1_preferences',
  worlds: 'comicforge_v2_worlds',
  packages: 'comicforge_v2_packages',
} as const;

const DEFAULT_PREFERENCES: UserPreferences = {
  uiLanguage: 'ms-MY',
  theme: 'dark',
  preferredEngine: 'auto',
  defaultStyle: 'Korean Webtoon',
  defaultAspectRatio: '9:16',
  defaultStoryLanguage: 'ms-MY',
  exportTarget: 'chatgpt',
};

export interface ToastMessage {
  id: string;
  title: string;
  variant?: 'default' | 'success' | 'error';
}

interface ComicForgeContextValue {
  projects: ComicProject[];
  characters: CharacterProfile[];
  prompts: SavedPrompt[];
  preferences: UserPreferences;
  t: Translations;
  engineStatus: EngineStatusSummary | null;
  hydrated: boolean;
  toasts: ToastMessage[];
  notify: (title: string, variant?: ToastMessage['variant']) => void;
  dismissToast: (id: string) => void;

  // Preferences
  updatePreferences: (patch: Partial<UserPreferences>) => void;

  // Projects CRUD
  saveProject: (project: ComicProject) => void;
  duplicateProject: (id: string) => ComicProject | null;
  archiveProject: (id: string) => void;
  deleteProject: (id: string) => void;

  // Characters CRUD
  saveCharacter: (character: CharacterProfile) => void;
  duplicateCharacter: (id: string) => CharacterProfile | null;
  archiveCharacter: (id: string) => void;
  deleteCharacter: (id: string) => void;

  // Prompts CRUD
  savePrompt: (prompt: SavedPrompt) => void;
  deletePrompt: (id: string) => void;

  // V2 Story Bible Worlds
  worlds: StoryWorld[];
  saveWorld: (world: StoryWorld) => void;
  deleteWorld: (id: string) => void;

  // V2 Prompt Packages
  promptPackages: PromptPackage[];
  savePromptPackage: (pkg: PromptPackage) => void;
  deletePromptPackage: (id: string) => void;
}

const ComicForgeContext = createContext<ComicForgeContextValue | null>(null);

function safeReadStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function ComicForgeProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<ComicProject[]>([]);
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [worlds, setWorlds] = useState<StoryWorld[]>([]);
  const [promptPackages, setPromptPackages] = useState<PromptPackage[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [engineStatus, setEngineStatus] = useState<EngineStatusSummary | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setProjects(safeReadStorage<ComicProject[]>(STORAGE_KEYS.projects, []));
      setCharacters(safeReadStorage<CharacterProfile[]>(STORAGE_KEYS.characters, []));
      setPrompts(safeReadStorage<SavedPrompt[]>(STORAGE_KEYS.prompts, []));
      setWorlds(safeReadStorage<StoryWorld[]>(STORAGE_KEYS.worlds, []));
      setPromptPackages(safeReadStorage<PromptPackage[]>(STORAGE_KEYS.packages, []));
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...safeReadStorage<Partial<UserPreferences>>(STORAGE_KEYS.preferences, {}),
      });
      setHydrated(true);
    });

    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: EngineStatusSummary | null) => {
        if (active && data) setEngineStatus(data);
      })
      .catch(() => {
        // Keep null if offline
      });

    return () => {
      active = false;
    };
  }, []);

  // Sync theme class on <html>
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    if (preferences.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [preferences.theme, hydrated]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (title: string, variant: ToastMessage['variant'] = 'default') => {
      const id = generateId('toast');
      setToasts((prev) => [...prev, { id, title, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 3600);
    },
    []
  );

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const saveProject = useCallback((project: ComicProject) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id);
      const updated = { ...project, updatedAt: new Date().toISOString() };
      const next = idx >= 0 ? prev.map((p) => (p.id === project.id ? updated : p)) : [updated, ...prev];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const duplicateProject = useCallback(
    (id: string): ComicProject | null => {
      const target = projects.find((p) => p.id === id);
      if (!target) return null;
      const now = new Date().toISOString();
      const copy: ComicProject = {
        ...target,
        id: generateId('proj'),
        title: `${target.title} (Copy)`,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };
      saveProject(copy);
      return copy;
    },
    [projects, saveProject]
  );

  const archiveProject = useCallback((id: string) => {
    setProjects((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, status: 'archived' as const, updatedAt: new Date().toISOString() } : p
      );
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    // IMPORTANT: Never delete shared characters when a project is deleted!
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const saveCharacter = useCallback((character: CharacterProfile) => {
    setCharacters((prev) => {
      const idx = prev.findIndex((c) => c.id === character.id);
      const updated = { ...character, updatedAt: new Date().toISOString() };
      const next = idx >= 0 ? prev.map((c) => (c.id === character.id ? updated : c)) : [updated, ...prev];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.characters, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const duplicateCharacter = useCallback(
    (id: string): CharacterProfile | null => {
      const target = characters.find((c) => c.id === id);
      if (!target) return null;
      const now = new Date().toISOString();
      const copy: CharacterProfile = {
        ...target,
        id: generateId('char'),
        characterCode: `${target.characterCode}-V${target.version + 1}`,
        name: `${target.name} (Copy)`,
        version: target.version + 1,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      saveCharacter(copy);
      return copy;
    },
    [characters, saveCharacter]
  );

  const archiveCharacter = useCallback((id: string) => {
    setCharacters((prev) => {
      const next = prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: c.status === 'archived' ? ('active' as const) : ('archived' as const),
              updatedAt: new Date().toISOString(),
            }
          : c
      );
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.characters, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const deleteCharacter = useCallback((id: string) => {
    setCharacters((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.characters, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const savePrompt = useCallback((prompt: SavedPrompt) => {
    setPrompts((prev) => {
      const next = [prompt, ...prev.filter((p) => p.id !== prompt.id)].slice(0, 200);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.prompts, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const deletePrompt = useCallback((id: string) => {
    setPrompts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.prompts, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const saveWorld = useCallback((world: StoryWorld) => {
    setWorlds((prev) => {
      const idx = prev.findIndex((w) => w.id === world.id);
      const updated = { ...world, updatedAt: new Date().toISOString() };
      const next = idx >= 0 ? prev.map((w) => (w.id === world.id ? updated : w)) : [updated, ...prev];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.worlds, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const deleteWorld = useCallback((id: string) => {
    setWorlds((prev) => {
      const next = prev.filter((w) => w.id !== id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.worlds, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const savePromptPackage = useCallback((pkg: PromptPackage) => {
    setPromptPackages((prev) => {
      const next = [pkg, ...prev.filter((p) => p.id !== pkg.id)].slice(0, 200);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.packages, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const deletePromptPackage = useCallback((id: string) => {
    setPromptPackages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.packages, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const t = TRANSLATIONS[preferences.uiLanguage] ?? TRANSLATIONS['ms-MY'];

  return (
    <ComicForgeContext.Provider
      value={{
        projects,
        characters,
        prompts,
        preferences,
        t,
        engineStatus,
        hydrated,
        toasts,
        notify,
        dismissToast,
        updatePreferences,
        saveProject,
        duplicateProject,
        archiveProject,
        deleteProject,
        saveCharacter,
        duplicateCharacter,
        archiveCharacter,
        deleteCharacter,
        savePrompt,
        deletePrompt,
        worlds,
        saveWorld,
        deleteWorld,
        promptPackages,
        savePromptPackage,
        deletePromptPackage,
      }}
    >
      {children}
    </ComicForgeContext.Provider>
  );
}

export function useComicForge() {
  const ctx = useContext(ComicForgeContext);
  if (!ctx) {
    throw new Error('useComicForge must be used inside ComicForgeProvider');
  }
  return ctx;
}
