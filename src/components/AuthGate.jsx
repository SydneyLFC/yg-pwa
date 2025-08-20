'use client';

import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient'; // default export

type Props = { children: React.ReactNode };

export default function AuthGate({ children }: Props) {
  const [session, setSession] = useState<null | { user: { email?: string | null } }>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirect =
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT?.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession((data as any)?.session ?? null);
        setLoading(false);

        const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
          setSession(s ?? null);
          setLoading(false);
        });

        return () => sub.subscription.unsubscribe();
      } catch (e: any) {
        setError(e?.message || 'Auth failed to initialize.');
        setLoading(false);
      }
    }

    const cleanup = boot();
    return () => {
      isMounted = false;
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  async function handleSendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirect, shouldCreateUser: true },
      });
      if (err) throw err;
      alert('Magic link sent. Check your inbox.');
    } catch (e: any) {
      setError(e?.message || 'Could not send magic link.');
    } finally {
      setSending(false);
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch {}
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  if (!session) {
    return (
      <div style={{ padding: 24, maxWidth: 480 }}>
        <h2>Sign in</h2>
        <form onSubmit={handleSendMagicLink}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', marginTop: 8, padding: 8, width: '100%' }}
          />
          {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
          <button type="submit" disabled={sending} style={{ marginTop: 12 }}>
            {sending ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          Redirect: <code>{redirect || '—'}</code>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
        Signed in as <b>{session.user.email || 'member'}</b>
        <button onClick={handleSignOut} style={{ marginLeft: 12 }}>
          Sign out
        </button>
      </div>
      <main>{children}</main>
    </div>
  );
}