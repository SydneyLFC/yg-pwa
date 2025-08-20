'use client';

import React from 'react';

type Props = { metric: string };

export default function SparklineWithOverlay({ metric }: Props) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium capitalize text-neutral-700">{metric}</h3>
        <span className="text-xs text-neutral-500">(stub)</span>
      </div>
      <div className="mt-3 h-16 w-full rounded bg-neutral-100" aria-hidden />
      <p className="mt-2 text-xs text-neutral-500">
        Sparkline + overlay analysis will render here.
      </p>
    </div>
  );
}