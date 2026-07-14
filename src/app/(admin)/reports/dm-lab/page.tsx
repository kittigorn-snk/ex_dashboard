import Link from "next/link";

import DmLabDashboard from "@/components/admin/DmLabDashboard";
import { clearDmLabCache, getDmLabSnkSummary } from "@/lib/queries/dm-lab-snk";
import { DM_LAB_FISCAL_YEARS, DEFAULT_FISCAL_YEAR } from "@/lib/queries/dm-lab-constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  fy?: string;
  pcu?: string;
  compare?: string;
  refresh?: string;
}>;

export default async function DmLabSnkReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const fiscalYear = Number(params.fy ?? DEFAULT_FISCAL_YEAR);
  const pcu = params.pcu ?? "all";
  const compare = params.compare === "1";
  const forceRefresh = params.refresh === "1";

  if (forceRefresh) clearDmLabCache();

  let summary = null;
  let previous = null;
  let error: string | null = null;

  try {
    summary = await getDmLabSnkSummary(fiscalYear, pcu, { forceRefresh });

    if (compare) {
      const prevYear = fiscalYear - 1;
      if (DM_LAB_FISCAL_YEARS[prevYear]) {
        previous = await getDmLabSnkSummary(prevYear, pcu);
      }
    }
  } catch {
    error = "ไม่สามารถดึงข้อมูลรายงาน LAB DM ได้ กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูล";
  }

  const years = Object.keys(DM_LAB_FISCAL_YEARS)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="horizon-hero relative mt-4 overflow-hidden px-6 pb-8 pt-5 sm:px-10 sm:pb-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <nav className="text-sm text-white/70">
            <Link href="/reports" className="hover:text-white">
              รายงาน
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-white">LAB DM ศรีนคร</span>
          </nav>
          <h2 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl">
            รายงานการตรวจ LAB DM โรงพยาบาลศรีนคร
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
            ประจำปีงบประมาณ {summary?.fiscalYear ?? fiscalYear}
            {summary ? ` (${summary.periodLabel})` : ""}
            · ผู้ป่วย DM clinic 001 อ.ศรีนคร จ.นครสวรรค์
            {summary && summary.pcuHcode !== "all" ? ` · ${summary.pcuName}` : ""}
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      {summary && (
        <DmLabDashboard summary={summary} previous={previous} years={years} />
      )}
    </div>
  );
}
