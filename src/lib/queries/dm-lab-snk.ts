import { queryMysql } from "@/lib/db/mysql";
import { clearCache, getCached, setCached } from "@/lib/cache";
import { formatSex } from "@/lib/format";

import {
  DEFAULT_FISCAL_YEAR,
  DM_LAB_KPI,
  getFiscalYear,
  getPcuName,
  resolvePcuHcode,
  type DmLabFiscalYear,
} from "./dm-lab-constants";
import { buildDmLabSnkSql } from "./dm-lab-snk-sql";

export type DmLabPatientRow = {
  hn: string;
  pt_name: string | null;
  sex: string | null;
  tmbpart: string | null;
  pcu_hcode: string;
  pcu_name: string;
  hba1c_exam_count: number;
  hba1c_day90: string | null;
  creatinine_exam_count: number;
  creatinine_day90: string | null;
  ldl_exam_count: number;
  ldl_day90: string | null;
};

type RawDmLabRow = {
  hn: string;
  pt_name: string | null;
  sex: string | null;
  tmbpart: string | null;
  hba1c_exam_count: number;
  hba1c_day90: string | null;
  creatinine_exam_count: number;
  creatinine_day90: string | null;
  ldl_exam_count: number;
  ldl_day90: string | null;
};

export type BreakdownItem = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type ExamCountBreakdown = {
  total: number;
  items: BreakdownItem[];
};

export type Day90Breakdown = {
  total: number;
  items: BreakdownItem[];
};

export type KpiItem = {
  id: string;
  label: string;
  value: number;
  target: number;
  met: boolean;
  numerator: number;
  denominator: number;
};

export type LabSectionSummary = {
  exam: ExamCountBreakdown;
  day90: Day90Breakdown;
};

export type DmLabSnkSummary = {
  fiscalYear: number;
  periodLabel: string;
  pcuHcode: string;
  pcuName: string;
  totalPatients: number;
  cachedAt: string | null;
  fromCache: boolean;
  hba1c: LabSectionSummary;
  creatinine: LabSectionSummary;
  ldl: LabSectionSummary;
  kpi: KpiItem[];
  pcuBreakdown: { hcode: string; name: string; count: number; percent: number }[];
};

export type DrillLab = "hba1c" | "creatinine" | "ldl";
export type DrillKind = "exam" | "day90";

/** exam: 0|1|2|3|4+  day90: null|within90|over90 */
export type DrillBucket = string;

export type DrillFilter = {
  lab: DrillLab;
  kind: DrillKind;
  bucket: DrillBucket;
};

function isNullValue(value: string | null | undefined): boolean {
  if (value == null) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === "" || normalized === "null";
}

function parseExamCount(value: number | string | null | undefined): number {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function normalizeDay90(value: string | null | undefined): "null" | "within90" | "over90" {
  if (isNullValue(value)) return "null";
  const v = String(value).trim().toUpperCase();
  if (v === "Y") return "within90";
  if (v === "N") return "over90";
  return "null";
}

function toPercent(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function buildItems(
  total: number,
  buckets: { key: string; label: string; count: number }[],
): BreakdownItem[] {
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    count: bucket.count,
    percent: toPercent(bucket.count, total),
  }));
}

function examField(lab: DrillLab): keyof DmLabPatientRow {
  if (lab === "hba1c") return "hba1c_exam_count";
  if (lab === "creatinine") return "creatinine_exam_count";
  return "ldl_exam_count";
}

function day90Field(lab: DrillLab): keyof DmLabPatientRow {
  if (lab === "hba1c") return "hba1c_day90";
  if (lab === "creatinine") return "creatinine_day90";
  return "ldl_day90";
}

export function aggregateExamCount(
  rows: DmLabPatientRow[],
  field: keyof Pick<
    DmLabPatientRow,
    "hba1c_exam_count" | "creatinine_exam_count" | "ldl_exam_count"
  >,
  lab: DrillLab,
): ExamCountBreakdown {
  const total = rows.length;
  let none = 0;
  let once = 0;
  let twice = 0;
  let thrice = 0;
  let more = 0;

  for (const row of rows) {
    const count = parseExamCount(row[field] as number);
    if (count === 0) none += 1;
    else if (count === 1) once += 1;
    else if (count === 2) twice += 1;
    else if (count === 3) thrice += 1;
    else more += 1;
  }

  const items = buildItems(total, [
    { key: `${lab}:exam:0`, label: "ไม่ตรวจ", count: none },
    { key: `${lab}:exam:1`, label: "ตรวจ 1 ครั้ง", count: once },
    { key: `${lab}:exam:2`, label: "ตรวจ 2 ครั้ง", count: twice },
    { key: `${lab}:exam:3`, label: "ตรวจ 3 ครั้ง", count: thrice },
  ]);

  if (more > 0) {
    items.push({
      key: `${lab}:exam:4+`,
      label: "ตรวจ ≥4 ครั้ง",
      count: more,
      percent: toPercent(more, total),
    });
  }

  return { total, items };
}

