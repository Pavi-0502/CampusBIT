import type { Notification as AppNotification } from '../types';

/**
 * Browser notification helper using standard Notification API
 * Safe: handles denied permissions and unsupported environments gracefully
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.warn('Browser notification permission error:', err);
    return 'denied';
  }
}

export function sendBrowserNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (e) {
      console.warn('Could not dispatch browser notification:', e);
    }
  }
}
