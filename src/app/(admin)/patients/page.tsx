import { formatPatientName, formatThaiDate, formatTime } from "@/lib/format";
import { getTodayOpdCount, getTodayOpdPatients } from "@/lib/queries/opd";

export default async function PatientsPage() {
  let patients: Awaited<ReturnType<typeof getTodayOpdPatients>> = [];
  let total = 0;
  let error: string | null = null;

  try {
    [patients, total] = await Promise.all([getTodayOpdPatients(100), getTodayOpdCount()]);
  } catch {
    error = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary-900 dark:text-foreground">
            ผู้ป่วยนอกวันนี้
          </h2>
          <p className="text-sm text-muted">
            ข้อมูลจาก HosXP วันที่ {formatThaiDate(new Date())} — ทั้งหมด {total.toLocaleString("th-TH")} ราย
          </p>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : patients.length === 0 ? (
        <p className="text-sm text-slate-500">ไม่พบข้อมูลผู้ป่วยวันนี้</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-primary-100 bg-white shadow-sm dark:border-[var(--divider)] dark:bg-[var(--card-bg)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary-50 dark:bg-[var(--input-bg)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">เวลา</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">VN</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">HN</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">ชื่อผู้ป่วย</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">แผนก</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">สิทธิ</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.vn}
                    className="border-t border-[var(--divider)] hover:bg-primary-50/50 dark:hover:bg-[var(--input-bg)]"
                  >
                    <td className="px-4 py-3 text-muted">{formatTime(p.vsttime)}</td>
                    <td className="px-4 py-3 font-mono text-foreground">{p.vn}</td>
                    <td className="px-4 py-3 font-mono text-foreground">{p.hn}</td>
                    <td className="px-4 py-3 text-foreground">{formatPatientName(p)}</td>
                    <td className="px-4 py-3 text-muted">{p.spclty_name ?? p.spclty ?? "-"}</td>
                    <td className="px-4 py-3 text-muted">{p.pttype ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > patients.length && (
            <p className="border-t border-[var(--divider)] px-4 py-3 text-xs text-muted">
              แสดง {patients.length.toLocaleString("th-TH")} รายการล่าสุด จากทั้งหมด{" "}
              {total.toLocaleString("th-TH")} ราย
            </p>
          )}
        </div>
      )}
    </div>
  );
}
