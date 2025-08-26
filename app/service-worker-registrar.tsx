// app/service-worker-registrar.tsx
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    const isSecure =
      typeof window !== "undefined" &&
      (window.location.protocol === "https:" || window.location.hostname === "localhost");

    if ("serviceWorker" in navigator && isSecure) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
    }
  }, []);

  return null;
}