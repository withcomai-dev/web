"use client";

import { useState } from "react";
import { Send, Loader2, Check } from "lucide-react";
import { INQUIRY_TYPES } from "@/lib/constants";

type Phase = "idle" | "submitting" | "done" | "error";

export default function InquiryForm() {
  const [form, setForm] = useState({
    type: INQUIRY_TYPES[0],
    name: "",
    company: "",
    phone: "",
    email: "",
    message: "",
  });
  const [phase, setPhase] = useState<Phase>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const onChange =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phase === "submitting") return;
    setPhase("submitting");
    setErrMsg(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `요청 실패 (${res.status})`);
      }
      setPhase("done");
      setForm({
        type: INQUIRY_TYPES[0],
        name: "",
        company: "",
        phone: "",
        email: "",
        message: "",
      });
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "전송 실패");
      setPhase("error");
    }
  };

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Check className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">전송 완료</h2>
        <p className="text-gray-500">영업일 기준 1~2일 이내에 답변드리겠습니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">성함 / 담당자명</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={onChange("name")}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
          placeholder="홍길동"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">회사명</label>
        <input
          type="text"
          value={form.company}
          onChange={onChange("company")}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
          placeholder="(주)위드컴정보"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
        <input
          type="tel"
          value={form.phone}
          onChange={onChange("phone")}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
          placeholder="010-0000-0000"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={onChange("email")}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
          placeholder="example@email.com"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">문의 유형</label>
        <select
          value={form.type}
          onChange={onChange("type")}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
        >
          {INQUIRY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">문의 내용</label>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={onChange("message")}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
          placeholder="문의하실 내용을 상세히 적어주세요."
        />
      </div>
      {errMsg && (
        <div className="md:col-span-2">
          <p className="text-sm text-rose-600">{errMsg}</p>
        </div>
      )}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={phase === "submitting"}
          className="inline-flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
        >
          {phase === "submitting" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          문의 보내기
        </button>
      </div>
    </form>
  );
}
