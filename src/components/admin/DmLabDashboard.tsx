"use client";

import { FlaskConical, Users } from "lucide-react";
import { useState } from "react";

import DmLabBreakdownPanel from "@/components/admin/DmLabBreakdownPanel";
import DmLabDrillPanel from "@/components/admin/DmLabDrillPanel";
import DmLabFilters from "@/components/admin/DmLabFilters";
import DmLabKpiCards from "@/components/admin/DmLabKpiCards";
import type { DmLabSnkSummary } from "@/lib/queries/dm-lab-snk";

type DmLabDashboardProps = {
  summary: DmLabSnkSummary;
  previous?: DmLabSnkSummary | null;
  years: number[];
};

function Delta({ current, previous }: { current: number; previous?: number }) {
  if (previous == null) return null;
  const diff = current - previous;
  if (diff === 0) return <span className="text-xs text-muted"> (±0)</span>;
  const color = diff > 0 ? "text-emerald-600" : "text-red-600";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {" "}
      ({diff > 0 ? "+" : ""}
      {diff.toLocaleString("th-TH", { maximumFractionDigits: 1 })})
    </span>
  );
}

function KpiCompareRow({
  label,
  current,
  previous,
}: {
  label: string;
  current: number;
  previous?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--input-bg)] px-4 py-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm tabular-nums text-foreground">
        {current.toLocaleString("th-TH", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
        <Delta current={current} previous={previous} />
      </p>
    </div>
  );
}

