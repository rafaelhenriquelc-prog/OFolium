import '@/lib/installLocalStorage';

const NOTIFICATIONS_ENABLED_KEY = 'ofolium.notificationsEnabled';

function getStorage(): Storage | null {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    return globalThis.localStorage;
  }

  return null;
}

export function readNotificationsEnabled(): boolean {
  const storage = getStorage();
  if (!storage) return true;

  const value = storage.getItem(NOTIFICATIONS_ENABLED_KEY);
  if (value === null) return true;

  return value === 'true';
}

export function writeNotificationsEnabled(enabled: boolean): void {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
}
