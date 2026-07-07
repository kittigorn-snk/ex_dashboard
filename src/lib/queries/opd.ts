import { queryMysql } from "@/lib/db/mysql";

export type TodayOpdRow = {
  vn: string;
  hn: string;
  vstdate: string | Date;
  vsttime: string;
  spclty: string | null;
  spclty_name: string | null;
  pname: string | null;
  fname: string | null;
  lname: string | null;
  pttype: string | null;
  ovstost: string | null;
};

export type WeeklyOpdRow = {
  day: string | Date;
  count: number;
};

export type RecentActivityRow = {
  time: string;
  text: string;
};

export async function getTodayOpdCount(): Promise<number> {
  const rows = await queryMysql<{ count: number }>(
    "SELECT COUNT(*) AS count FROM ovst WHERE vstdate = CURDATE()",
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getTodayAppointmentsCount(): Promise<number> {
  const rows = await queryMysql<{ count: number }>(
    "SELECT COUNT(*) AS count FROM oapp WHERE nextdate = CURDATE()",
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getAdmittedCount(): Promise<number> {
  const rows = await queryMysql<{ count: number }>(
    "SELECT COUNT(*) AS count FROM ipt WHERE dchdate IS NULL",
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getOfficerCount(): Promise<number> {
  const rows = await queryMysql<{ count: number }>(
    "SELECT COUNT(*) AS count FROM officer WHERE officer_active = 'Y'",
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getTodayOpdPatients(limit = 100): Promise<TodayOpdRow[]> {
  return queryMysql<TodayOpdRow>(
    `SELECT o.vn, o.hn, o.vstdate, o.vsttime, o.spclty, s.name AS spclty_name,
            p.pname, p.fname, p.lname, o.pttype, o.ovstost
     FROM ovst o
     JOIN patient p ON p.hn = o.hn
     LEFT JOIN spclty s ON s.spclty = o.spclty
     WHERE o.vstdate = CURDATE()
     ORDER BY o.vsttime DESC
     LIMIT ?`,
    [limit],
  );
}

export async function getWeeklyOpd(): Promise<WeeklyOpdRow[]> {
  return queryMysql<WeeklyOpdRow>(
    `SELECT DATE(vstdate) AS day, COUNT(*) AS count
     FROM ovst
     WHERE vstdate >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(vstdate)
     ORDER BY day`,
  );
}

export async function getRecentActivities(limit = 10): Promise<RecentActivityRow[]> {
  return queryMysql<RecentActivityRow>(
    `SELECT o.vsttime AS time,
            CONCAT('OPD HN ', o.hn, ' — ', p.fname, ' ', p.lname) AS text
     FROM ovst o
     JOIN patient p ON p.hn = o.hn
     WHERE o.vstdate = CURDATE()
     ORDER BY o.vsttime DESC
     LIMIT ?`,
    [limit],
  );
}