export function aggregateDay90(
  rows: DmLabPatientRow[],
  field: keyof Pick<DmLabPatientRow, "hba1c_day90" | "creatinine_day90" | "ldl_day90">,
  lab: DrillLab,
): Day90Breakdown {
  const total = rows.length;
  let nullCount = 0;
  let within90 = 0;
  let over90 = 0;

  for (const row of rows) {
    const bucket = normalizeDay90(row[field] as string | null);
    if (bucket === "null") nullCount += 1;
    else if (bucket === "within90") within90 += 1;
    else over90 += 1;
  }

  return {
    total,
    items: buildItems(total, [
      { key: `${lab}:day90:null`, label: "Null", count: nullCount },
      { key: `${lab}:day90:within90`, label: "ตรวจ ≤90 วัน", count: within90 },
      { key: `${lab}:day90:over90`, label: "ตรวจ ≥90 วัน", count: over90 },
    ]),
  };
}

export function buildKpi(rows: DmLabPatientRow[]): KpiItem[] {
  const total = rows.length;
  const hba1cGe2 = rows.filter((r) => parseExamCount(r.hba1c_exam_count) >= 2).length;
  const hba1cWithin = rows.filter((r) => normalizeDay90(r.hba1c_day90) === "within90").length;
  const creatAny = rows.filter((r) => parseExamCount(r.creatinine_exam_count) >= 1).length;
  const ldlAny = rows.filter((r) => parseExamCount(r.ldl_exam_count) >= 1).length;

  const make = (
    id: string,
    label: string,
    numerator: number,
    target: number,
  ): KpiItem => {
    const value = toPercent(numerator, total);
    return {
      id,
      label,
      value,
      target,
      met: value >= target,
      numerator,
      denominator: total,
    };
  };

  return [
    make("hba1cAtLeast2", DM_LAB_KPI.hba1cAtLeast2.label, hba1cGe2, DM_LAB_KPI.hba1cAtLeast2.target),
    make("hba1cWithin90", DM_LAB_KPI.hba1cWithin90.label, hba1cWithin, DM_LAB_KPI.hba1cWithin90.target),
    make("creatinineAny", DM_LAB_KPI.creatinineAny.label, creatAny, DM_LAB_KPI.creatinineAny.target),
    make("ldlAny", DM_LAB_KPI.ldlAny.label, ldlAny, DM_LAB_KPI.ldlAny.target),
  ];
}

function buildPcuBreakdown(rows: DmLabPatientRow[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.pcu_hcode, (map.get(row.pcu_hcode) ?? 0) + 1);
  }
  const total = rows.length;
  return [...map.entries()]
    .map(([hcode, count]) => ({
      hcode,
      name: getPcuName(hcode),
      count,
      percent: toPercent(count, total),
    }))
    .sort((a, b) => b.count - a.count);
}

export function enrichRows(raw: RawDmLabRow[]): DmLabPatientRow[] {
  return raw.map((row) => {
    const pcu_hcode = resolvePcuHcode(row.tmbpart);
    return {
      ...row,
      hba1c_exam_count: parseExamCount(row.hba1c_exam_count),
      creatinine_exam_count: parseExamCount(row.creatinine_exam_count),
      ldl_exam_count: parseExamCount(row.ldl_exam_count),
      pcu_hcode,
      pcu_name: getPcuName(pcu_hcode),
    };
  });
}

export function filterByPcu(rows: DmLabPatientRow[], pcuHcode: string): DmLabPatientRow[] {
  if (!pcuHcode || pcuHcode === "all") return rows;
  return rows.filter((r) => r.pcu_hcode === pcuHcode);
}

export function parseDrillKey(key: string): DrillFilter | null {
  const parts = key.split(":");
  if (parts.length !== 3) return null;
  const [lab, kind, bucket] = parts;
  if (lab !== "hba1c" && lab !== "creatinine" && lab !== "ldl") return null;
  if (kind !== "exam" && kind !== "day90") return null;
  return { lab, kind, bucket };
}

export function drillLabel(filter: DrillFilter): string {
  const labName =
    filter.lab === "hba1c" ? "HbA1c" : filter.lab === "creatinine" ? "Creatinine" : "LDL";
  if (filter.kind === "exam") {
    if (filter.bucket === "0") return `${labName} — ไม่ตรวจ`;
    if (filter.bucket === "4+") return `${labName} — ตรวจ ≥4 ครั้ง`;
    return `${labName} — ตรวจ ${filter.bucket} ครั้ง`;
  }
  if (filter.bucket === "null") return `${labName} day90 — Null`;
  if (filter.bucket === "within90") return `${labName} day90 — ≤90 วัน`;
  if (filter.bucket === "over90") return `${labName} day90 — ≥90 วัน`;
  return `${labName} day90`;
}

export function filterByDrill(rows: DmLabPatientRow[], filter: DrillFilter): DmLabPatientRow[] {
  const eField = examField(filter.lab);
  const dField = day90Field(filter.lab);

  return rows.filter((row) => {
    if (filter.kind === "exam") {
      const count = parseExamCount(row[eField] as number);
      if (filter.bucket === "0") return count === 0;
      if (filter.bucket === "1") return count === 1;
      if (filter.bucket === "2") return count === 2;
      if (filter.bucket === "3") return count === 3;
      if (filter.bucket === "4+") return count >= 4;
      return false;
    }
    return normalizeDay90(row[dField] as string | null) === filter.bucket;
  });
}

