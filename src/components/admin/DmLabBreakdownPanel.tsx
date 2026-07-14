"use client";

import type { BreakdownItem } from "@/lib/queries/dm-lab-snk";

type DmLabBreakdownPanelProps = {
  title: string;
  subtitle?: string;
  total: number;
  items: BreakdownItem[];
  accent?: "primary" | "emerald" | "amber";
  activeKey?: string | null;
  onSelect?: (key: string) => void;
};

const accentBar: Record<NonNullable<DmLabBreakdownPanelProps["accent"]>, string> = {
  primary: "bg-primary-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

export default function DmLabBreakdownPanel({
  title,
  subtitle,
  total,
  items,
  accent = "primary",
  activeKey,
  onSelect,
}: DmLabBreakdownPanelProps) {
  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          {onSelect && (
            <p className="mt-1 text-xs text-muted">คลิกแถวเพื่อดูรายชื่อผู้ป่วย</p>
          )}
        </div>
        <span className="glass-input rounded-full px-3 py-1 text-xs font-semibold text-muted">
          ทั้งหมด {total.toLocaleString("th-TH")} ราย
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-primary-100">
        <table className="w-full text-sm">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">หมวด</th>
              <th className="px-4 py-3 text-right font-semibold text-primary-900">จำนวน</th>
              <th className="px-4 py-3 text-right font-semibold text-primary-900">เปอร์เซ็นต์</th>
              <th className="hidden px-4 py-3 sm:table-cell" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--divider)]">
            {items.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <tr
                  key={item.key}
                  className={`transition ${
                    onSelect ? "cursor-pointer hover:bg-primary-50/80" : "hover:bg-primary-50/50"
                  } ${isActive ? "bg-primary-50" : ""}`}
                  onClick={() => onSelect?.(item.key)}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.label}
                    {isActive && (
                      <span className="ml-2 text-xs font-normal text-primary-500">กำลังดู</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {item.count.toLocaleString("th-TH")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-primary-600">
                    {item.percent.toLocaleString("th-TH", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                    %
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="h-2 overflow-hidden rounded-full bg-primary-100">
                      <div
                        className={`h-full rounded-full ${accentBar[accent]}`}
                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
