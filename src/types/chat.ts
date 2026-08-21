import type { UserRole } from './auth';

export interface ChatAuthor {
  id: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
}

export interface CommunityMessage {
  id: string;
  userId: string;
  room: string;
  content: string;
  createdAt: string;
  author: ChatAuthor;
  mine?: boolean;
}

export type ChatRoomId = 'general' | 'feedback' | 'ideas';

export interface ChatRoom {
  id: ChatRoomId;
  name: string;
  label?: string;
  description?: string;
}

export interface RateLimitStatus {
  isAllowed: boolean;
  cooldownRemainingSeconds: number;
  reason?: string;
}

export interface ContentValidationResult {
  isValid: boolean;
  error?: string;
  censoredText?: string;
}
