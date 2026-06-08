"use client";

import { useRef, useState } from "react";
import { Send, Loader2, Check, Paperclip, X } from "lucide-react";
import { INQUIRY_TYPES } from "@/lib/constants";
import { uploadAsset } from "@/lib/storage-upload";

type Phase = "idle" | "submitting" | "done" | "error";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function InquiryForm() {
  const [form, setForm] = useState({
    type: INQUIRY_TYPES[0],
    name: "",
    company: "",
    phone: "",
    email: "",
    message: "",
  });
  const [attachments, setAttachments] = useState<{ url: string; name: string; size: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const onChange =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setErrMsg(`첨부는 최대 ${MAX_ATTACHMENTS}개까지 가능합니다.`);
      return;
    }
    setUploading(true);
    setErrMsg(null);
    try {
      const newOnes: typeof attachments = [];
      for (const f of Array.from(files)) {
        if (f.size > MAX_FILE_SIZE) {
          setErrMsg(`${f.name}이 너무 큽니다 (최대 10MB)`);
          continue;
        }
        const res = await uploadAsset(f, "inquiries");
        newOnes.push({ url: res.url, name: f.name, size: res.size });
      }
      setAttachments((s) => [...s, ...newOnes]);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const removeAttachment = (idx: number) =>
    setAttachments((s) => s.filter((_, i) => i !== idx));

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phase === "submitting") return;
    setPhase("submitting");
    setErrMsg(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          attachments: attachments.map((a) => a.url),
        }),
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
      setAttachments([]);
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
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          첨부파일 (선택, 최대 {MAX_ATTACHMENTS}개 / 10MB)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip"
            onChange={(e) => addFiles(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading || attachments.length >= MAX_ATTACHMENTS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-400 text-sm disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
            파일 선택 ({attachments.length}/{MAX_ATTACHMENTS})
          </button>
          {attachments.map((a, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm"
            >
              <span className="truncate max-w-[200px]">{a.name}</span>
              <span className="text-xs text-gray-500">
                {(a.size / 1024).toFixed(0)}KB
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-gray-400 hover:text-rose-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
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
