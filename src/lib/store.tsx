import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSafeImageDataUrl } from '@/lib/image-utils';
import { FrameType, FilterType, isFrameType } from '@/lib/customization';

export type LayoutType = 'vertical-4' | 'quad-4' | 'horizontal-3';
export interface Memory {
  id: string;
  url: string;
  date: number;
  layout: LayoutType;
  frame: FrameType;
  mimeType?: string;
}

interface AppState {
  layout: LayoutType;
  setLayout: (layout: LayoutType) => void;
  frame: FrameType;
  setFrame: (frame: FrameType) => void;
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  frameOpacity: number;
  setFrameOpacity: (opacity: number) => void;
  shots: string[];
  addShot: (shot: string) => void;
  clearShots: () => void;
  savedMemories: Memory[];
  saveMemory: (memory: Memory) => void;
  deleteMemory: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);
const MEMORY_STORAGE_KEY = 'pinksnap-memories';
const MAX_SAVED_MEMORIES = 50;

const isLayoutType = (value: unknown): value is LayoutType =>
  value === 'vertical-4' || value === 'quad-4' || value === 'horizontal-3';

const isMemory = (value: unknown): value is Memory => {
  if (!value || typeof value !== 'object') return false;
  const memory = value as Partial<Memory>;
  return typeof memory.id === 'string'
    && memory.id.length <= 100
    && isSafeImageDataUrl(memory.url)
    && typeof memory.date === 'number'
    && Number.isFinite(memory.date)
    && isLayoutType(memory.layout)
    && isFrameType(memory.frame)
    && (memory.mimeType === undefined || memory.mimeType === 'image/jpeg' || memory.mimeType === 'image/png');
};

const readSavedMemories = (): Memory[] => {
  try {
    const saved = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isMemory).slice(0, MAX_SAVED_MEMORIES) : [];
  } catch {
    return [];
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<LayoutType>('vertical-4');
  const [frame, setFrame] = useState<FrameType>('classic');
  const [filter, setFilter] = useState<FilterType>('color');
  const [frameOpacity, setFrameOpacity] = useState<number>(100);
  const [shots, setShots] = useState<string[]>([]);
  const [savedMemories, setSavedMemories] = useState<Memory[]>(readSavedMemories);

  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(savedMemories));
    } catch {
      // A few large memories can exceed a phone's localStorage quota.
      // Keep the newest memories that fit instead of failing the whole save.
      for (let keep = savedMemories.length - 1; keep >= 0; keep -= 1) {
        try {
          localStorage.setItem(
            MEMORY_STORAGE_KEY,
            JSON.stringify(savedMemories.slice(0, keep)),
          );
          return;
        } catch {
          // Try one fewer gallery item.
        }
      }
    }
  }, [savedMemories]);

  const addShot = (shot: string) => {
    if (isSafeImageDataUrl(shot)) setShots(prev => [...prev, shot]);
  };
  const clearShots = () => setShots([]);
  const saveMemory = (memory: Memory) => {
    if (!isMemory(memory)) return;
    setSavedMemories(prev => [memory, ...prev].slice(0, MAX_SAVED_MEMORIES));
  };
  const deleteMemory = (id: string) => setSavedMemories(prev => prev.filter(m => m.id !== id));

  const value = {
    layout, setLayout,
    frame, setFrame,
    filter, setFilter,
    frameOpacity, setFrameOpacity,
    shots, addShot, clearShots,
    savedMemories, saveMemory, deleteMemory
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