export function buildDmLabSnkSummary(
  rows: DmLabPatientRow[],
  options: {
    fiscalYear: number;
    periodLabel: string;
    pcuHcode: string;
    fromCache?: boolean;
    cachedAt?: string | null;
  },
): DmLabSnkSummary {
  return {
    fiscalYear: options.fiscalYear,
    periodLabel: options.periodLabel,
    pcuHcode: options.pcuHcode,
    pcuName: getPcuName(options.pcuHcode),
    totalPatients: rows.length,
    cachedAt: options.cachedAt ?? null,
    fromCache: options.fromCache ?? false,
    hba1c: {
      exam: aggregateExamCount(rows, "hba1c_exam_count", "hba1c"),
      day90: aggregateDay90(rows, "hba1c_day90", "hba1c"),
    },
    creatinine: {
      exam: aggregateExamCount(rows, "creatinine_exam_count", "creatinine"),
      day90: aggregateDay90(rows, "creatinine_day90", "creatinine"),
    },
    ldl: {
      exam: aggregateExamCount(rows, "ldl_exam_count", "ldl"),
      day90: aggregateDay90(rows, "ldl_day90", "ldl"),
    },
    kpi: buildKpi(rows),
    pcuBreakdown: buildPcuBreakdown(rows),
  };
}

async function fetchRowsUncached(fy: DmLabFiscalYear): Promise<DmLabPatientRow[]> {
  const raw = await queryMysql<RawDmLabRow>(buildDmLabSnkSql(fy));
  return enrichRows(raw);
}

export async function getDmLabSnkRows(
  fiscalYear = DEFAULT_FISCAL_YEAR,
  options: { forceRefresh?: boolean } = {},
): Promise<{ rows: DmLabPatientRow[]; fromCache: boolean; cachedAt: string }> {
  const fy = getFiscalYear(fiscalYear);
  const cacheKey = `dm-lab-snk:${fy.fiscalYear}`;

  if (!options.forceRefresh) {
    const cached = getCached<{ rows: DmLabPatientRow[]; cachedAt: string }>(cacheKey);
    if (cached) {
      return { rows: cached.rows, fromCache: true, cachedAt: cached.cachedAt };
    }
  }

  const rows = await fetchRowsUncached(fy);
  const cachedAt = new Date().toISOString();
  setCached(cacheKey, { rows, cachedAt });
  return { rows, fromCache: false, cachedAt };
}

export async function getDmLabSnkSummary(
  fiscalYear = DEFAULT_FISCAL_YEAR,
  pcuHcode = "all",
  options: { forceRefresh?: boolean } = {},
): Promise<DmLabSnkSummary> {
  const fy = getFiscalYear(fiscalYear);
  const { rows, fromCache, cachedAt } = await getDmLabSnkRows(fiscalYear, options);
  const filtered = filterByPcu(rows, pcuHcode);
  return buildDmLabSnkSummary(filtered, {
    fiscalYear: fy.fiscalYear,
    periodLabel: fy.label,
    pcuHcode,
    fromCache,
    cachedAt,
  });
}

export async function getDmLabDrillPatients(
  fiscalYear: number,
  pcuHcode: string,
  drillKey: string,
): Promise<{ label: string; patients: DmLabPatientRow[] }> {
  const filter = parseDrillKey(drillKey);
  if (!filter) return { label: "ไม่พบหมวด", patients: [] };

  const { rows } = await getDmLabSnkRows(fiscalYear);
  const filtered = filterByDrill(filterByPcu(rows, pcuHcode), filter);
  return { label: drillLabel(filter), patients: filtered };
}

export function patientsToCsv(patients: DmLabPatientRow[]): string {
  const header = [
    "HN",
    "ชื่อ-สกุล",
    "เพศ",
    "รพ.สต.",
    "รหัสรพ.สต.",
    "HbA1c_ครั้ง",
    "HbA1c_day90",
    "Creatinine_ครั้ง",
    "Creatinine_day90",
    "LDL_ครั้ง",
    "LDL_day90",
  ];

  const lines = patients.map((p) =>
    [
      p.hn,
      `"${(p.pt_name ?? "").replaceAll('"', '""')}"`,
      formatSex(p.sex),
      `"${p.pcu_name.replaceAll('"', '""')}"`,
      p.pcu_hcode,
      p.hba1c_exam_count,
      p.hba1c_day90 ?? "Null",
      p.creatinine_exam_count,
      p.creatinine_day90 ?? "Null",
      p.ldl_exam_count,
      p.ldl_day90 ?? "Null",
    ].join(","),
  );

  return "\uFEFF" + [header.join(","), ...lines].join("\r\n");
}

export function clearDmLabCache(): void {
  clearCache("dm-lab-snk:");
}

export {
  DM_LAB_FISCAL_YEARS,
  DEFAULT_FISCAL_YEAR,
  PCU_OPTIONS,
  getFiscalYear,
} from "./dm-lab-constants";
