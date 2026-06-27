"use client";

import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/patients", label: "ผู้ป่วย", icon: Users },
  { href: "/appointments", label: "นัดหมาย", icon: CalendarDays },
  { href: "/reports", label: "รายงาน", icon: FileText },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-sidebar flex h-screen w-64 shrink-0 flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-[var(--sidebar-border)] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-base font-bold text-white shadow-lg shadow-primary-500/30">
            H
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">HosXP Admin</p>
            <p className="truncate text-xs text-muted">ระบบจัดการโรงพยาบาล</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-[var(--nav-active-bg)] font-medium text-[var(--nav-active-text)]"
                  : "text-muted hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] px-4 py-4">
        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-semibold text-white">
              ผอ
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">ผู้ดูแลระบบ</p>
              <p className="truncate text-xs text-muted">admin@hosxp.local</p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted">เวอร์ชัน 1.0.0</p>
      </div>
    </aside>
  );
}
