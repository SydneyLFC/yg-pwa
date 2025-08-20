// src/hooks/useHormoneKits.js
import { useCallback, useEffect, useRef, useState } from "react";
import supabase from "../lib/supabaseClient";

export function useHormoneKits() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kits, setKits] = useState([]);
  const live = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data?.user?.id ?? null);
    })();
    return () => { mounted = false; };
  }, []);

  const loadKits = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("hormone_kits")
      .select("id, sample_date, estradiol_pg_ml, progesterone_ng_ml, testosterone_ng_dl, notes")
      .eq("user_id", userId)
      .order("sample_date", { ascending: false });
    if (error) {
      console.error("[kits] load error:", error.message);
      setKits([]);
    } else {
      setKits(data ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId || live.current) return;
    live.current = true;
    loadKits();
    const ch = supabase
      .channel("kits_live")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "hormone_kits", filter: `user_id=eq.${userId}` },
        () => loadKits()
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [userId, loadKits]);

  const addKit = useCallback(async (kit) => {
    if (!userId) throw new Error("No user");
    const payload = {
      user_id: userId,
      sample_date: kit.sample_date,
      estradiol_pg_ml: kit.estradiol_pg_ml ?? null,
      progesterone_ng_ml: kit.progesterone_ng_ml ?? null,
      testosterone_ng_dl: kit.testosterone_ng_dl ?? null,
      notes: kit.notes ?? "",
    };
    const { error } = await supabase.from("hormone_kits").insert(payload);
    if (error) throw error;
  }, [userId]);

  const removeKit = useCallback(async (id) => {
    if (!userId) throw new Error("No user");
    const { error } = await supabase.from("hormone_kits").delete().eq("user_id", userId).eq("id", id);
    if (error) throw error;
  }, [userId]);

  return { loading, kits, addKit, removeKit };
}