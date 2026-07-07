import { queryMysql } from "@/lib/db/mysql";

import { verifyMd5Password } from "./password";

export type OfficerUser = {
  officerId: number;
  loginName: string;
  name: string;
  fname: string | null;
  lname: string | null;
};

type OpduserRow = {
  loginname: string;
  name: string | null;
  passweb: string | null;
};

type OfficerRow = {
  officer_id: number;
  officer_fname: string | null;
  officer_lname: string | null;
};

export async function authenticateOfficer(
  loginName: string,
  password: string,
): Promise<OfficerUser | null> {
  const users = await queryMysql<OpduserRow>(
    `SELECT loginname, name, passweb
     FROM opduser
     WHERE loginname = ?
     LIMIT 1`,
    [loginName],
  );

  const user = users[0];
  if (!user) return null;
  if (!verifyMd5Password(password, user.passweb)) return null;

  const officers = await queryMysql<OfficerRow>(
    `SELECT officer_id, officer_fname, officer_lname
     FROM officer
     WHERE officer_login_name = ? AND officer_active = 'Y'
     LIMIT 1`,
    [loginName],
  );

  const officer = officers[0];

  return {
    officerId: officer?.officer_id ?? 0,
    loginName: user.loginname,
    name: user.name?.trim() || loginName,
    fname: officer?.officer_fname ?? null,
    lname: officer?.officer_lname ?? null,
  };
}
