import { NextResponse } from "next/server";

import {
  DEFAULT_FISCAL_YEAR,
  getDmLabDrillPatients,
  patientsToCsv,
} from "@/lib/queries/dm-lab-snk";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = Number(searchParams.get("fy") ?? DEFAULT_FISCAL_YEAR);
    const pcu = searchParams.get("pcu") ?? "all";
    const bucket = searchParams.get("bucket") ?? "";
    const format = searchParams.get("format") ?? "json";

    if (!bucket) {
      return NextResponse.json({ error: "กรุณาระบุ bucket" }, { status: 400 });
    }

    const { label, patients } = await getDmLabDrillPatients(fiscalYear, pcu, bucket);

    if (format === "csv") {
      const csv = patientsToCsv(patients);
      const filename = `dm-lab-${fiscalYear}-${bucket.replaceAll(":", "-")}.csv`;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      label,
      count: patients.length,
      patients: patients.map((p) => ({
        hn: p.hn,
        name: p.pt_name,
        sex: p.sex,
        pcuHcode: p.pcu_hcode,
        pcuName: p.pcu_name,
        hba1cExam: p.hba1c_exam_count,
        hba1cDay90: p.hba1c_day90,
        creatinineExam: p.creatinine_exam_count,
        creatinineDay90: p.creatinine_day90,
        ldlExam: p.ldl_exam_count,
        ldlDay90: p.ldl_day90,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถดึงรายชื่อผู้ป่วยได้" },
      { status: 500 },
    );
  }
}
