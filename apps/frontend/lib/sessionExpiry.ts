import { toast } from 'sonner';
import { clearGameSession } from '@/hooks/useLocalStorage';

export function expireSession(): void {
  if (typeof window === 'undefined') return;

  toast.error('Session expired', { description: 'Please rejoin the game.' });
  clearGameSession();
  setTimeout(() => { window.location.href = '/play'; }, 1500);
}
