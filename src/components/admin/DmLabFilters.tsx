"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, RefreshCw } from "lucide-react";

import { PCU_OPTIONS } from "@/lib/queries/dm-lab-constants";

type DmLabFiltersProps = {
  fiscalYear: number;
  pcu: string;
  compare: boolean;
  years: number[];
};

export default function DmLabFilters({
  fiscalYear,
  pcu,
  compare,
  years,
}: DmLabFiltersProps) {
  const router = useRouter();

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams();
    params.set("fy", String(fiscalYear));
    params.set("pcu", pcu);
    if (compare) params.set("compare", "1");

    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }

    router.push(`/reports/dm-lab?${params.toString()}`);
  }

  const exportUrl = `/api/reports/dm-lab/export?fy=${fiscalYear}&pcu=${encodeURIComponent(pcu)}`;
  const refreshUrl = `/reports/dm-lab?fy=${fiscalYear}&pcu=${encodeURIComponent(pcu)}${compare ? "&compare=1" : ""}&refresh=1`;

  return (
    <div className="glass-card flex flex-wrap items-end gap-4 p-4">
      <div>
        <label htmlFor="fy" className="mb-1.5 block text-xs font-semibold text-muted">
          ปีงบประมาณ
        </label>
        <select
          id="fy"
          value={fiscalYear}
          onChange={(e) => updateParams({ fy: e.target.value })}
          className="glass-input min-w-[140px] px-3 py-2 text-sm text-foreground"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pcu" className="mb-1.5 block text-xs font-semibold text-muted">
          รพ.สต. / ตำบล
        </label>
        <select
          id="pcu"
          value={pcu}
          onChange={(e) => updateParams({ pcu: e.target.value })}
          className="glass-input min-w-[220px] px-3 py-2 text-sm text-foreground"
        >
          {PCU_OPTIONS.map((opt) => (
            <option key={opt.hcode} value={opt.hcode}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      <label className="mb-1 flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={compare}
          onChange={(e) => updateParams({ compare: e.target.checked ? "1" : null })}
          className="h-4 w-4 rounded border-primary-300 text-primary-500 focus:ring-primary-500"
        />
        เปรียบเทียบปีก่อน
      </label>

      <div className="ml-auto flex flex-wrap gap-2">
        <Link
          href={refreshUrl}
          className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2} />
          รีเฟรชข้อมูล
        </Link>
        <a
          href={exportUrl}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-600"
        >
          <Download className="h-4 w-4" strokeWidth={2} />
          Export Excel (CSV)
        </a>
      </div>
    </div>
  );
}
