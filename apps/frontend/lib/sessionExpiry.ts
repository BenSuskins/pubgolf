import { toast } from 'sonner';
import { STORAGE_KEYS } from '@/hooks/useLocalStorage';

export function expireSession(): void {
  if (typeof window === 'undefined') return;

  toast.error('Session expired', { description: 'Please rejoin the game.' });
  localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
  localStorage.removeItem(STORAGE_KEYS.GAME_CODE);
  setTimeout(() => { window.location.href = '/play'; }, 1500);
}
