'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RulesContent } from '@/components/RulesContent';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function GameRulesPage() {
  const router = useRouter();
  const { getGameCode } = useLocalStorage();
  useEffect(() => {
    if (!getGameCode()) router.replace('/play');
  }, [getGameCode, router]);
  return <RulesContent fromGame />;
}
