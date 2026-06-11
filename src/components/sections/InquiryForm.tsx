"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Check, Paperclip, X, LogIn, Lock } from "lucide-react";
import { INQUIRY_TYPES } from "@/lib/constants";
import { uploadAsset } from "@/lib/storage-upload";
import { isRunmoaLoggedIn } from "@/lib/runmoa-session";
import { startRunmoa } from "@/lib/runmoa-auth";
import { auth } from "@/lib/firebase";

type Phase = "idle" | "submitting" | "done" | "error";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** 로그인 전 작성 내용을 보관하는 키 (로그인 다녀와도 같은 탭이면 유지) */
const DRAFT_KEY = "inquiry.draft.v1";

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
  // 로그인 상태(null=확인 전) + 로그인 요구 모달
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 마운트 시: 로그인 상태 확인 + 보관해 둔 작성 내용 복원
  useEffect(() => {
    setLoggedIn(isRunmoaLoggedIn());
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as {
          form?: Partial<typeof form>;
          attachments?: { url: string; name: string; size: number }[];
        };
        if (d.form) setForm((s) => ({ ...s, ...d.form }));
        if (Array.isArray(d.attachments)) setAttachments(d.attachments);
      }
    } catch {
      // 복원 실패는 무시 (새로 작성)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 작성 중인 내용을 보관 (로그인 다녀오기 전 호출) */
  const saveDraft = (
    f: typeof form = form,
    atts: typeof attachments = attachments,
  ) => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form: f, attachments: atts }));
    } catch {
      // 저장 실패 시 무시
    }
  };

  /** 내용 보관 후 런모아 로그인으로 이동 (완료되면 이 페이지로 복귀) */
  const goLogin = () => {
    saveDraft();
    startRunmoa("login");
  };

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

    // 로그인 필수: 비로그인 시 내용을 보관하고 로그인 안내 모달
    if (!isRunmoaLoggedIn()) {
      saveDraft();
      setShowLoginModal(true);
      return;
    }

    setPhase("submitting");
    setErrMsg(null);
    try {
      // 서버가 로그인 사용자만 받도록 Firebase ID 토큰 동봉
      const idToken = await auth.currentUser?.getIdToken().catch(() => null);
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          ...form,
          attachments: attachments.map((a) => a.url),
        }),
      });
      if (res.status === 401) {
        // 세션 만료 등 — 내용 보관 후 로그인 유도
        saveDraft();
        setPhase("idle");
        setShowLoginModal(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `요청 실패 (${res.status})`);
      }
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
      // 하단 문의 내역 리스트(InquiryList)에 즉시 반영
      window.dispatchEvent(new CustomEvent("inquiry:submitted"));
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
    <>
      {/* 비로그인 안내 — 작성은 가능하되 제출은 로그인 필요 */}
      {loggedIn === false && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="flex items-start gap-2 text-sm text-blue-900 leading-relaxed">
            <Lock className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            문의 제출은 <b>로그인 후 가능</b>합니다. 지금 작성하셔도 내용은 로그인
            후 그대로 유지됩니다.
          </p>
          <button
            type="button"
            onClick={goLogin}
            className="shrink-0 inline-flex items-center gap-1.5 self-start sm:self-auto sm:ml-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            <LogIn className="w-4 h-4" /> 간편 로그인
          </button>
        </div>
      )}

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
          placeholder="WITHCOM AI"
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

      {/* 로그인 요구 모달 — 작성 내용은 보관되어 로그인 후 그대로 복원 */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">
              로그인이 필요합니다
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-gray-500">
              문의 제출은 로그인 후 가능합니다.
              <br />
              <b className="text-gray-700">작성하신 내용은 그대로 보관</b>되어,
              로그인하면 이어서 제출할 수 있습니다.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={goLogin}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700"
              >
                <LogIn className="h-4 w-4" /> 로그인 하기
              </button>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="w-full rounded-lg py-3 text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                계속 작성하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
