import type { RateLimitStatus } from '@/types/chat';

export interface RateLimiterOptions {
  minIntervalMs?: number;
  burstWindowMs?: number;
  maxBurstCount?: number;
  duplicateWindowMs?: number;
}

export class ChatRateLimiter {
  private minIntervalMs: number;
  private burstWindowMs: number;
  private maxBurstCount: number;
  private duplicateWindowMs: number;

  private sendTimestamps: number[] = [];
  private lastMessageContent: string = '';
  private lastMessageTimestamp: number = 0;

  constructor(options: RateLimiterOptions = {}) {
    this.minIntervalMs = options.minIntervalMs ?? 2500;
    this.burstWindowMs = options.burstWindowMs ?? 15000;
    this.maxBurstCount = options.maxBurstCount ?? 5;
    this.duplicateWindowMs = options.duplicateWindowMs ?? 30000;
  }

  public checkRateLimit(currentContent?: string): RateLimitStatus {
    const now = Date.now();

    if (this.sendTimestamps.length > 0) {
      const lastSend = this.sendTimestamps[this.sendTimestamps.length - 1];
      const elapsed = now - lastSend;
      if (elapsed < this.minIntervalMs) {
        const remainingMs = this.minIntervalMs - elapsed;
        const cooldownRemainingSeconds = Math.ceil(remainingMs / 1000);
        return {
          isAllowed: false,
          cooldownRemainingSeconds,
          reason: `Slow down! Please wait ${cooldownRemainingSeconds}s before sending another message.`,
        };
      }
    }

    this.sendTimestamps = this.sendTimestamps.filter(ts => now - ts < this.burstWindowMs);

    if (this.sendTimestamps.length >= this.maxBurstCount) {
      const oldestInWindow = this.sendTimestamps[0];
      const waitTimeMs = this.burstWindowMs - (now - oldestInWindow);
      const cooldownRemainingSeconds = Math.ceil(waitTimeMs / 1000);
      return {
        isAllowed: false,
        cooldownRemainingSeconds,
        reason: `You are sending messages too quickly. Please wait ${cooldownRemainingSeconds}s.`,
      };
    }

    if (
      currentContent &&
      this.lastMessageContent &&
      currentContent.trim().toLowerCase() === this.lastMessageContent.trim().toLowerCase() &&
      now - this.lastMessageTimestamp < this.duplicateWindowMs
    ) {
      const remainingMs = this.duplicateWindowMs - (now - this.lastMessageTimestamp);
      const cooldownRemainingSeconds = Math.ceil(remainingMs / 1000);
      return {
        isAllowed: false,
        cooldownRemainingSeconds,
        reason: 'Duplicate message detected. Please wait before repeating the same message.',
      };
    }

    return {
      isAllowed: true,
      cooldownRemainingSeconds: 0,
    };
  }

  public recordMessageSent(content: string): void {
    const now = Date.now();
    this.sendTimestamps.push(now);
    this.lastMessageContent = content;
    this.lastMessageTimestamp = now;
  }

  public getCooldownSeconds(): number {
    return this.checkRateLimit().cooldownRemainingSeconds;
  }
}

export const globalChatRateLimiter = new ChatRateLimiter();
