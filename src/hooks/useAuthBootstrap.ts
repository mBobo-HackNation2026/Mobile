import { useEffect } from 'react';

import { useAuthStore } from '@/store/useAuthStore';

/** Jednorazowa inicjalizacja sesji przy starcie aplikacji. */
export function useAuthBootstrap() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const phase = useAuthStore((s) => s.phase);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return phase;
}
