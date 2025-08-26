'use client';

import React from 'react';

// value: number (0–100), label?: string

export default function ProgressRing({ value, label = 'Progress' }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="relative mx-auto h-24 w-24">
        <svg viewBox="0 0 36 36" className="h-full w-full">
          <path
            className="text-neutral-200"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"
          />
          <path
            className="text-emerald-500"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${clamped}, 100`}
            d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-sm font-medium">
          {clamped}%
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-neutral-600">{label}</p>
    </div>
  );
}