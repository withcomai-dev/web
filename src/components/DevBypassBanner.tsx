"use client";

import { AlertTriangle } from "lucide-react";

const ON = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

export default function DevBypassBanner() {
  if (!ON) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-amber-400 text-amber-950 text-xs font-semibold py-1.5 text-center shadow-md">
      <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
      DEV 인증 우회 모드 활성 — 자동으로 superadmin으로 로그인됨. (NEXT_PUBLIC_DEV_BYPASS_AUTH=true)
    </div>
  );
}
