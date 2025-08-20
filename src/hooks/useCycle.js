// src/hooks/useCycle.js
import { useEffect, useMemo, useState, useCallback } from "react";
import supabase from "../lib/supabaseClient";

const todayISO = () => new Date().toISOString().slice(0, 10);

function sortByDateAsc(a, b) {
  return a.event_date.localeCompare(b.event_date);
}

export default function useCycle(session) {
  const userId = session?.user?.id ?? null;

  const [events, setEvents] = useState([]);          // cycle_events
  const [status, setStatus] = useState(null);        // from cycle_status_view
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // load last 400 days of events + view
  useEffect(() => {
    let abort = false;
    async function load() {
      if (!userId || !supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const since = new Date();
        since.setDate(since.getDate() - 400);
        const sinceISO = since.toISOString().slice(0, 10);

        const { data: ev, error: evErr } = await supabase
          .from("cycle_events")
          .select("id,event_date,event_type,flow,note,created_at")
          .gte("event_date", sinceISO)
          .eq("user_id", userId)
          .order("event_date", { ascending: true });

        if (evErr) throw evErr;

        const { data: st, error: stErr } = await supabase
          .from("cycle_status_view")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (stErr) throw stErr;

        if (!abort) {
          setEvents(ev || []);
          setStatus(st || null);
        }
      } catch (e) {
        if (!abort) setError(e.message || String(e));
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => { abort = true; };
  }, [userId]);

  // compute cycle day (days since last bleed_start, capped at 200)
  const cycleDay = useMemo(() => {
    if (!events.length) return null;
    const starts = events.filter(e => e.event_type === "bleed_start");
    if (!starts.length) return null;
    const lastStart = starts[starts.length - 1].event_date;
    const d0 = new Date(lastStart);
    const d1 = new Date(todayISO());
    const diff = Math.round((d1 - d0) / 86400000) + 1; // start day = 1
    return diff > 0 ? Math.min(diff, 200) : null;
  }, [events]);

  const suggestedStage = status?.suggested_stage ?? "Unknown";
  const daysSinceLastBleed = status?.days_since_last_bleed ?? null;

  // add an event
  const addEvent = useCallback(async ({ event_date, event_type, flow = null, note = "" }) => {
    if (!userId || !supabase) return { error: "Not authenticated" };
    setSaving(true);
    setError(null);
    try {
      const { data, error: insErr } = await supabase
        .from("cycle_events")
        .insert([{ user_id: userId, event_date, event_type, flow, note }])
        .select();

      if (insErr) throw insErr;

      // refresh local state cheaply
      setEvents(prev => {
        const next = [...prev, ...(data || [])].sort(sortByDateAsc);
        return next;
      });

      // refresh status view (light fetch)
      const { data: st, error: stErr } = await supabase
        .from("cycle_status_view")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!stErr) setStatus(st || null);

      return { data };
    } catch (e) {
      setError(e.message || String(e));
      return { error: e.message || String(e) };
    } finally {
      setSaving(false);
    }
  }, [userId]);

  return {
    loading,
    saving,
    error,

    events,
    status,
    cycleDay,
    suggestedStage,
    daysSinceLastBleed,

    addBleedStart: (date, flow = "medium") => addEvent({ event_date: date || todayISO(), event_type: "bleed_start", flow }),
    addSpotting:   (date) => addEvent({ event_date: date || todayISO(), event_type: "spotting" }),
    addProcedure:  (date, note = "") => addEvent({ event_date: date || todayISO(), event_type: "procedure", note }),

    reloadNow: async () => {
      // simple re‑fire by changing dependency: call setEvents to trigger useEffect? Better: encapsulate load here
      // keep minimal: caller can refresh by navigating; optional for v1
    }
  };
}