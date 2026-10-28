import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format relative remaining time
 */
export function formatTimeRemaining(endsAt: string): {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;
  isExpired: boolean;
} {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) {
    return {
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isUrgent: false,
      isExpired: true,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const isUrgent = totalSeconds < 3600; // Less than 1 hour

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    isUrgent,
    isExpired: false,
  };
}

export function formatCompactCountdown(endsAt: string): string {
  const { isExpired, days, hours, minutes, seconds } = formatTimeRemaining(endsAt);
  if (isExpired) return 'Ended';
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m ${seconds}s left`;
}

/**
 * Generates an anonymous pseudonym for a bidder (e.g. "Bidder #4092" or "Knight-92")
 * to guarantee privacy per Section 4D:
 * "Do not reveal private account details, email addresses or sensitive profile information in public bid history."
 */
export function generatePseudonym(userId: string, salt: string = 'campus'): string {
  let hash = 0;
  const str = userId + salt;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const adjectives = ['Swift', 'Clever', 'Keen', 'Bright', 'Noble', 'Brave', 'Sharp', 'Zen'];
  const nouns = ['Scholar', 'Falcon', 'Tiger', 'Rover', 'Owl', 'Pioneer', 'Wizard', 'Knight'];
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 3) % nouns.length;
  const num = Math.abs(hash % 900) + 100;
  return `${adjectives[adjIndex]} ${nouns[nounIndex]} #${num}`;
}
