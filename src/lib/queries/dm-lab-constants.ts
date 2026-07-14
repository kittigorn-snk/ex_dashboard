/** Fiscal year configs for DM LAB Srinakhon report */

export type DmLabFiscalYear = {
  fiscalYear: number;
  startDate: string;
  endDate: string;
  /** clinicmember.begin_year upper bound (BE) */
  beginYearMax: string;
  label: string;
};

export const DM_LAB_FISCAL_YEARS: Record<number, DmLabFiscalYear> = {
  2569: {
    fiscalYear: 2569,
    startDate: "2025-10-01",
    endDate: "2026-09-30",
    beginYearMax: "2568",
    label: "1 ต.ค. 2568 – 30 ก.ย. 2569",
  },
  2568: {
    fiscalYear: 2568,
    startDate: "2024-10-01",
    endDate: "2025-09-30",
    beginYearMax: "2567",
    label: "1 ต.ค. 2567 – 30 ก.ย. 2568",
  },
};

export const DEFAULT_FISCAL_YEAR = 2569;

export type PcuOption = {
  hcode: string;
  name: string;
  tmbpart: string | null;
};

/** Mapping จาก query RLU_DM_SNK — อ.ศรีนคร (chwpart=64, amppart=08) */
export const PCU_OPTIONS: PcuOption[] = [
  { hcode: "all", name: "ทั้งหมด", tmbpart: null },
  { hcode: "11249", name: "รพ.ศรีนคร (ต.ศรีนคร)", tmbpart: "01" },
  { hcode: "07463", name: "รพ.สต.นครเดิฐ (ต.นครเดิฐ)", tmbpart: "02" },
  { hcode: "07464", name: "รพ.สต.น้ำพุ (ต.น้ำพุ)", tmbpart: "03" },
  { hcode: "07465", name: "รพ.สต.หนองบัว (ต.หนองบัว)", tmbpart: "04" },
  { hcode: "07466", name: "รพ.สต.บึงปลาทู (ต.บึงปลาทู)", tmbpart: "05" },
  { hcode: "out_area", name: "นอกพื้นที่", tmbpart: null },
];

export function resolvePcuHcode(tmbpart: string | null | undefined): string {
  switch (tmbpart) {
    case "01":
      return "11249";
    case "02":
      return "07463";
    case "03":
      return "07464";
    case "04":
      return "07465";
    case "05":
      return "07466";
    default:
      return "out_area";
  }
}

export function getPcuName(hcode: string): string {
  return PCU_OPTIONS.find((p) => p.hcode === hcode)?.name ?? hcode;
}

export function getFiscalYear(year: number): DmLabFiscalYear {
  return DM_LAB_FISCAL_YEARS[year] ?? DM_LAB_FISCAL_YEARS[DEFAULT_FISCAL_YEAR];
}

/** KPI targets (%) */
export const DM_LAB_KPI = {
  hba1cAtLeast2: { target: 80, label: "HbA1c ตรวจ ≥2 ครั้ง/ปี" },
  hba1cWithin90: { target: 70, label: "HbA1c ช่วงห่าง ≤90 วัน" },
  creatinineAny: { target: 80, label: "Creatinine ตรวจอย่างน้อย 1 ครั้ง" },
  ldlAny: { target: 80, label: "LDL ตรวจอย่างน้อย 1 ครั้ง" },
} as const;

/** @deprecated use DM_LAB_FISCAL_YEARS[2569] */
export const DM_LAB_FY2569 = DM_LAB_FISCAL_YEARS[2569];
