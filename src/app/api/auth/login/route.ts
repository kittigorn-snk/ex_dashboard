import { NextResponse } from "next/server";

import { authenticateOfficer } from "@/lib/auth/officer";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 },
      );
    }

    const user = await authenticateOfficer(username, password);
    if (!user) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 },
      );
    }

    await createSession(user);
    return NextResponse.json({ ok: true, user: { name: user.name, loginName: user.loginName } });
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" },
      { status: 500 },
    );
  }
}
