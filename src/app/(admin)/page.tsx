import {
  BedDouble,
  CalendarDays,
  Stethoscope,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import WeeklyOpdChart, { type WeeklyOpdPoint } from "@/components/admin/WeeklyOpdChart";
import { dbTypeLabel } from "@/lib/db/config";
import { checkDbHealth } from "@/lib/db/health";
import { formatTime } from "@/lib/format";
import {
  getAdmittedCount,
  getOfficerCount,
  getRecentActivities,
  getTodayAppointmentsCount,
  getTodayOpdCount,
  getWeeklyOpd,
  type WeeklyOpdRow,
} from "@/lib/queries/opd";

const THAI_DAY_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;

function toWeeklyChartData(rows: WeeklyOpdRow[]): WeeklyOpdPoint[] {
  return rows.map((row) => {
    const date = row.day instanceof Date ? row.day : new Date(String(row.day));
    const dayShort = THAI_DAY_SHORT[date.getDay()] ?? "?";
    const label = date.toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    return { day: dayShort, label, count: Number(row.count) };
  });
}

export default async function DashboardPage() {
  const dbHealth = await checkDbHealth();

  let todayOpd = 0;
  let todayAppointments = 0;
  let admitted = 0;
  let officers = 0;
  let weeklyOpd: WeeklyOpdPoint[] = [];
  let recentActivities: { time: string; text: string }[] = [];
  let dataError: string | null = null;

  try {
    const [opd, appt, ipd, off, weekly, activities] = await Promise.all([
      getTodayOpdCount(),
      getTodayAppointmentsCount(),
      getAdmittedCount(),
      getOfficerCount(),
      getWeeklyOpd(),
      getRecentActivities(10),
    ]);

    todayOpd = opd;
    todayAppointments = appt;
    admitted = ipd;
    officers = off;
    weeklyOpd = toWeeklyChartData(weekly);
    recentActivities = activities.map((a) => ({
      time: formatTime(a.time),
      text: a.text,
    }));
  } catch {
    dataError = "ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้";
  }

  const stats: {
    label: string;
    value: string;
    iconBg: string;
    iconColor: string;
    icon: LucideIcon;
  }[] = [
    {
      label: "ผู้ป่วยวันนี้",
      value: todayOpd.toLocaleString("th-TH"),
      iconBg: "bg-primary-500/15",
      iconColor: "text-primary-500",
      icon: Users,
    },
    {
      label: "นัดหมาย",
      value: todayAppointments.toLocaleString("th-TH"),
      iconBg: "bg-red-500/15",
      iconColor: "text-red-600 dark:text-red-400",
      icon: CalendarDays,
    },
    {
      label: "ผู้ป่วยใน (Admit)",
      value: admitted.toLocaleString("th-TH"),
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
      icon: BedDouble,
    },
    {
      label: "บุคลากร",
      value: officers.toLocaleString("th-TH"),
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
      icon: Stethoscope,
    },
  ];

  const weeklyTotal = weeklyOpd.reduce((sum, d) => sum + d.count, 0);
  const weeklyAvg = weeklyOpd.length > 0 ? Math.round(weeklyTotal / weeklyOpd.length) : 0;
  const weeklyPeak =
    weeklyOpd.length > 0
      ? weeklyOpd.reduce((max, d) => (d.count > max.count ? d : max))
      : { label: "-", count: 0 };

  return (
    <div className="space-y-6">
      <div className="horizon-hero relative mt-4 overflow-hidden px-6 pb-8 pt-5 sm:px-10 sm:pb-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-pink-400/20 blur-3xl" />
        <div className="relative max-w-xl">
          <nav className="text-sm text-white/70">
            <span>หน้าหลัก</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-white">แดชบอร์ด</span>
          </nav>
          <h2 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl">
            จัดการข้อมูลผู้ป่วยและบริการโรงพยาบาลอย่างมีประสิทธิภาพ
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
            ติดตามผู้ป่วยนอก นัดหมาย และสถานะระบบ HosXP ได้ในที่เดียว
          </p>
        </div>
      </div>

      {dataError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {dataError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="glass-card p-5">
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${stat.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} strokeWidth={2} />
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-muted">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">ภาพรวมผู้ป่วยรายสัปดาห์</h2>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <p className="text-3xl font-bold text-foreground">
                  {weeklyTotal.toLocaleString("th-TH")}
                </p>
              </div>
              <p className="mt-1 text-sm text-muted">
                เฉลี่ย {weeklyAvg.toLocaleString("th-TH")} ราย/วัน · สูงสุด {weeklyPeak.label}{" "}
                {weeklyPeak.count.toLocaleString("th-TH")} ราย
              </p>
            </div>
            <span className="glass-input rounded-full px-4 py-1.5 text-xs font-medium text-muted">
              7 วันล่าสุด
            </span>
          </div>

          {weeklyOpd.length > 0 ? (
            <WeeklyOpdChart data={weeklyOpd} />
          ) : (
            <p className="py-8 text-center text-sm text-muted">ไม่มีข้อมูล OPD รายสัปดาห์</p>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-foreground">สถานะฐานข้อมูล</h2>
          <p className="mb-4 text-sm text-muted">การเชื่อมต่อระบบ</p>
          <div className="space-y-3">
            {!dbHealth ? (
              <p className="text-sm text-muted">ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล HosXP</p>
            ) : (
              <div className="flex items-center justify-between rounded-2xl bg-[var(--input-bg)] px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    HosXP — {dbTypeLabel(dbHealth.type)}
                  </p>
                  <p className="text-xs text-muted">
                    ฐานข้อมูลหลัก ({dbHealth.type === "mysql" ? "my" : "pg"})
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    dbHealth.online
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-red-500/15 text-red-500"
                  }`}
                >
                  {dbHealth.online ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-foreground">กิจกรรมล่าสุด</h2>
        <p className="mb-4 text-sm text-muted">ผู้ป่วยนอกวันนี้ (ล่าสุด 10 ราย)</p>
        <div className="divide-y divide-[var(--divider)]">
          {recentActivities.length === 0 ? (
            <p className="py-4 text-sm text-muted">ไม่พบกิจกรรมวันนี้</p>
          ) : (
            recentActivities.map((activity, i) => (
              <div key={`${activity.time}-${i}`} className="flex gap-4 py-3">
                <span className="shrink-0 text-sm font-bold text-primary-500">
                  {activity.time}
                </span>
                <span className="text-sm text-muted">{activity.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
