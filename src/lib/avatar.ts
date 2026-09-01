export const AVATAR_BUCKET = 'avatars';

export const AVATAR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const AVATAR_ACCEPT_ATTRIBUTE = AVATAR_ALLOWED_MIME_TYPES.join(',');

export const AVATAR_MAX_FILE_BYTES = 3 * 1024 * 1024;
export const AVATAR_TARGET_SIZE_PX = 512;
export const AVATAR_MIN_DIMENSION_PX = 64;
export const AVATAR_MAX_PIXEL_AREA = 16_000_000;

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AVATAR_FILE_PATTERN = /^avatar-[A-Za-z0-9-]{12,80}\.webp$/;
const AVATAR_PUBLIC_PREFIX = `/storage/v1/object/public/${AVATAR_BUCKET}/`;

function getConfiguredSupabaseOrigin(): string | null {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) return null;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function createAvatarObjectId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function isSafeAvatarStoragePath(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 160) return false;

  const segments = trimmed.split('/');
  if (segments.length !== 2) return false;

  const [userIdSegment, fileSegment] = segments;
  return USER_ID_PATTERN.test(userIdSegment) && AVATAR_FILE_PATTERN.test(fileSegment);
}

export function normalizeAvatarStoragePath(value: unknown): string | undefined {
  if (!isSafeAvatarStoragePath(value)) return undefined;
  return value.trim();
}

export function buildAvatarStoragePath(userId: string): string {
  const trimmedUserId = userId.trim();
  if (!USER_ID_PATTERN.test(trimmedUserId)) {
    throw new Error('Invalid user ID for avatar upload path');
  }
  return `${trimmedUserId}/avatar-${createAvatarObjectId()}.webp`;
}

export function buildAvatarPublicUrl(storagePath: string): string | null {
  if (!isSafeAvatarStoragePath(storagePath)) return null;

  const origin = getConfiguredSupabaseOrigin();
  if (!origin) return null;

  return `${origin}${AVATAR_PUBLIC_PREFIX}${storagePath}`;
}

export function isTrustedAvatarUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;

    const configuredOrigin = getConfiguredSupabaseOrigin();
    if (configuredOrigin) {
      if (parsed.origin !== configuredOrigin) return false;
    } else if (!parsed.hostname.endsWith('.supabase.co')) {
      return false;
    }

    if (!parsed.pathname.startsWith(AVATAR_PUBLIC_PREFIX)) return false;

    const rawPath = parsed.pathname.slice(AVATAR_PUBLIC_PREFIX.length);
    const decodedPath = decodeURIComponent(rawPath);
    return isSafeAvatarStoragePath(decodedPath);
  } catch {
    return false;
  }
}

export function normalizeAvatarUrl(value: unknown): string | undefined {
  if (!isTrustedAvatarUrl(value)) return undefined;
  return value.trim();
}

export function extractAvatarStoragePathFromUrl(url: string): string | undefined {
  const normalizedUrl = normalizeAvatarUrl(url);
  if (!normalizedUrl) return undefined;

  try {
    const parsed = new URL(normalizedUrl);
    const rawPath = parsed.pathname.slice(AVATAR_PUBLIC_PREFIX.length);
    const decodedPath = decodeURIComponent(rawPath);
    return normalizeAvatarStoragePath(decodedPath);
  } catch {
    return undefined;
  }
}

export function normalizeAvatarFields(input: { avatarUrl?: unknown; avatarStoragePath?: unknown }): {
  avatarUrl?: string;
  avatarStoragePath?: string;
} {
  const directPath = normalizeAvatarStoragePath(input.avatarStoragePath);
  const pathFromUrl = typeof input.avatarUrl === 'string'
    ? extractAvatarStoragePathFromUrl(input.avatarUrl)
    : undefined;
  const storagePath = directPath ?? pathFromUrl;

  if (!storagePath) {
    return {};
  }

  const avatarUrl = buildAvatarPublicUrl(storagePath);
  if (!avatarUrl) {
    return {};
  }

  return {
    avatarUrl,
    avatarStoragePath: storagePath,
  };
}
