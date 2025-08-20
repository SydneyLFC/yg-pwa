// src/components/CycleQuickAdd.jsx
import { useState } from "react";

export default function CycleQuickAdd({ onAddBleedStart, onAddSpotting, saving }) {
  const [isBleeding, setIsBleeding] = useState(false);
  const [flow, setFlow] = useState("medium");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-slate-700">Cycle log</span>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
            checked={isBleeding}
            onChange={(e) => setIsBleeding(e.target.checked)}
          />
          Bleeding today
        </label>

        {isBleeding ? (
          <select
            value={flow}
            onChange={(e) => setFlow(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
          >
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="heavy">Heavy</option>
          </select>
        ) : null}

        <button
          onClick={() => {
            if (isBleeding) onAddBleedStart?.(date, flow);
            else onAddSpotting?.(date);
          }}
          disabled={saving}
          className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : isBleeding ? "Add bleed" : "Add spotting"}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Logging bleeds helps your dashboard estimate cycle day and suggest a stage. You can override at any time.
      </p>
    </div>
  );
}