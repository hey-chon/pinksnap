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
  removeShot: (index: number) => void;
  removeShots: (indexes: number[]) => void;
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

import { encryptBlob, decryptBlob, encryptShots, decryptShots } from '@/lib/crypto';

/**
 * Upload an encrypted data-URL image to Supabase Storage (`strips` bucket) under the
 * authenticated user's folder, then insert a row into the `memories` table.
 *
 * All strips are encrypted with AES-256-GCM BEFORE leaving the browser.
 * Only the authenticated account owner possesses the key to decrypt and view them.
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
    const rawBlob = dataUrlToBlob(dataUrl);
    // Encrypt the photo strip binary using user-derived AES-256-GCM
    const { encryptedBlob, ivHex, saltHex } = await encryptBlob(rawBlob, userId);
    const storagePath = `${userId}/${memoryId}.enc`;

    const { error: uploadError } = await supabase.storage
      .from('strips')
      .upload(storagePath, encryptedBlob, {
        contentType: 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('[PinkSnap Cloud] Upload error:', uploadError.message);
      return null;
    }

    // Insert metadata with encryption parameters into memories table
    const { error: insertError } = await supabase.from('memories').insert({
      id: memoryId,
      user_id: userId,
      image_url: storagePath,
      layout,
      frame: typeof frame === 'string' ? frame : 'classic',
      filter: 'color',
      mime_type: mimeType,
      is_encrypted: true,
      encryption_iv: ivHex,
      encryption_salt: saltHex,
    });

    if (insertError) {
      console.error('[PinkSnap Cloud] Insert error:', insertError.message);
      await supabase.storage.from('strips').remove([storagePath]);
      return null;
    }

    // Return the local dataUrl for instant flicker-free rendering for the owner
    return dataUrl;
  } catch (err) {
    console.error('[PinkSnap Cloud] Upload exception:', err);
    return null;
  }
}

/**
 * Fetch and decrypt memories for a given user from the Supabase `memories` table.
 * Every photo strip is decrypted on-the-fly in the browser with AES-256-GCM.
 */
async function fetchCloudMemories(userId: string): Promise<Memory[]> {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('id, image_url, layout, frame, mime_type, created_at, is_encrypted, encryption_iv, encryption_salt')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_SAVED_MEMORIES);

    if (error) {
      console.error('[PinkSnap Cloud] Fetch error:', error.message);
      return [];
    }

    const decryptedMemories: Memory[] = [];

    for (const row of data || []) {
      let displayUrl = row.image_url;

      try {
        // Resolve storage path
        let storagePath = row.image_url;
        if (storagePath.includes('/strips/')) {
          storagePath = storagePath.split('/strips/')[1].split('?')[0];
        }

        // If stored as an encrypted storage path or relative path, download and decrypt
        if (storagePath && !storagePath.startsWith('data:')) {
          const { data: cipherBlob, error: dlError } = await supabase.storage
            .from('strips')
            .download(storagePath);

          if (!dlError && cipherBlob) {
            // Decrypt the blob with the user's AES-256-GCM key
            const decryptedBlob = await decryptBlob(
              cipherBlob,
              userId,
              row.encryption_iv,
              row.encryption_salt
            );
            displayUrl = URL.createObjectURL(decryptedBlob);
          } else if (storagePath.includes('.enc')) {
            // If encrypted file could not be downloaded via auth storage, try signed URL
            const { data: signedData } = await supabase.storage
              .from('strips')
              .createSignedUrl(storagePath, 3600);
            if (signedData?.signedUrl) {
              const res = await fetch(signedData.signedUrl);
              const blob = await res.blob();
              const decryptedBlob = await decryptBlob(
                blob,
                userId,
                row.encryption_iv,
                row.encryption_salt
              );
              displayUrl = URL.createObjectURL(decryptedBlob);
            }
          }
        }
      } catch (decryptErr) {
        console.warn(`[PinkSnap Cloud] Could not decrypt memory ${row.id}:`, decryptErr);
        // Fall back to original url if already public/legacy
      }

      decryptedMemories.push({
        id: row.id,
        url: displayUrl,
        date: new Date(row.created_at).getTime(),
        layout: isLayoutType(row.layout) ? row.layout : 'vertical-4',
        frame: (isFrameType(row.frame) || ARTISAN_TEMPLATES.some(t => t.id === row.frame))
          ? row.frame
          : 'classic',
        mimeType: row.mime_type || 'image/jpeg',
      });
    }

    return decryptedMemories;
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
    const encPath = `${userId}/${memoryId}.enc`;
    let legacyPath = `${userId}/${memoryId}.jpeg`;
    if (imageUrl.includes('/strips/')) {
      legacyPath = imageUrl.split('/strips/')[1].split('?')[0];
    }

    // Remove both potential encrypted and legacy storage paths
    await supabase.storage.from('strips').remove([encPath, legacyPath]);

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
  const [layout, setLayout] = useState<LayoutType>(() => (sessionStorage.getItem('ps_layout') as LayoutType) || 'vertical-4');
  const [frame, setFrame] = useState<FrameType>(() => (sessionStorage.getItem('ps_frame') as FrameType) || 'classic');
  const [filter, setFilter] = useState<FilterType>(() => (sessionStorage.getItem('ps_filter') as FilterType) || 'color');
  const [shots, setShots] = useState<string[]>([]);
  const [shotsLoaded, setShotsLoaded] = useState(false);

  // Decrypt shots from sessionStorage on mount (once user is authenticated)
  useEffect(() => {
    if (shotsLoaded) return;
    const raw = sessionStorage.getItem('ps_shots');
    if (!raw) {
      setShotsLoaded(true);
      return;
    }
    if (user?.id) {
      decryptShots(raw, user.id).then((decrypted) => {
        setShots(decrypted);
        setShotsLoaded(true);
      }).catch(() => {
        // Fallback: try parsing as plain JSON (legacy)
        try { setShots(JSON.parse(raw)); } catch { setShots([]); }
        setShotsLoaded(true);
      });
    } else {
      // No user yet — try parsing as plain array (pre-auth shots)
      try { setShots(JSON.parse(raw)); } catch { setShots([]); }
      setShotsLoaded(true);
    }
  }, [user?.id, shotsLoaded]);

  useEffect(() => sessionStorage.setItem('ps_layout', layout), [layout]);
  useEffect(() => sessionStorage.setItem('ps_frame', frame), [frame]);
  useEffect(() => sessionStorage.setItem('ps_filter', filter), [filter]);

  // Encrypt shots before storing in sessionStorage — plaintext data URLs never written
  useEffect(() => {
    if (!shotsLoaded) return;
    if (shots.length === 0) {
      sessionStorage.removeItem('ps_shots');
      return;
    }
    if (user?.id) {
      encryptShots(shots, user.id).then((encrypted) => {
        try { sessionStorage.setItem('ps_shots', encrypted); } catch {}
      }).catch(() => {
        // Last-resort fallback: store as JSON (should not normally happen)
        try { sessionStorage.setItem('ps_shots', JSON.stringify(shots)); } catch {}
      });
    } else {
      // Pre-auth: store plain (session scoped, cleared on close)
      try { sessionStorage.setItem('ps_shots', JSON.stringify(shots)); } catch {}
    }
  }, [shots, user?.id, shotsLoaded]);
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

  const removeShot = (index: number) => {
    setShots(prev => prev.filter((_, i) => i !== index));
  };

  const removeShots = (indexes: number[]) => {
    setShots(prev => prev.filter((_, i) => !indexes.includes(i)));
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
    shots, addShot, removeShot, removeShots, clearShots,
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
