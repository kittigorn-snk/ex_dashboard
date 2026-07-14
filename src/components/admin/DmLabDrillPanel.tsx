"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

import { formatSex } from "@/lib/format";

type PatientItem = {
  hn: string;
  name: string | null;
  sex: string | null;
  pcuHcode: string;
  pcuName: string;
  hba1cExam: number;
  hba1cDay90: string | null;
  creatinineExam: number;
  creatinineDay90: string | null;
  ldlExam: number;
  ldlDay90: string | null;
};

type DmLabDrillPanelProps = {
  fiscalYear: number;
  pcu: string;
  bucket: string | null;
  onClose: () => void;
};

export default function DmLabDrillPanel({
  fiscalYear,
  pcu,
  bucket,
  onClose,
}: DmLabDrillPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [patients, setPatients] = useState<PatientItem[]>([]);

  useEffect(() => {
    if (!bucket) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = `/api/reports/dm-lab/patients?fy=${fiscalYear}&pcu=${encodeURIComponent(pcu)}&bucket=${encodeURIComponent(bucket)}`;

    fetch(url)
      .then(async (res) => {
        const data = (await res.json()) as {
          error?: string;
          label?: string;
          patients?: PatientItem[];
        };
        if (!res.ok) throw new Error(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
        if (cancelled) return;
        setLabel(data.label ?? "");
        setPatients(data.patients ?? []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bucket, fiscalYear, pcu]);

  if (!bucket) return null;

  const csvUrl = `/api/reports/dm-lab/patients?fy=${fiscalYear}&pcu=${encodeURIComponent(pcu)}&bucket=${encodeURIComponent(bucket)}&format=csv`;

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">รายชื่อผู้ป่วย</h3>
          <p className="mt-1 text-sm text-muted">
            {label || "กำลังโหลด..."}
            {!loading && ` · ${patients.length.toLocaleString("th-TH")} ราย`}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={csvUrl}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            Export กลุ่มนี้
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted hover:bg-[var(--input-bg)] hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
            ปิด
          </button>
        </div>
      </div>

      {loading && <p className="py-8 text-center text-sm text-muted">กำลังโหลดรายชื่อ...</p>}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && patients.length === 0 && (
        <p className="py-8 text-center text-sm text-muted">ไม่พบผู้ป่วยในหมวดนี้</p>
      )}

      {!loading && !error && patients.length > 0 && (
        <div className="max-h-[420px] overflow-auto rounded-xl border border-primary-100">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-primary-50">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold text-primary-900">HN</th>
                <th className="px-3 py-2.5 text-left font-semibold text-primary-900">ชื่อ-สกุล</th>
                <th className="px-3 py-2.5 text-left font-semibold text-primary-900">เพศ</th>
                <th className="px-3 py-2.5 text-left font-semibold text-primary-900">รพ.สต.</th>
                <th className="px-3 py-2.5 text-right font-semibold text-primary-900">HbA1c</th>
                <th className="px-3 py-2.5 text-right font-semibold text-primary-900">Cr</th>
                <th className="px-3 py-2.5 text-right font-semibold text-primary-900">LDL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divider)]">
              {patients.map((p) => (
                <tr key={p.hn} className="hover:bg-primary-50/50">
                  <td className="px-3 py-2 font-mono text-xs text-foreground">{p.hn}</td>
                  <td className="px-3 py-2 text-foreground">{p.name ?? "-"}</td>
                  <td className="px-3 py-2 text-muted">{formatSex(p.sex)}</td>
                  <td className="px-3 py-2 text-xs text-muted">{p.pcuName}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">
                    {p.hba1cExam}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">
                    {p.creatinineExam}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{p.ldlExam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
