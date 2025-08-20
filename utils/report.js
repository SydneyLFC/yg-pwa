// src/utils/report.js
const css = `
  :root { --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --brand:#f0abfc; }
  * { box-sizing:border-box; }
  body { font-family: ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial; color:var(--ink); margin:0; }
  .wrap { padding:24px; max-width:900px; margin:0 auto; }
  h1 { margin:0 0 8px; font-size:24px; }
  h2 { margin:24px 0 8px; font-size:16px; }
  p,li,td,th { font-size:12px; line-height:1.5; }
  .muted { color:var(--muted); }
  .grid { display:grid; gap:12px; grid-template-columns: repeat(4,1fr); }
  .card { border:1px solid var(--line); border-radius:12px; padding:12px; }
  .kpi { font-size:22px; font-weight:700; }
  .tag { display:inline-block; border:1px solid var(--line); border-radius:999px; padding:2px 8px; font-size:11px; margin-right:6px; }
  table { width:100%; border-collapse:collapse; }
  th,td { border-top:1px solid var(--line); padding:6px 8px; text-align:left; }
  .brand { color:#a21caf; }
  @media print {
    .noprint { display:none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

const fmt = (d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const avg = (arr) => (arr.length ? (arr.reduce((a,b)=>a+(Number(b)||0),0)/arr.length).toFixed(1) : "—");

export function openPrintableReport({ memberEmail, range, entries, kits }) {
  const start = entries[0]?.date, end = entries.at(-1)?.date;

  const energy = avg(entries.map(e=>e.energy));
  const mood = avg(entries.map(e=>e.mood));
  const sleep = avg(entries.map(e=>e.sleep_hours));
  const flashes = avg(entries.map(e=>e.hot_flashes));

  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) return;

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>YaraGlow Health Report</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="wrap">
        <div class="noprint" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <button onclick="window.print()" style="padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;cursor:pointer">Print / Save PDF</button>
          <span class="muted">Tip: Choose “Save as PDF” in the print dialog.</span>
        </div>

        <h1>YaraGlow • Health Summary</h1>
        <p class="muted">${memberEmail || "Member"} · Range: last ${range} days${start && end ? ` · ${fmt(start)} – ${fmt(end)}` : ""}</p>

        <div class="grid">
          <div class="card"><div class="muted">Avg Energy</div><div class="kpi">${energy}</div><div class="muted">scale 1–10</div></div>
          <div class="card"><div class="muted">Avg Mood</div><div class="kpi">${mood}</div><div class="muted">scale 1–10</div></div>
          <div class="card"><div class="muted">Avg Sleep</div><div class="kpi">${sleep}h</div><div class="muted">hours/night</div></div>
          <div class="card"><div class="muted">Hot Flashes</div><div class="kpi">${flashes}</div><div class="muted">per day (avg)</div></div>
        </div>

        <h2>Hormone Kits</h2>
        <div class="card">
          ${
            kits?.length
              ? `<table><thead><tr><th>Date</th><th>E2 (pg/mL)</th><th>P4 (ng/mL)</th><th>T (ng/dL)</th><th>Notes</th></tr></thead>
                 <tbody>
                   ${kits.map(k => `<tr>
                     <td>${fmt(k.sample_date)}</td>
                     <td>${k.estradiol_pg_ml ?? ""}</td>
                     <td>${k.progesterone_ng_ml ?? ""}</td>
                     <td>${k.testosterone_ng_dl ?? ""}</td>
                     <td>${k.notes ?? ""}</td>
                   </tr>`).join("")}
                 </tbody></table>`
              : `<p class="muted">No kits in this period.</p>`
          }
        </div>

        <h2>Daily Logs (recent)</h2>
        <div class="card">
          ${
            entries?.length
              ? `<table><thead><tr><th>Date</th><th>Phase</th><th>Energy</th><th>Mood</th><th>Sleep</th><th>Hot Flashes</th></tr></thead>
                 <tbody>
                   ${entries.slice().reverse().slice(0, 30).map(e => `<tr>
                     <td>${fmt(e.date)}</td>
                     <td>${e.phase || ""}</td>
                     <td>${e.energy ?? ""}</td>
                     <td>${e.mood ?? ""}</td>
                     <td>${e.sleep_hours ?? ""}</td>
                     <td>${e.hot_flashes ?? ""}</td>
                   </tr>`).join("")}
                 </tbody></table>`
              : `<p class="muted">No logs recorded in this range.</p>`
          }
        </div>

        <p class="muted" style="margin-top:16px">
          *This report is informational and not medical advice. Consult a clinician for interpretation.
        </p>
      </div>
      <script>window.focus()</script>
    </body>
  </html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}