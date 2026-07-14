import { NextResponse } from "next/server";

import {
  clearDmLabCache,
  DEFAULT_FISCAL_YEAR,
  filterByPcu,
  getDmLabSnkRows,
  patientsToCsv,
} from "@/lib/queries/dm-lab-snk";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = Number(searchParams.get("fy") ?? DEFAULT_FISCAL_YEAR);
    const pcu = searchParams.get("pcu") ?? "all";
    const refresh = searchParams.get("refresh") === "1";

    if (refresh) clearDmLabCache();

    const { rows } = await getDmLabSnkRows(fiscalYear, { forceRefresh: refresh });
    const filtered = filterByPcu(rows, pcu);
    const csv = patientsToCsv(filtered);
    const filename = `dm-lab-all-${fiscalYear}-${pcu}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถส่งออกข้อมูลได้" }, { status: 500 });
  }
}
