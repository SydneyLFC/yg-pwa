// src/hooks/useDailyLogs.js
import { useCallback, useEffect, useRef, useState } from "react";
import supabase from "../lib/supabaseClient";

const toISO = (d) => new Date(d).toISOString().slice(0, 10);

export function useDailyLogs() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]); // [{ date, phase, energy, ... }]
  const loadingOnce = useRef(false);

  // get current user
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data?.user?.id ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // load logs for user
  const loadLogs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_logs")
      .select(
        `log_date, phase, energy, mood, sleep_hours, hot_flashes, symptoms, hrt, notes`
      )
      .eq("user_id", userId)
      .order("log_date", { ascending: true });

    if (error) {
      console.error("[daily_logs] load error:", error.message);
      setLogs([]);
    } else {
      setLogs(
        (data ?? []).map((r) => ({
          date: r.log_date, // map DB -> UI
          phase: r.phase,
          energy: r.energy,
          mood: r.mood,
          sleep_hours: r.sleep_hours,
          hot_flashes: r.hot_flashes,
          symptoms: r.symptoms || {
            night_sweats: false,
            brain_fog: false,
            anxiety: false,
            joint_pain: false,
          },
          hrt: !!r.hrt,
          notes: r.notes || "",
        }))
      );
    }
    setLoading(false);
  }, [userId]);

  // initial load + channel for realtime updates (optional)
  useEffect(() => {
    if (!userId || loadingOnce.current) return;
    loadingOnce.current = true;
    loadLogs();

    // optional: listen for changes (requires Realtime enabled on table)
    const ch = supabase
      .channel("daily_logs_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_logs", filter: `user_id=eq.${userId}` },
        () => loadLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, loadLogs]);

  // upsert a single day (by log_date)
  const upsertLog = useCallback(
    async (form) => {
      if (!userId) throw new Error("No user");
      const payload = {
        user_id: userId,
        log_date: form.date, // UI -> DB
        phase: form.phase,
        energy: form.energy,
        mood: form.mood,
        sleep_hours: form.sleep_hours,
        hot_flashes: form.hot_flashes,
        symptoms: form.symptoms ?? {},
        hrt: !!form.hrt,
        notes: form.notes ?? "",
      };

      // optimistic update
      setLogs((prev) => {
        const exists = prev.some((p) => p.date === form.date);
        const next = exists
          ? prev.map((p) => (p.date === form.date ? { ...form } : p))
          : [...prev, { ...form }];
        next.sort((a, b) => new Date(a.date) - new Date(b.date));
        return next;
      });

      const { error } = await supabase.from("daily_logs").upsert(payload, {
        onConflict: "user_id,log_date",
      });
      if (error) {
        console.error("[daily_logs] upsert error:", error.message);
        // reload to reconcile in case optimistic update was wrong
        await loadLogs();
        throw error;
      }
    },
    [userId, loadLogs]
  );

  return { userId, loading, logs, upsertLog, reload: loadLogs, todayISO: toISO(new Date()) };
}