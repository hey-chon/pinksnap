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
  latestStrip: string | null;
  setLatestStrip: (strip: string | null) => void;
}

const AppContext = createContext<AppState | null>(null);
const MAX_SAVED_MEMORIES = 50;

const isLayoutType = (value: unknown): value is LayoutType =>
  value === 'vertical-4' || value === 'quad-4' || value === 'horizontal-3';

import { encryptBlob, decryptBlob, encryptShots, decryptShots, encryptDataUrl, decryptDataUrl } from '@/lib/crypto';

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

    let uploadedToStorage = false;
    try {
      const { error: uploadError } = await supabase.storage
        .from('strips')
        .upload(storagePath, encryptedBlob, {
          contentType: 'application/octet-stream',
          upsert: true,
        });

      if (!uploadError) {
        uploadedToStorage = true;
      } else {
        console.warn('[PinkSnap Cloud] Storage bucket upload unavailable:', uploadError.message);
      }
    } catch (storageEx) {
      console.warn('[PinkSnap Cloud] Storage bucket upload exception:', storageEx);
    }

    let finalImageUrl = storagePath;
    let finalIvHex = ivHex;
    let finalSaltHex = saltHex;

    // If storage bucket was unavailable, encrypt dataUrl with AES-256-GCM directly for image_url
    if (!uploadedToStorage) {
      const enc = await encryptDataUrl(dataUrl, userId);
      finalImageUrl = `enc:${enc.ivHex}:${enc.saltHex}:${enc.ciphertextBase64}`;
      finalIvHex = enc.ivHex;
      finalSaltHex = enc.saltHex;
    }

    // Try inserting into memories table with encryption columns first
    const insertPayloadWithEnc: any = {
      id: memoryId,
      user_id: userId,
      image_url: finalImageUrl,
      layout,
      frame: typeof frame === 'string' ? frame : 'classic',
      filter: 'color',
      mime_type: mimeType,
      is_encrypted: true,
      encryption_iv: finalIvHex,
      encryption_salt: finalSaltHex,
    };

    let { error: insertError } = await supabase.from('memories').insert(insertPayloadWithEnc);

    // If memories table does not have is_encrypted column in schema cache, fallback to base columns
    if (insertError && (insertError.message?.includes('is_encrypted') || insertError.code === 'PGRST204')) {
      const insertPayloadLegacy = {
        id: memoryId,
        user_id: userId,
        image_url: finalImageUrl,
        layout,
        frame: typeof frame === 'string' ? frame : 'classic',
        filter: 'color',
        mime_type: mimeType,
      };
      const retry = await supabase.from('memories').insert(insertPayloadLegacy);
      insertError = retry.error;
    }

    if (insertError) {
      console.warn('[PinkSnap Cloud] Insert notice:', insertError.message);
      if (uploadedToStorage) {
        await supabase.storage.from('strips').remove([storagePath]).catch(() => {});
      }
    }

    // Always return local dataUrl for instant flicker-free rendering for the owner
    return dataUrl;
  } catch (err) {
    console.error('[PinkSnap Cloud] Upload exception:', err);
    return dataUrl;
  }
}

/**
 * Fetch and decrypt memories for a given user from the Supabase `memories` table.
 * Every photo strip is decrypted on-the-fly in the browser with AES-256-GCM.
 */
