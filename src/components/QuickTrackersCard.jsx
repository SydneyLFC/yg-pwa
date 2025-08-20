'use client';

import React from 'react';

export default function QuickTrackersCard() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-medium text-neutral-700">Quick trackers</h3>
      <p className="mt-2 text-sm text-neutral-500">
        (Stub) Add quick actions for mood, sleep, hot flashes, notes, etc.
      </p>
      <div className="mt-3 flex gap-2">
        <button className="rounded-lg border px-3 py-1 text-sm">+ Mood</button>
        <button className="rounded-lg border px-3 py-1 text-sm">+ Sleep</button>
        <button className="rounded-lg border px-3 py-1 text-sm">+ Symptom</button>
      </div>
    </div>
  );
}