'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

type Ping = {
  authReachable: boolean | null;
  authMessage: string;
  tableName: string;
  tablePingResult: 'idle' | 'ok' | 'error';
  tablePingMessage: string;
};

export default function TestSupabasePage() {
  const [ping, setPing] = useState<Ping>({
    authReachable: null,
    authMessage: 'Waiting…',
    tableName: '',
    tablePingResult: 'idle',
    tablePingMessage: '',
  });

  // Basic connectivity check: can we hit the auth endpoint?
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          setPing((p) => ({
            ...p,
            authReachable: false,
            authMessage: `Auth check failed: ${error.message}`,
          }));
        } else {
          // If data comes back (even with null session), the client and env are wired
          setPing((p) => ({
            ...p,
            authReachable: true,
            authMessage:
              data?.session
                ? 'Auth reachable (active session present)'
                : 'Auth reachable (no session, which is fine)',
          }));
        }
      } catch (e: any) {
        if (!mounted) return;
        setPing((p) => ({
          ...p,
          authReachable: false,
          authMessage: `Auth probe threw: ${e?.message || e}`,
        }));
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleTablePing(e: React.FormEvent) {
    e.preventDefault();
    if (!ping.tableName.trim()) return;

    setPing((p) => ({
      ...p,
      tablePingResult: 'idle',
      tablePingMessage: 'Querying…',
    }));

    try {
      // NOTE: this will only succeed if the table exists and RLS allows anon read
      const { data, error } = await supabase
        .from(ping.tableName.trim())
        .select('*')
        .limit(1);

      if (error) {
        setPing((p) => ({
          ...p,
          tablePingResult: 'error',
          tablePingMessage: `Select failed: ${error.message}`,
        }));
      } else {
        setPing((p) => ({
          ...p,
          tablePingResult: 'ok',
          tablePingMessage: `OK. Sample: ${JSON.stringify(data ?? [], null, 0)}`,
        }));
      }
    } catch (e: any) {
      setPing((p) => ({
        ...p,
        tablePingResult: 'error',
        tablePingMessage: `Query threw: ${e?.message || e}`,
      }));
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Supabase Connectivity Check</h1>
      <p style={{ color: '#555', marginBottom: 16 }}>
        This page verifies your <code>supabase-js</code> client wiring and environment variables.
      </p>

      <section style={{ padding: 16, border: '1px solid #eee', borderRadius: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Auth Probe</h2>
        <div>
          <strong>Status:</strong>{' '}
          {ping.authReachable === null ? '—' : ping.authReachable ? 'Reachable ✅' : 'Unreachable ❌'}
        </div>
        <div style={{ marginTop: 6, color: ping.authReachable ? '#066a37' : '#a40000' }}>{ping.authMessage}</div>
        <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
          Using:
          <ul style={{ marginTop: 6, paddingLeft: 18 }}>
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
            <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
          </ul>
          Ensure these are set in <code>.env.local</code> and the dev server was restarted.
        </div>
      </section>

      <section style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
        <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Optional: Table Read Test</h2>
        <p style={{ marginTop: 0, color: '#555' }}>
          Enter a table name (e.g. <code>profiles</code>) that exists and is readable by the anon role (RLS).
        </p>

        <form onSubmit={handleTablePing}>
          <input
            placeholder="table name"
            value={ping.tableName}
            onChange={(e) => setPing((p) => ({ ...p, tableName: e.target.value }))}
            style={{
              padding: 8,
              borderRadius: 8,
              border: '1px solid #ddd',
              width: 240,
              marginRight: 8,
            }}
          />
          <button type="submit" style={{ padding: '8px 12px', borderRadius: 8 }}>
            Ping table
          </button>
        </form>

        {ping.tablePingMessage && (
          <div
            style={{
              marginTop: 10,
              color:
                ping.tablePingResult === 'ok' ? '#066a37' :
                ping.tablePingResult === 'error' ? '#a40000' : '#555',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {ping.tablePingMessage}
          </div>
        )}
      </section>

      <div style={{ marginTop: 18, fontSize: 12, color: '#666' }}>
        Tip: If table reads fail with RLS errors, add a policy in Supabase like “Anon can select limit 1 for diagnostics”
        and remove it after testing.
      </div>
    </div>
  );
}