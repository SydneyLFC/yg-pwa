// src/components/Toaster.jsx
import { useEffect, useState } from "react";

export default function Toaster() {
  return <div id="toast-root" className="fixed bottom-6 right-6 z-50 space-y-2" />;
}

export function useToast() {
  const [container, setContainer] = useState(null);
  useEffect(() => {
    setContainer(document.getElementById("toast-root"));
  }, []);
  return {
    show(msg, variant = "default", timeout = 2800) {
      if (!container) return;
      const node = document.createElement("div");
      node.className = `rounded-xl border px-3 py-2 text-sm shadow-md bg-white/95 border-slate-200 ${
        variant === "success" ? "text-emerald-700 border-emerald-200 bg-emerald-50" :
        variant === "warn" ? "text-amber-700 border-amber-200 bg-amber-50" :
        variant === "error" ? "text-rose-700 border-rose-200 bg-rose-50" :
        "text-slate-700"
      }`;
      node.textContent = msg;
      container.appendChild(node);
      setTimeout(() => container.removeChild(node), timeout);
    }
  };
}