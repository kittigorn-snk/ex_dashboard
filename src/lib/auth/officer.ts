import { queryMysql } from "@/lib/db/mysql";

import { verifyMd5Password } from "./password";

export type OfficerUser = {
  officerId: number;
  loginName: string;
  name: string;
  fname: string | null;
  lname: string | null;
};

type OfficerRow = {
  officer_id: number;
  officer_login_name: string;
  officer_login_password_md5: string | null;
  officer_name: string | null;
  officer_fname: string | null;
  officer_lname: string | null;
  officer_active: string | null;
};

function officerDisplayName(row: OfficerRow, loginName: string): string {
  const fullName = row.officer_name?.trim();
  if (fullName) return fullName;

  const parts = [row.officer_fname, row.officer_lname]
    .map((part) => part?.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts.join(" ");

  return loginName;
}

export async function authenticateOfficer(
  loginName: string,
  password: string,
): Promise<OfficerUser | null> {
  const rows = await queryMysql<OfficerRow>(
    `SELECT officer_id, officer_login_name, officer_login_password_md5,
            officer_name, officer_fname, officer_lname, officer_active
     FROM officer
     WHERE officer_login_name = ?
     LIMIT 1`,
    [loginName],
  );

  const officer = rows[0];
  if (!officer || officer.officer_active !== "Y") return null;
  if (!verifyMd5Password(password, officer.officer_login_password_md5)) return null;

  return {
    officerId: officer.officer_id,
    loginName: officer.officer_login_name,
    name: officerDisplayName(officer, loginName),
    fname: officer.officer_fname,
    lname: officer.officer_lname,
  };
}
