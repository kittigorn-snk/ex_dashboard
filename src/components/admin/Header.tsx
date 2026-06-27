import { Bell, Search } from "lucide-react";

import DbConnectionStatus from "@/components/admin/DbConnectionStatus";
import ThemeToggle from "@/components/admin/ThemeToggle";

export default function Header() {
  return (
    <header className="glass-header z-10 flex h-16 shrink-0 items-center justify-between gap-4 px-6">
      <div className="min-w-0 shrink-0">
        <h1 className="text-lg font-semibold text-foreground">แดชบอร์ด</h1>
        <p className="text-sm text-muted">ยินดีต้อนรับสู่ระบบ HosXP Admin 👋</p>
      </div>

      <div className="hidden flex-1 justify-center px-4 md:flex">
        <div className="relative w-full max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={2}
          />
          <input
            type="search"
            placeholder="ค้นหา HN, ชื่อผู้ป่วย..."
            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DbConnectionStatus />

        <ThemeToggle />

        <button
          type="button"
          className="relative rounded-xl p-2.5 text-muted transition-colors hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400"
          aria-label="การแจ้งเตือน"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <div className="ml-1 hidden h-8 w-px bg-[var(--divider)] sm:block" />

        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-semibold text-white">
            ผอ
          </div>
        </div>
      </div>
    </header>
  );
}
