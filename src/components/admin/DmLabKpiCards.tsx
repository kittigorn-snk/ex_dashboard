import type { KpiItem } from "@/lib/queries/dm-lab-snk";
import { Target } from "lucide-react";

type DmLabKpiCardsProps = {
  items: KpiItem[];
};

export default function DmLabKpiCards({ items }: DmLabKpiCardsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-primary-500" strokeWidth={2} />
        <h3 className="text-lg font-bold text-foreground">KPI เป้าหมาย</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((kpi) => (
          <div key={kpi.id} className="glass-card p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted">{kpi.label}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                  kpi.met
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-amber-500/15 text-amber-600"
                }`}
              >
                {kpi.met ? "ผ่าน" : "ยังไม่ถึง"}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {kpi.value.toLocaleString("th-TH", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              %
            </p>
            <p className="mt-1 text-xs text-muted">
              เป้า {kpi.target}% · {kpi.numerator.toLocaleString("th-TH")}/
              {kpi.denominator.toLocaleString("th-TH")} ราย
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-100">
              <div
                className={`h-full rounded-full ${kpi.met ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(kpi.value, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
