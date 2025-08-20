'use client';

import React from 'react';

export default function MedsPanel() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-medium text-neutral-700">Medications</h3>
      <ul className="mt-2 list-inside list-disc text-sm text-neutral-600">
        <li>(Stub) Estradiol — 1mg — Morning</li>
        <li>(Stub) Progesterone — 100mg — Night</li>
      </ul>
      <div className="mt-3">
        <button className="rounded-lg border px-3 py-1 text-sm">Add medication</button>
      </div>
    </div>
  );
}