import { useState, useCallback } from 'react';

export function useAnnouncementRegion() {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string) => {
    setAnnouncement('');
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  return { announcement, announce };
}
