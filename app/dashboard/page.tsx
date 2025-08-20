'use client';

import AuthGate from '@/components/AuthGate';

export default function DashboardPage() {
  return (
    <AuthGate>
      <main style={{ padding: 16 }}>
        <h1 style={{ marginBottom: 8 }}>YaraGlow – Mobile Dashboard</h1>
        <p>Signed-in placeholder. Replace with trackers next.</p>
      </main>
    </AuthGate>
  );
}