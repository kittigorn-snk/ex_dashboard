import { FlaskConical } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    href: "/reports/dm-lab",
    title: "LAB DM ศรีนคร",
    description: "HbA1c / Creatinine / LDL · KPI · แยก รพ.สต. · Export · เปรียบเทียบปีงบ",
    icon: FlaskConical,
    badge: "ปี 2569",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary-900">รายงาน</h2>
          <p className="mt-1 text-sm text-muted">เลือกรายงานที่ต้องการดู</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="glass-card group block p-6 transition hover:border-primary-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/15">
                  <Icon className="h-5 w-5 text-primary-500" strokeWidth={2} />
                </div>
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                  {report.badge}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground group-hover:text-primary-600">
                {report.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{report.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
