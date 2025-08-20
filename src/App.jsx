import { useEffect, useMemo, useState } from "react";
import supabase from "./lib/supabaseClient";

/* ---------------- helpers ---------------- */
const todayISO = () => new Date().toISOString().slice(0, 10);
const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const avg = (arr) => (arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : "—");

function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return { r: 0, n: 0 };
  const x = xs.slice(-n);
  const y = ys.slice(-n);
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = mean(x);
  const my = mean(y);
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return { r: 0, n };
  return { r: num / Math.sqrt(dx * dy), n };
}

/* ---------------- UI bits ---------------- */
function Card({ title, action, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Sparkline({ data = [], width = 140, height = 40, strokeWidth = 2, className = "" }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const norm = (v) => (max === min ? 0.5 : (v - min) / (max - min));
  const step = width / (data.length - 1);
  let d = "";
  data.forEach((v, i) => {
    const x = i * step;
    const y = height - norm(v) * height;
    d += `${i === 0 ? "M" : "L"} ${x} ${y} `;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

/* Heatmap: month grid for a single metric (e.g., hot_flashes) */
function HeatmapCalendar({ entries = [], metric = "hot_flashes", monthDate = new Date() }) {
  // Build the days of the month
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const map = new Map(entries.map((e) => [e.log_date, e]));
  const days = [];
  for (let d = 1; d <= end.getDate(); d++) {
    const iso = new Date(monthDate.getFullYear(), monthDate.getMonth(), d)
      .toISOString()
      .slice(0, 10);
    days.push({
      iso,
      value: Number(map.get(iso)?.[metric] ?? 0),
    });
  }
  const vals = days.map((d) => d.value);
  const max = Math.max(1, ...vals);
  const scale = (v) => (v <= 0 ? "#eef2ff" : `hsl(${220 - (v / max) * 140} 85% 60%)`);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">
          {monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </div>
        <div className="text-xs text-slate-500">Intensity of {metric.replace("_", " ")}</div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <div
            key={d.iso}
            title={`${formatDate(d.iso)} · ${d.value}`}
            className="aspect-square w-full rounded-md border border-slate-200"
            style={{ background: scale(d.value) }}
          />
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-400">Click a day from the table to jump and edit.</div>
    </div>
  );
}

/* Natural-language correlation hints */
function buildCorrelationHints(data) {
  const rules = [
    {
      trigger: "alcohol_units",
      thr: 2,
      triggerLabel: "≥2 alcohol units",
      outcome: "hot_flashes",
      outcomeLabel: "hot flashes",
    },
    {
      trigger: "caffeine_cups",
      thr: 3,
      triggerLabel: "≥3 cups of caffeine",
      outcome: "sleep_hours",
      outcomeLabel: "sleep hours",
    },
    {
      trigger: "stress_1_10",
      thr: 7,
      triggerLabel: "stress ≥7",
      outcome: "mood",
      outcomeLabel: "mood score",
    },
  ];

  const hints = [];
  const last30 = data.slice(-30);
  for (let rule of rules) {
    const hi = last30.filter((d) => Number(d[rule.trigger] ?? 0) >= rule.thr);
    const lo = last30.filter((d) => Number(d[rule.trigger] ?? 0) < rule.thr);
    if (hi.length >= 3 && lo.length >= 3) {
      const avgHi =
        hi.reduce((s, d) => s + Number(d[rule.outcome] ?? 0), 0) / Math.max(1, hi.length);
      const avgLo =
        lo.reduce((s, d) => s + Number(d[rule.outcome] ?? 0), 0) / Math.max(1, lo.length);
      if (avgLo !== 0) {
        const pct = ((avgHi - avgLo) / Math.abs(avgLo)) * 100;
        const dir = pct > 0 ? "higher" : "lower";
        hints.push(
          `On days with ${rule.triggerLabel}, ${rule.outcomeLabel} is ${Math.abs(pct).toFixed(
            0
          )}% ${dir}.`
        );
      }
    }
  }
  return hints;
}

/* ---------------- main app ---------------- */
export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [range, setRange] = useState(30);
  const [monthView, setMonthView] = useState(new Date());

  // form (today)
  const [form, setForm] = useState({
    log_date: todayISO(),
    phase: "Perimenopause",
    energy: 6,
    mood: 6,
    sleep_hours: 7,
    hot_flashes: 2,
    symptoms: { night_sweats: false, brain_fog: false, anxiety: false, joint_pain: false },
    hrt: false,
    notes: "",
    alcohol_units: 0,
    caffeine_cups: 0,
    room_temp_c: 20,
    stress_1_10: 4,
    exercise_minutes: 0,
  });

  /* ----------- supabase: session + load ----------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: true });
      if (!error && data) {
        setEntries(data);
        // prefill today's form with existing row if present
        const today = data.find((r) => r.log_date === todayISO());
        if (today) setForm({ ...today, symptoms: today.symptoms ?? form.symptoms });
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /* ----------- derived: filtered series ----------- */
  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (range - 1));
    return entries.filter((e) => {
      const inRange = new Date(e.log_date) >= cutoff;
      const inPhase = phaseFilter === "All" || e.phase === phaseFilter;
      return inRange && inPhase;
    });
  }, [entries, range, phaseFilter]);

  const series = useMemo(() => {
    return {
      labels: filtered.map((e) => formatDate(e.log_date)),
      energy: filtered.map((e) => Number(e.energy ?? 0)),
      mood: filtered.map((e) => Number(e.mood ?? 0)),
      sleep: filtered.map((e) => Number(e.sleep_hours ?? 0)),
      hot: filtered.map((e) => Number(e.hot_flashes ?? 0)),
      alcohol: filtered.map((e) => Number(e.alcohol_units ?? 0)),
      caffeine: filtered.map((e) => Number(e.caffeine_cups ?? 0)),
      stress: filtered.map((e) => Number(e.stress_1_10 ?? 0)),
      exercise: filtered.map((e) => Number(e.exercise_minutes ?? 0)),
    };
  }, [filtered]);

  /* ----------- save / upsert ----------- */
  async function saveEntry(e) {
    e?.preventDefault?.();
    if (!user) return;
    const payload = {
      ...form,
      user_id: user.id,
      log_date: form.log_date,
      symptoms: form.symptoms ?? {},
    };
    const { data, error } = await supabase
      .from("daily_logs")
      .upsert(payload, { onConflict: "user_id,log_date" })
      .select("*");
    if (!error && data) {
      // refresh local entries
      const row = data[0];
      const next = [...entries.filter((r) => !(r.user_id === row.user_id && r.log_date === row.log_date)), row]
        .sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
      setEntries(next);
    }
  }

  /* ----------- quick trackers (one-tap) ----------- */
  const inc = (key, step = 1) => {
    const value = Number(form[key] ?? 0) + step;
    const next = { ...form, [key]: value };
    setForm(next);
  };
  const setVal = (key, value) => setForm({ ...form, [key]: value });

  /* ----------- trigger impact mini-card ----------- */
  const impactRows = useMemo(() => {
    const last = filtered.slice(-30);
    const pairs = [
      { t: "alcohol_units", o: "hot_flashes", tLabel: "Alcohol", oLabel: "Hot flashes" },
      { t: "caffeine_cups", o: "sleep_hours", tLabel: "Caffeine", oLabel: "Sleep hours" },
      { t: "stress_1_10", o: "mood", tLabel: "Stress", oLabel: "Mood" },
      { t: "exercise_minutes", o: "sleep_hours", tLabel: "Exercise", oLabel: "Sleep hours" },
    ];
    return pairs.map((p) => {
      const xs = last.map((d) => Number(d[p.t] ?? 0));
      const ys = last.map((d) => Number(d[p.o] ?? 0));
      const { r, n } = pearson(xs, ys);
      return { ...p, r, n };
    });
  }, [filtered]);

  const hints = useMemo(() => buildCorrelationHints(entries), [entries]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-slate-600">Loading…</div>
      </div>
    );
  }

  const userLabel = user?.user_metadata?.full_name || user?.email || "member";
  const todayRow = entries.find((e) => e.log_date === form.log_date);

  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-fuchsia-500" />
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold tracking-tight text-slate-800">
                YaraGlow • Inner Health
              </h1>
              <span className="text-xs text-slate-500">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Hi, {userLabel}</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
            >
              <option>All</option>
              <option>Pre-menopause</option>
              <option>Perimenopause</option>
              <option>Menopause</option>
              <option>Post-menopause</option>
            </select>
            <div className="rounded-xl border border-slate-200 bg-white p-1 text-sm">
              {[7, 30, 90].map((n) => (
                <button
                  key={n}
                  onClick={() => setRange(n)}
                  className={`rounded-lg px-3 py-1 ${
                    range === n ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {n}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* hero stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Avg Energy">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-semibold text-slate-900">{avg(series.energy)}</span>
              <Sparkline data={series.energy} className="text-emerald-500" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Scale 1–10</p>
          </Card>

          <Card title="Avg Mood">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-semibold text-slate-900">{avg(series.mood)}</span>
              <Sparkline data={series.mood} className="text-indigo-500" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Scale 1–10</p>
          </Card>

          <Card title="Hot Flashes / day">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-semibold text-slate-900">{avg(series.hot)}</span>
              <Sparkline data={series.hot} className="text-rose-500" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Lower is better</p>
          </Card>

          <Card title="Sleep (hours)">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-semibold text-slate-900">{avg(series.sleep)}</span>
              <Sparkline data={series.sleep} className="text-sky-500" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Avg last {range} days</p>
          </Card>
        </section>

        {/* quick trackers */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card title="Quick Trackers">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => inc("alcohol_units", 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
              >
                +1 Alcohol (now {form.alcohol_units})
              </button>
              <button
                onClick={() => inc("caffeine_cups", 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
              >
                +1 Caffeine (now {form.caffeine_cups})
              </button>
              <button
                onClick={() => inc("exercise_minutes", 10)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
              >
                +10 min Exercise (now {form.exercise_minutes})
              </button>
              <div className="ml-1 flex items-center gap-2">
                <span className="text-sm text-slate-600">Stress</span>
                {[3, 5, 7, 9].map((s) => (
                  <button
                    key={s}
                    onClick={() => setVal("stress_1_10", s)}
                    className={`rounded-md px-2 py-1 text-xs ${
                      form.stress_1_10 === s
                        ? "bg-fuchsia-600 text-white"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="ml-1 flex items-center gap-2">
                <span className="text-sm text-slate-600">Room °C</span>
                <input
                  type="number"
                  value={form.room_temp_c}
                  onChange={(e) => setVal("room_temp_c", Number(e.target.value))}
                  className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm"
                />
              </div>
              <button
                onClick={saveEntry}
                className="ml-auto rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Save trackers
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              One-taps update today’s row. Edit details in the form below.
            </p>
          </Card>

          {/* Trigger Impact mini-card */}
          <Card title="Trigger Impact (r)">
            <div className="space-y-2">
              {impactRows.map((row, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">
                    {row.tLabel} ↔ {row.oLabel}
                  </span>
                  <span
                    className={`font-medium ${
                      row.r > 0.15 ? "text-rose-600" : row.r < -0.15 ? "text-emerald-600" : "text-slate-600"
                    }`}
                    title={`n=${row.n}`}
                  >
                    {row.r.toFixed(2)}
                  </span>
                </div>
              ))}
              <p className="pt-1 text-xs text-slate-400">
                Pearson r over your last 30 days. Associations, not medical advice.
              </p>
            </div>
          </Card>

          {/* Correlation Hints (NEW) */}
          <Card title="Correlation Hints">
            <div className="space-y-1">
              {hints.length ? (
                hints.slice(0, 4).map((h, idx) => (
                  <p key={idx} className="text-sm text-slate-700">
                    {h}
                  </p>
                ))
              ) : (
                <p className="text-sm text-slate-500">Not enough recent data for hints.</p>
              )}
              <p className="pt-1 text-xs text-slate-400">
                Based on the last 30 days. Hints are observational and for awareness only.
              </p>
            </div>
          </Card>
        </section>

        {/* grid: quick entry + heatmap + timeline */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* quick entry form */}
          <Card
            title={todayRow ? "Update Today" : "Quick Entry (Today)"}
            action={
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {formatDate(form.log_date)}
              </span>
            }
          >
            <form onSubmit={saveEntry} className="grid grid-cols-2 gap-4">
              <label className="col-span-2 flex items-center gap-2 text-sm text-slate-700">
                <span className="w-28">Phase</span>
                <select
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
                  value={form.phase}
                  onChange={(e) => setForm({ ...form, phase: e.target.value })}
                >
                  <option>Pre-menopause</option>
                  <option>Perimenopause</option>
                  <option>Menopause</option>
                  <option>Post-menopause</option>
                </select>
              </label>

              {[
                ["energy", "Energy (1–10)", 0, 10],
                ["mood", "Mood (1–10)", 0, 10],
                ["sleep_hours", "Sleep (hours)", 3, 12],
                ["hot_flashes", "Hot flashes", 0, 10],
              ].map(([key, label, min, max]) => (
                <label key={key} className="col-span-1 text-sm text-slate-700">
                  <span className="mb-1 block">{label}</span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                    className="w-full accent-fuchsia-600"
                  />
                  <div className="mt-1 text-xs text-slate-600">{form[key]}</div>
                </label>
              ))}

              <fieldset className="col-span-2">
                <legend className="mb-2 text-sm font-medium text-slate-700">Symptoms</legend>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                  {Object.keys(form.symptoms).map((k) => (
                    <label key={k} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.symptoms[k]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            symptoms: { ...form.symptoms, [k]: e.target.checked },
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
                      />
                      <span className="capitalize">{k.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* triggers inline */}
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block">Alcohol units</span>
                  <input
                    type="number"
                    value={form.alcohol_units}
                    onChange={(e) => setForm({ ...form, alcohol_units: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block">Caffeine cups</span>
                  <input
                    type="number"
                    value={form.caffeine_cups}
                    onChange={(e) => setForm({ ...form, caffeine_cups: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block">Room temp (°C)</span>
                  <input
                    type="number"
                    value={form.room_temp_c}
                    onChange={(e) => setForm({ ...form, room_temp_c: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block">Exercise (minutes)</span>
                  <input
                    type="number"
                    value={form.exercise_minutes}
                    onChange={(e) =>
                      setForm({ ...form, exercise_minutes: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>

              <label className="col-span-2 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.hrt}
                  onChange={(e) => setForm({ ...form, hrt: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
                />
                On HRT today
              </label>

              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="col-span-2 h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />

              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {todayRow ? "Save changes" : "Add entry"}
                </button>
              </div>
            </form>
          </Card>

          {/* Heatmap calendar */}
          <Card
            title="Heatmap Calendar"
            action={
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() =>
                    setMonthView(
                      new Date(monthView.getFullYear(), monthView.getMonth() - 1, 1)
                    )
                  }
                  className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setMonthView(
                      new Date(monthView.getFullYear(), monthView.getMonth() + 1, 1)
                    )
                  }
                  className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                >
                  ›
                </button>
              </div>
            }
          >
            <HeatmapCalendar entries={entries} metric="hot_flashes" monthDate={monthView} />
          </Card>

          {/* timeline table */}
          <Card title={`Recent Entries (${filtered.length})`}>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-slate-500">
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Phase</th>
                    <th className="px-2 py-2">Energy</th>
                    <th className="px-2 py-2">Mood</th>
                    <th className="px-2 py-2">Sleep</th>
                    <th className="px-2 py-2">Hot&nbsp;Flashes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice()
                    .reverse()
                    .map((e) => (
                      <tr key={e.log_date} className="border-t border-slate-100">
                        <td className="px-2 py-2 text-slate-700">{formatDate(e.log_date)}</td>
                        <td className="px-2 py-2 text-slate-600">{e.phase}</td>
                        <td className="px-2 py-2">{e.energy}</td>
                        <td className="px-2 py-2">{e.mood}</td>
                        <td className="px-2 py-2">{e.sleep_hours}h</td>
                        <td className="px-2 py-2">{e.hot_flashes}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* footer note */}
        <p className="mt-8 text-center text-xs text-slate-500">
          YaraGlow demo • Track symptoms, mood, energy & labs over time. Not medical advice.
        </p>
      </main>
    </div>
  );
}