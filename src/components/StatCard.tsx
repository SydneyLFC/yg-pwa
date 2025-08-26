import { LucideIcon } from "lucide-react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  tone = "ok",
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  tone?: "ok" | "warn";
}) {
  const ring =
    tone === "ok"
      ? "ring-emerald-200 bg-emerald-50 text-emerald-800"
      : "ring-amber-200 bg-amber-50 text-amber-800";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${ring}`}>
          <Icon className="h-3.5 w-3.5" />
          {title}
        </span>
      </div>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}