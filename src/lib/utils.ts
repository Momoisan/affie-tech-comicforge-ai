import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = 'cf'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Sanitizes user-supplied text to reduce prompt-injection risk before
 * embedding into AI system/user prompts or structured outputs.
 */
export function sanitizeUserText(input: string, maxLength = 3000): string {
  const trimmed = input.trim().slice(0, maxLength);
  // Strip control characters and common prompt-override markers
  return trimmed
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/(ignore\s+(all\s+)?previous\s+instructions|system\s*:|<\s*\/?\s*system\s*>)/gi, '[filtered]');
}

const PROHIBITED_PATTERNS: RegExp[] = [
  /\b(csam|child\s+sexual|explicit\s+minor)\b/i,
  /\b(self-harm\s+instruction|how\s+to\s+build\s+a\s+bomb)\b/i,
  /\b(non-consensual\s+sexual|deepfake\s+nude)\b/i,
];

export interface ContentPolicyResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Explicit content safety check supporting legitimate fictional storytelling
 * while blocking prohibited harmful content.
 */
export function checkContentPolicy(text: string): ContentPolicyResult {
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: 'Content violates safety policy for prohibited harmful material.',
      };
    }
  }
  return { allowed: true };
}

export function formatDateShort(iso: string, locale: 'ms-MY' | 'en' = 'ms-MY'): string {
  try {
    return new Intl.DateTimeFormat(locale === 'ms-MY' ? 'ms-MY' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
