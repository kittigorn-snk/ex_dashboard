import {
  type DmLabFiscalYear,
  DM_LAB_FY2569,
} from "./dm-lab-constants";

function withPlaceholders(
  sql: string,
  startDate: string,
  endDate: string,
  beginYearMax: string,
): string {
  return sql
    .replaceAll("{{D1}}", startDate)
    .replaceAll("{{D2}}", endDate)
    .replaceAll("{{BEGIN_YEAR_MAX}}", beginYearMax);
}

const DM_LAB_SNK_BASE_SQL = `
SELECT
  cm.hn,
  CONCAT(IFNULL(p.pname,''), IFNULL(p.fname,''), ' ', IFNULL(p.lname,'')) AS pt_name,
  p.sex,
  p.tmbpart,
  (SELECT COUNT(lh.order_date)
   FROM lab_order lo
   LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
   LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
   WHERE lh.hn = cm.hn
     AND li.provis_labcode = 0531601
     AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
     AND lo.confirm = 'Y'
     AND lo.lab_order_result IS NOT NULL
     AND lo.lab_order_result <> ' ') AS hba1c_exam_count,
  (SELECT CASE
     WHEN DATEDIFF(
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
        WHERE lh.hn = cm.hn AND li.provis_labcode = 0531601
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 0,1),
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        WHERE lh.hn = cm.hn AND lo.lab_items_code IN ('193','198','233','368')
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 1,1)
     ) <= 90 THEN 'Y'
     WHEN DATEDIFF(
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
        WHERE lh.hn = cm.hn AND li.provis_labcode = 0531601
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 0,1),
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        WHERE lh.hn = cm.hn AND lo.lab_items_code IN ('193','198','233','368')
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 1,1)
     ) > 90 THEN 'N'
     ELSE 'Null'
   END) AS hba1c_day90,
  (SELECT COUNT(lh.order_date)
   FROM lab_order lo
   LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
   LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
   WHERE lh.hn = cm.hn
     AND li.provis_labcode = 0581902
     AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
     AND lo.confirm = 'Y'
     AND lo.lab_order_result IS NOT NULL
     AND lo.lab_order_result <> ' ') AS creatinine_exam_count,
  (SELECT CASE
     WHEN DATEDIFF(
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
        WHERE lh.hn = cm.hn AND li.provis_labcode = 0581902
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 0,1),
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        WHERE lh.hn = cm.hn AND lo.lab_items_code IN (78)
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 1,1)
     ) <= 90 THEN 'Y'
     WHEN DATEDIFF(
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
        WHERE lh.hn = cm.hn AND li.provis_labcode = 0581902
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 0,1),
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        WHERE lh.hn = cm.hn AND lo.lab_items_code IN (78)
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 1,1)
     ) > 90 THEN 'N'
     ELSE 'Null'
   END) AS creatinine_day90,
  (SELECT COUNT(lh.order_date)
   FROM lab_order lo
   LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
   LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
   WHERE lh.hn = cm.hn
     AND li.provis_labcode = 0541402
     AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
     AND lo.confirm = 'Y'
     AND lo.lab_order_result IS NOT NULL
     AND lo.lab_order_result <> ' ') AS ldl_exam_count,
  (SELECT CASE
     WHEN DATEDIFF(
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
        WHERE lh.hn = cm.hn AND li.provis_labcode = 0541402
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 0,1),
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        WHERE lh.hn = cm.hn AND lo.lab_items_code IN (92)
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 1,1)
     ) <= 90 THEN 'Y'
     WHEN DATEDIFF(
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        LEFT OUTER JOIN lab_items li ON lo.lab_items_code = li.lab_items_code
        WHERE lh.hn = cm.hn AND li.provis_labcode = 0541402
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 0,1),
       (SELECT lh.order_date FROM lab_order lo
        LEFT OUTER JOIN lab_head lh ON lh.lab_order_number = lo.lab_order_number
        WHERE lh.hn = cm.hn AND lo.lab_items_code IN (92)
          AND lh.order_date BETWEEN '{{D1}}' AND '{{D2}}'
          AND lo.confirm = 'Y' AND lo.lab_order_result IS NOT NULL AND lo.lab_order_result <> ' '
        ORDER BY lh.report_date DESC, lh.report_time DESC LIMIT 1,1)
     ) > 90 THEN 'N'
     ELSE 'Null'
   END) AS ldl_day90
FROM clinicmember cm
LEFT JOIN patient p ON p.hn = cm.hn
WHERE p.chwpart = '64'
  AND p.amppart = '08'
  AND cm.clinic_member_status_id NOT IN (2, 4, 5, 6, 7, 8, 9, 10, 11)
  AND cm.clinic = '001'
  AND p.death = 'N'
  AND cm.begin_year BETWEEN '0000' AND '{{BEGIN_YEAR_MAX}}'
GROUP BY cm.clinicmember_id
`;

export function buildDmLabSnkSql(fy: DmLabFiscalYear = DM_LAB_FY2569): string {
  return withPlaceholders(DM_LAB_SNK_BASE_SQL, fy.startDate, fy.endDate, fy.beginYearMax);
}

export {
  DEFAULT_FISCAL_YEAR,
  DM_LAB_FISCAL_YEARS,
  DM_LAB_FY2569,
  DM_LAB_KPI,
  getFiscalYear,
  getPcuName,
  PCU_OPTIONS,
  resolvePcuHcode,
} from "./dm-lab-constants";
export type { DmLabFiscalYear, PcuOption } from "./dm-lab-constants";
