import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { FrameType, FilterType, ArtisanTemplateId, isFrameType, ARTISAN_TEMPLATES } from '@/lib/customization';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { dataUrlToBlob } from '@/lib/image-utils';

export type LayoutType = 'vertical-4' | 'quad-4' | 'horizontal-3';
export interface Memory {
  id: string;
  url: string;
  date: number;
  layout: LayoutType;
  frame: FrameType | ArtisanTemplateId;
  mimeType?: string;
}

interface AppState {
  layout: LayoutType;
  setLayout: (layout: LayoutType) => void;
  frame: FrameType;
  setFrame: (frame: FrameType) => void;
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  shots: string[];
  addShot: (shot: string) => void;
  clearShots: () => void;
  savedMemories: Memory[];
  saveMemory: (memory: Memory) => Promise<boolean>;
  deleteMemory: (id: string) => void;
  isLoadingMemories: boolean;
  isSavingMemory: boolean;
}

const AppContext = createContext<AppState | null>(null);
const MAX_SAVED_MEMORIES = 50;

const isLayoutType = (value: unknown): value is LayoutType =>
  value === 'vertical-4' || value === 'quad-4' || value === 'horizontal-3';

/**
 * Upload a data-URL image to Supabase Storage (`strips` bucket) under the
 * authenticated user's folder, then insert a row into the `memories` table.
 *
 * Returns the public URL of the uploaded image, or `null` on failure.
 */
async function uploadStripToCloud(
  userId: string,
  memoryId: string,
  dataUrl: string,
  layout: LayoutType,
  frame: FrameType | ArtisanTemplateId,
  mimeType: string = 'image/jpeg',
): Promise<string | null> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const ext = mimeType === 'image/png' ? 'png' : 'jpeg';
    const storagePath = `${userId}/${memoryId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('strips')
      .upload(storagePath, blob, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[PinkSnap Cloud] Upload error:', uploadError.message);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('strips')
      .getPublicUrl(storagePath);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) return null;

    // Insert into memories table
    const { error: insertError } = await supabase.from('memories').insert({
      id: memoryId,
      user_id: userId,
      image_url: publicUrl,
      layout,
      frame: typeof frame === 'string' ? frame : 'classic',
      filter: 'color',
      mime_type: mimeType,
    });

    if (insertError) {
      console.error('[PinkSnap Cloud] Insert error:', insertError.message);
      // Attempt cleanup of the uploaded file
      await supabase.storage.from('strips').remove([storagePath]);
      return null;
    }

    return publicUrl;
  } catch (err) {
    console.error('[PinkSnap Cloud] Upload exception:', err);
    return null;
  }
}

/**
 * Fetch memories for a given user from the Supabase `memories` table.
 */
async function fetchCloudMemories(userId: string): Promise<Memory[]> {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('id, image_url, layout, frame, mime_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_SAVED_MEMORIES);

    if (error) {
      console.error('[PinkSnap Cloud] Fetch error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      url: row.image_url,
      date: new Date(row.created_at).getTime(),
      layout: isLayoutType(row.layout) ? row.layout : 'vertical-4',
      frame: (isFrameType(row.frame) || ARTISAN_TEMPLATES.some(t => t.id === row.frame))
        ? row.frame
        : 'classic',
      mimeType: row.mime_type || 'image/jpeg',
    }));
  } catch (err) {
    console.error('[PinkSnap Cloud] Fetch exception:', err);
    return [];
  }
}

/**
 * Delete a memory from both the `memories` table and `strips` storage.
 */
async function deleteCloudMemory(userId: string, memoryId: string, imageUrl: string): Promise<boolean> {
  try {
    // Extract the storage path from the public URL
    const match = imageUrl.match(/\/strips\/(.+)$/);
    const storagePath = match ? match[1] : `${userId}/${memoryId}.jpeg`;

    // Delete from storage first
    await supabase.storage.from('strips').remove([storagePath]);

    // Delete from the memories table
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', userId);

    if (error) {
      console.error('[PinkSnap Cloud] Delete error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[PinkSnap Cloud] Delete exception:', err);
    return false;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [layout, setLayout] = useState<LayoutType>('vertical-4');
  const [frame, setFrame] = useState<FrameType>('classic');
  const [filter, setFilter] = useState<FilterType>('color');
  const [shots, setShots] = useState<string[]>([]);
  const [savedMemories, setSavedMemories] = useState<Memory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);

  // Track the user ID we last fetched for to avoid stale data
  const lastFetchedUserId = useRef<string | null>(null);

  // Fetch memories from the cloud whenever the authenticated user changes
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // User signed out — clear everything
      setSavedMemories([]);
      lastFetchedUserId.current = null;
      return;
    }

    // Don't re-fetch if we already loaded for this user
    if (lastFetchedUserId.current === user.id) return;

    let cancelled = false;
    setIsLoadingMemories(true);

    fetchCloudMemories(user.id).then((memories) => {
      if (!cancelled) {
        setSavedMemories(memories);
        lastFetchedUserId.current = user.id;
        setIsLoadingMemories(false);
      }
    });

    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  const addShot = (shot: string) => {
    if (typeof shot === 'string' && shot.startsWith('data:image/')) {
      setShots(prev => [...prev, shot]);
    }
  };

  const clearShots = () => setShots([]);

  const saveMemory = useCallback(async (memory: Memory): Promise<boolean> => {
    if (!user?.id) return false;
    setIsSavingMemory(true);

    try {
      const publicUrl = await uploadStripToCloud(
        user.id,
        memory.id,
        memory.url,
        memory.layout,
        memory.frame,
        memory.mimeType || 'image/jpeg',
      );

      if (!publicUrl) {
        setIsSavingMemory(false);
        return false;
      }

      // Optimistically add the memory to state with the cloud URL
      const cloudMemory: Memory = {
        ...memory,
        url: publicUrl,
        date: Date.now(),
      };

      setSavedMemories(prev => [cloudMemory, ...prev].slice(0, MAX_SAVED_MEMORIES));
      setIsSavingMemory(false);
      return true;
    } catch {
      setIsSavingMemory(false);
      return false;
    }
  }, [user?.id]);

  const deleteMemory = useCallback((id: string) => {
    if (!user?.id) return;
    const memory = savedMemories.find(m => m.id === id);
    if (!memory) return;

    // Optimistically remove from state
    setSavedMemories(prev => prev.filter(m => m.id !== id));

    // Delete from cloud in the background
    deleteCloudMemory(user.id, id, memory.url).catch(() => {
      // If cloud delete fails, the item is already removed from the UI.
      // The storage file will be orphaned but won't affect the user.
    });
  }, [user?.id, savedMemories]);

  const value: AppState = {
    layout, setLayout,
    frame, setFrame,
    filter, setFilter,
    shots, addShot, clearShots,
    savedMemories, saveMemory, deleteMemory,
    isLoadingMemories, isSavingMemory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
