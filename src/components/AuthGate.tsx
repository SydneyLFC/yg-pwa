"use client";

import { ReactNode, useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthed(!!data.session);
      setReady(true);
    };
    run();
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-10 text-slate-600">
        Checking session…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-10">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Sign in required</h2>
          <p className="mt-2 text-sm text-slate-600">
            Please sign in to view your dashboard.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}