async function fetchCloudMemories(userId: string): Promise<Memory[]> {
  try {
    let queryResult: any = await supabase
      .from('memories')
      .select('id, image_url, layout, frame, mime_type, created_at, is_encrypted, encryption_iv, encryption_salt')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_SAVED_MEMORIES);

    // If is_encrypted column does not exist in schema, fallback to available columns
    if (queryResult.error && (queryResult.error.message?.includes('is_encrypted') || queryResult.error.code === '42703')) {
      queryResult = await supabase
        .from('memories')
        .select('id, image_url, layout, frame, mime_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_SAVED_MEMORIES);
    }

    if (queryResult.error) {
      console.warn('[PinkSnap Cloud] Fetch notice:', queryResult.error.message);
      return [];
    }

    const decryptedMemories: Memory[] = [];

    for (const row of queryResult.data || []) {
      let displayUrl = row.image_url;

      try {
        if (displayUrl.startsWith('enc:')) {
          // Encrypted payload stored in image_url: enc:ivHex:saltHex:ciphertextBase64
          const parts = displayUrl.split(':');
          if (parts.length >= 4) {
            const ivHex = parts[1];
            const saltHex = parts[2];
            const ciphertextBase64 = parts.slice(3).join(':');
            displayUrl = await decryptDataUrl(ciphertextBase64, ivHex, saltHex, userId, row.mime_type || 'image/jpeg');
          }
        } else if (displayUrl && !displayUrl.startsWith('data:') && !displayUrl.startsWith('http://') && !displayUrl.startsWith('https://')) {
          let storagePath = displayUrl;
          if (storagePath.includes('/strips/')) {
            storagePath = storagePath.split('/strips/')[1].split('?')[0];
          }

          const { data: cipherBlob, error: dlError } = await supabase.storage
            .from('strips')
            .download(storagePath);

          if (!dlError && cipherBlob) {
            const decryptedBlob = await decryptBlob(
              cipherBlob,
              userId,
              row.encryption_iv,
              row.encryption_salt
            );
            displayUrl = URL.createObjectURL(decryptedBlob);
          } else if (storagePath.includes('.enc')) {
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
    await supabase.storage.from('strips').remove([encPath, legacyPath]).catch(() => {});

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
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [layout, setLayout] = useState<LayoutType>(() => (sessionStorage.getItem('ps_layout') as LayoutType) || 'vertical-4');
  const [frame, setFrame] = useState<FrameType>(() => (sessionStorage.getItem('ps_frame') as FrameType) || 'classic');
  const [filter, setFilter] = useState<FilterType>(() => (sessionStorage.getItem('ps_filter') as FilterType) || 'color');
  const [shots, setShots] = useState<string[]>([]);
  const [shotsLoaded, setShotsLoaded] = useState(false);
  const [latestStrip, setLatestStrip] = useState<string | null>(null);

  // Decrypt shots and latest strip from sessionStorage on mount (once auth status is resolved)
  useEffect(() => {
    if (shotsLoaded) return;
    if (isAuthLoading) return; // Wait until auth state is determined!

    const rawShots = sessionStorage.getItem('ps_shots');
    const rawStrip = sessionStorage.getItem('ps_latest_strip');

    if (!rawShots) {
      setShotsLoaded(true);
    } else if (user?.id) {
      decryptShots(rawShots, user.id).then((decrypted) => {
        if (Array.isArray(decrypted) && decrypted.length > 0) {
          setShots(decrypted);
        } else {
          try {
            const parsed = JSON.parse(rawShots);
            if (Array.isArray(parsed)) setShots(parsed);
          } catch {}
        }
        setShotsLoaded(true);
      }).catch(() => {
        try {
          const parsed = JSON.parse(rawShots);
          if (Array.isArray(parsed)) setShots(parsed);
        } catch {}
        setShotsLoaded(true);
      });
    } else {
      // Pre-auth shots
      try {
        const parsed = JSON.parse(rawShots);
        if (Array.isArray(parsed)) setShots(parsed);
      } catch {}
      setShotsLoaded(true);
    }

    // Restore latestStrip if available in session
    if (rawStrip) {
      try {
        const parsed = JSON.parse(rawStrip);
        if (parsed.encrypted && user?.id) {
          decryptDataUrl(
            parsed.encrypted.ciphertextBase64,
            parsed.encrypted.ivHex,
            parsed.encrypted.saltHex,
            user.id,
            parsed.encrypted.mimeType || 'image/jpeg'
          ).then(decryptedUrl => {
            setLatestStrip(decryptedUrl);
          }).catch(() => {});
        } else if (typeof parsed.url === 'string') {
          setLatestStrip(parsed.url);
        } else if (typeof parsed === 'string') {
          setLatestStrip(parsed);
        }
      } catch {
        if (typeof rawStrip === 'string' && rawStrip.startsWith('data:image/')) {
          setLatestStrip(rawStrip);
        }
      }
    }
  }, [user?.id, isAuthLoading, shotsLoaded]);

  useEffect(() => sessionStorage.setItem('ps_layout', layout), [layout]);
  useEffect(() => sessionStorage.setItem('ps_frame', frame), [frame]);
  useEffect(() => sessionStorage.setItem('ps_filter', filter), [filter]);

  // Encrypt shots before storing in sessionStorage — plaintext data URLs never written unencrypted
  useEffect(() => {
    if (!shotsLoaded) return;
    if (!Array.isArray(shots) || shots.length === 0) {
      return;
    }
    if (user?.id) {
      encryptShots(shots, user.id).then((encrypted) => {
        try { sessionStorage.setItem('ps_shots', encrypted); } catch {}
      }).catch(() => {
        try { sessionStorage.setItem('ps_shots', JSON.stringify(shots)); } catch {}
      });
    } else {
      try { sessionStorage.setItem('ps_shots', JSON.stringify(shots)); } catch {}
    }
  }, [shots, user?.id, shotsLoaded]);

  // Persist latest strip securely in sessionStorage whenever updated
  useEffect(() => {
    if (!latestStrip) return;
    if (user?.id) {
      encryptDataUrl(latestStrip, user.id).then(enc => {
        try {
          sessionStorage.setItem('ps_latest_strip', JSON.stringify({
            url: latestStrip,
            encrypted: enc,
          }));
        } catch {}
      }).catch(() => {
        try { sessionStorage.setItem('ps_latest_strip', latestStrip); } catch {}
      });
    } else {
      try { sessionStorage.setItem('ps_latest_strip', latestStrip); } catch {}
    }
  }, [latestStrip, user?.id]);

  const [savedMemories, setSavedMemories] = useState<Memory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);

  // Track the user ID we last fetched for to avoid stale data
  const lastFetchedUserId = useRef<string | null>(null);

  // Fetch memories from the cloud whenever the authenticated user changes
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setSavedMemories([]);
      lastFetchedUserId.current = null;
      return;
    }

    if (lastFetchedUserId.current === user.id) return;

    let cancelled = false;
    setIsLoadingMemories(true);

    fetchCloudMemories(user.id).then((memories) => {
      if (!cancelled) {
        setSavedMemories(prev => {
          // Merge newly fetched memories with optimistic local memories
          const ids = new Set(memories.map(m => m.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...localOnly, ...memories].slice(0, MAX_SAVED_MEMORIES);
        });
        lastFetchedUserId.current = user.id;
        setIsLoadingMemories(false);
      }
    });

    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  const addShot = useCallback((shot: string) => {
    if (typeof shot === 'string' && shot.startsWith('data:image/')) {
      setShots(prev => [...prev, shot]);
    }
  }, []);

  const removeShot = useCallback((index: number) => {
    setShots(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removeShots = useCallback((indexes: number[]) => {
    setShots(prev => prev.filter((_, i) => !indexes.includes(i)));
  }, []);

  const clearShots = useCallback(() => {
    setShots([]);
    try { sessionStorage.removeItem('ps_shots'); } catch {}
  }, []);

  const saveMemory = useCallback(async (memory: Memory): Promise<boolean> => {
    setIsSavingMemory(true);

    // 1. ALWAYS optimistically add to local state immediately so receipt & gallery never lose it
    const memoryToSave: Memory = {
      ...memory,
      date: memory.date || Date.now(),
    };

    setSavedMemories(prev => [memoryToSave, ...prev.filter(m => m.id !== memory.id)].slice(0, MAX_SAVED_MEMORIES));
    setLatestStrip(memoryToSave.url);

    // 2. Upload to Supabase cloud with zero-knowledge AES-256-GCM encryption if authenticated
    if (user?.id) {
      try {
        await uploadStripToCloud(
          user.id,
          memoryToSave.id,
          memoryToSave.url,
          memoryToSave.layout,
          memoryToSave.frame,
          memoryToSave.mimeType || 'image/jpeg',
        );
      } catch (cloudErr) {
        console.warn('[PinkSnap Cloud] Cloud sync notice:', cloudErr);
      }
    }

    setIsSavingMemory(false);
    return true;
  }, [user?.id]);

  const deleteMemory = useCallback((id: string) => {
    setSavedMemories(prev => prev.filter(m => m.id !== id));
    if (latestStrip && savedMemories[0]?.id === id) {
      setLatestStrip(null);
      try { sessionStorage.removeItem('ps_latest_strip'); } catch {}
    }

    if (!user?.id) return;
    const memory = savedMemories.find(m => m.id === id);
    if (!memory) return;

    deleteCloudMemory(user.id, id, memory.url).catch(() => {});
  }, [user?.id, savedMemories, latestStrip]);

  const value: AppState = {
    layout, setLayout,
    frame, setFrame,
    filter, setFilter,
    shots, addShot, removeShot, removeShots, clearShots,
    savedMemories, saveMemory, deleteMemory,
    isLoadingMemories, isSavingMemory,
    latestStrip, setLatestStrip,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
