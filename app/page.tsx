// app/test-supabase/page.tsx
"use client";

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

type Ping = {
  authReachable: boolean | null;
};

export default function TestSupabasePage() {
  const [ping, setPing] = useState<Ping>({ authReachable: null });

  useEffect(() => {
    (async () => {
      try {
        // simple “ping”: list auth providers or signIn URL check etc.
        const { data, error } = await supabase.auth.getSession();
        setPing({ authReachable: error ? false : true });
      } catch {
        setPing({ authReachable: false });
      }
    })();
  }, []);

  return <pre>{JSON.stringify(ping, null, 2)}</pre>;
}