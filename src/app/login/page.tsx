import { Suspense } from "react";

import LoginForm from "@/components/admin/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 text-xl font-bold text-white shadow-lg shadow-primary-500/30">
            H
          </div>
          <h1 className="text-2xl font-bold text-foreground">HosXP Admin</h1>
          <p className="mt-2 text-sm text-muted">เข้าสู่ระบบด้วยบัญชี HosXP (opduser)</p>
        </div>

        <div className="glass-card p-8">
          <Suspense fallback={<p className="text-center text-sm text-muted">กำลังโหลด...</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
