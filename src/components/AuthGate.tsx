// src/components/AuthGate.tsx
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';

type Props = {
  children: ReactNode;
  redirectTo?: string;
  loadingFallback?: ReactNode;
};

export default function AuthGate({
  children,
  redirectTo = '/login',
  loadingFallback = null,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    // initial check
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAuthed(false);
        setLoading(false);
        router.replace(redirectTo);
        return;
      }
      setAuthed(!!data.session);
      setLoading(false);
      if (!data.session) router.replace(redirectTo);
    });

    // subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const isAuthed = !!session;
      setAuthed(isAuthed);
      if (!isAuthed) router.replace(redirectTo);
    });

    return () => {
      active = false;
      // v2 returns { data: { subscription } }
      sub?.subscription?.unsubscribe?.();
    };
  }, [redirectTo, router]);

  if (loading) return <>{loadingFallback}</>;
  if (!authed) return null;
  return <>{children}</>;
}