export default function DmLabDashboard({ summary, previous, years }: DmLabDashboardProps) {
  const [activeBucket, setActiveBucket] = useState<string | null>(null);

  const tested = (examNone: number) => summary.totalPatients - examNone;
  const prevTested = (examNone: number, total: number) => total - examNone;

  return (
    <div className="space-y-6">
      <DmLabFilters
        fiscalYear={summary.fiscalYear}
        pcu={summary.pcuHcode}
        compare={Boolean(previous)}
        years={years}
      />

      {(summary.fromCache || summary.cachedAt) && (
        <p className="text-xs text-muted">
          {summary.fromCache ? "ข้อมูลจาก cache" : "ดึงข้อมูลใหม่แล้ว"}
          {summary.cachedAt &&
            ` · อัปเดตล่าสุด ${new Date(summary.cachedAt).toLocaleString("th-TH")}`}
          {" · cache 1 ชั่วโมง · กดรีเฟรชเพื่อดึงใหม่"}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500/15">
            <Users className="h-5 w-5 text-primary-500" strokeWidth={2} />
          </div>
          <p className="mt-4 text-sm font-medium text-muted">ผู้ป่วย DM ทั้งหมด</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {summary.totalPatients.toLocaleString("th-TH")}
            <Delta current={summary.totalPatients} previous={previous?.totalPatients} />
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15">
            <FlaskConical className="h-5 w-5 text-emerald-500" strokeWidth={2} />
          </div>
          <p className="mt-4 text-sm font-medium text-muted">HbA1c ตรวจแล้ว</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {tested(summary.hba1c.exam.items[0]?.count ?? 0).toLocaleString("th-TH")}
            {previous && (
              <Delta
                current={tested(summary.hba1c.exam.items[0]?.count ?? 0)}
                previous={prevTested(
                  previous.hba1c.exam.items[0]?.count ?? 0,
                  previous.totalPatients,
                )}
              />
            )}
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15">
            <FlaskConical className="h-5 w-5 text-amber-500" strokeWidth={2} />
          </div>
          <p className="mt-4 text-sm font-medium text-muted">Creatinine ตรวจแล้ว</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {tested(summary.creatinine.exam.items[0]?.count ?? 0).toLocaleString("th-TH")}
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15">
            <FlaskConical className="h-5 w-5 text-red-600 dark:text-red-400" strokeWidth={2} />
          </div>
          <p className="mt-4 text-sm font-medium text-muted">LDL ตรวจแล้ว</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {tested(summary.ldl.exam.items[0]?.count ?? 0).toLocaleString("th-TH")}
          </p>
        </div>
      </div>

      <DmLabKpiCards items={summary.kpi} />

      {previous && (
        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-foreground">
            เปรียบเทียบปีงบ {summary.fiscalYear} กับ {previous.fiscalYear}
          </h3>
          <p className="mt-1 text-sm text-muted">ค่าในวงเล็บ = ส่วนต่าง (% จุด / จำนวน)</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {summary.kpi.map((kpi) => {
              const prevKpi = previous.kpi.find((k) => k.id === kpi.id);
              return (
                <KpiCompareRow
                  key={kpi.id}
                  label={kpi.label}
                  current={kpi.value}
                  previous={prevKpi?.value}
                />
              );
            })}
          </div>
        </div>
      )}

      {summary.pcuHcode === "all" && summary.pcuBreakdown.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-foreground">แยกตาม รพ.สต. / ตำบล</h3>
          <p className="mt-1 text-sm text-muted">เลือกจากตัวกรองด้านบนเพื่อเจาะลึกแต่ละพื้นที่</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-primary-100">
            <table className="w-full text-sm">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-primary-900">หน่วยบริการ</th>
                  <th className="px-4 py-3 text-right font-semibold text-primary-900">จำนวน</th>
                  <th className="px-4 py-3 text-right font-semibold text-primary-900">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divider)]">
                {summary.pcuBreakdown.map((row) => (
                  <tr key={row.hcode} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 text-foreground">{row.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.count.toLocaleString("th-TH")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary-600">
                      {row.percent.toLocaleString("th-TH", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DmLabDrillPanel
        fiscalYear={summary.fiscalYear}
        pcu={summary.pcuHcode}
        bucket={activeBucket}
        onClose={() => setActiveBucket(null)}
      />

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">HbA1c (provis_labcode 0531601)</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <DmLabBreakdownPanel
            title="ตรวจ HbA1c"
            subtitle="แยกตามจำนวนครั้งที่ตรวจในปีงบประมาณ"
            total={summary.hba1c.exam.total}
            items={summary.hba1c.exam.items}
            accent="primary"
            activeKey={activeBucket}
            onSelect={setActiveBucket}
          />
          <DmLabBreakdownPanel
            title="HbA1c day90"
            subtitle="ช่วงห่างระหว่างการตรวจ 2 ครั้งล่าสุด"
            total={summary.hba1c.day90.total}
            items={summary.hba1c.day90.items}
            accent="emerald"
            activeKey={activeBucket}
            onSelect={setActiveBucket}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">Creatinine (provis_labcode 0581902)</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <DmLabBreakdownPanel
            title="ตรวจ Creatinine"
            subtitle="แยกตามจำนวนครั้งที่ตรวจในปีงบประมาณ"
            total={summary.creatinine.exam.total}
            items={summary.creatinine.exam.items}
            accent="primary"
            activeKey={activeBucket}
            onSelect={setActiveBucket}
          />
          <DmLabBreakdownPanel
            title="Creatinine day90"
            subtitle="ช่วงห่างระหว่างการตรวจ 2 ครั้งล่าสุด"
            total={summary.creatinine.day90.total}
            items={summary.creatinine.day90.items}
            accent="emerald"
            activeKey={activeBucket}
            onSelect={setActiveBucket}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">LDL (provis_labcode 0541402)</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <DmLabBreakdownPanel
            title="ตรวจ LDL"
            subtitle="แยกตามจำนวนครั้งที่ตรวจในปีงบประมาณ"
            total={summary.ldl.exam.total}
            items={summary.ldl.exam.items}
            accent="primary"
            activeKey={activeBucket}
            onSelect={setActiveBucket}
          />
          <DmLabBreakdownPanel
            title="LDL day90"
            subtitle="ช่วงห่างระหว่างการตรวจ 2 ครั้งล่าสุด"
            total={summary.ldl.day90.total}
            items={summary.ldl.day90.items}
            accent="emerald"
            activeKey={activeBucket}
            onSelect={setActiveBucket}
          />
        </div>
      </section>

      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-foreground">หมายเหตุ</h3>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted">
          <li>
            ข้อมูลจาก query RLU_DM_SNK แบบ3 — ผู้ป่วย clinic 001, อ.ศรีนคร (chwpart=64, amppart=08)
          </li>
          <li>
            <strong>day90</strong>: Null = คำนวณช่วงห่างไม่ได้ · ≤90 วัน = ค่า Y · ≥90 วัน = ค่า N
          </li>
          <li>คลิกแถวในตารางเพื่อดูรายชื่อ HN และ Export CSV ของกลุ่มนั้น</li>
          <li>ผล query ถูก cache 1 ชั่วโมง — กด &quot;รีเฟรชข้อมูล&quot; เมื่อต้องการข้อมูลล่าสุด</li>
        </ul>
      </div>
    </div>
  );
}
