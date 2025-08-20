'use client';

import React from 'react';

export default function CycleCalendar() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-medium text-neutral-700">Cycle calendar</h3>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-neutral-600">
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className="rounded border bg-neutral-50 py-3"
            aria-label={`Day ${i + 1}`}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-neutral-500">(Stub) Replace with real calendar component.</p>
    </div>
  );
}