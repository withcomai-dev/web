"use client";
import { authedFetch } from "@/lib/authed-fetch";

import { useEffect, useState, useCallback } from "react";
import {
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Loader2,
  Check,
  ExternalLink,
  Sparkles,
  X,
} from "lucide-react";
import {
  COLLECTIONS,
  PAGE_DOC_ID,
  getSingletonDoc,
  setSingletonDoc,
} from "@/lib/firestore";
import {
  snapshotPageVersion,
  listPageVersions,
  restorePageVersion,
  type PageVersion,
} from "@/lib/page-versions";
import {
  loadRegistry,
  addPage,
  renamePage,
  deletePage,
  isValidKey,
  normalizeSlug,
} from "@/lib/page-registry";
import type { PageRegistryEntry } from "@/types/cms";
import { History, Plus as PlusIcon, Pencil } from "lucide-react";
import { ALL_PAGE_SEEDS } from "@/lib/seed-data";
import type { PageDoc, Section, SectionType } from "@/types/cms";
import { cn } from "@/lib/utils";
import RichEditor from "@/components/admin/RichEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import SectionItemsEditor from "@/components/admin/SectionItemsEditor";

// PAGE_KEYS는 더 이상 하드코딩하지 않습니다 — Firestore page-registry에서 로드.

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: "hero", label: "Hero (풀스크린 헤더)" },
  { value: "cards", label: "Cards (카드 그리드)" },
  { value: "feature", label: "Feature (좌우 분할)" },
  { value: "blog", label: "Blog (콘텐츠 카드 3종)" },
  { value: "services", label: "Services (외부 링크 카드)" },
  { value: "contact", label: "Contact (문의 폼 + 연락처)" },
  { value: "richtext", label: "RichText (HTML 본문)" },
  { value: "cta", label: "CTA (행동 유도)" },
  { value: "image", label: "Image (단일 이미지)" },
];

function newSection(type: SectionType, order: number): Section {
  const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  switch (type) {
    case "hero":
      return { id, order, visible: true, type, data: { title: "새 헤더" } };
    case "cards":
      return { id, order, visible: true, type, data: { items: [] } };
    case "feature":
      return { id, order, visible: true, type, data: { title: "새 기능", items: [] } };
    case "richtext":
      return { id, order, visible: true, type, data: { html: "<p>본문을 입력하세요.</p>" } };
    case "cta":
      return {
        id,
        order,
        visible: true,
        type,
        data: { title: "지금 시작하기", button: { label: "신청", href: "/contact" } },
      };
    case "image":
      return { id, order, visible: true, type, data: { src: "", alt: "" } };
    case "blog":
      return {
        id,
        order,
        visible: true,
        type,
        data: { title: "콘텐츠", items: [] },
      };
    case "services":
      return { id, order, visible: true, type, data: { items: [] } };
    case "contact":
      return {
        id,
        order,
        visible: true,
        type,
        data: { title: "문의하기" },
      };
  }
}

export default function AdminPagesEditor() {
  const [registry, setRegistry] = useState<PageRegistryEntry[]>([]);
  const [activeKey, setActiveKey] = useState<string>("home");
  const [page, setPage] = useState<PageDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pageOps, setPageOps] = useState<"none" | "new" | "rename">("none");

  const reloadRegistry = useCallback(async () => {
    const reg = await loadRegistry();
    setRegistry(reg);
    if (!reg.some((p) => p.key === activeKey)) {
      setActiveKey(reg[0]?.key ?? "home");
    }
  }, [activeKey]);

  useEffect(() => {
    void reloadRegistry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeEntry = registry.find((p) => p.key === activeKey);

  const handleAddPage = async (data: { key: string; title: string; slug: string }) => {
    await addPage(data);
    await reloadRegistry();
    setActiveKey(data.key);
    setPageOps("none");
  };

  const handleRenamePage = async (newTitle: string, newSlug?: string) => {
    if (!activeEntry) return;
    await renamePage(activeEntry.key, newTitle, newSlug);
    await reloadRegistry();
    setPageOps("none");
  };

  const handleDeletePage = async () => {
    if (!activeEntry || activeEntry.isBuiltIn) return;
    if (!confirm(`정말 '${activeEntry.title}' 페이지를 삭제하시겠습니까? 본문·섹션·이전 버전이 모두 삭제됩니다.`)) return;
    await deletePage(activeEntry.key);
    await reloadRegistry();
  };

  const load = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const remote = await getSingletonDoc<PageDoc>(
        COLLECTIONS.SETTINGS,
        PAGE_DOC_ID(key),
      );
      if (remote && remote.sections) {
        setPage(remote);
      } else {
        const seed = ALL_PAGE_SEEDS.find((p) => p.key === key);
        setPage(seed ?? { key, title: key, sections: [] });
      }
    } catch {
      const seed = ALL_PAGE_SEEDS.find((p) => p.key === key);
      setPage(seed ?? { key, title: key, sections: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeKey);
  }, [activeKey, load]);

  const save = async () => {
    if (!page) return;
    setSaving(true);
    try {
      // 버전 스냅샷 (현재 저장된 본을 백업) — 새 저장 직전
      const existing = await getSingletonDoc<PageDoc>(
        COLLECTIONS.SETTINGS,
        PAGE_DOC_ID(page.key),
      );
      if (existing && existing.sections) {
        await snapshotPageVersion(existing);
      }

      await setSingletonDoc(COLLECTIONS.SETTINGS, PAGE_DOC_ID(page.key), {
        key: page.key,
        title: page.title,
        sections: page.sections,
        seoTitle: page.seoTitle ?? "",
        seoDescription: page.seoDescription ?? "",
      });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const openHistory = async () => {
    setHistoryOpen(true);
    const v = await listPageVersions(activeKey);
    setVersions(v);
  };
  const restore = async (v: PageVersion) => {
    if (!confirm(`${new Date((typeof v.savedAt === "string" ? v.savedAt : v.savedAt?.toDate().toISOString()) ?? "").toLocaleString("ko-KR")} 버전으로 복원하시겠습니까?`)) return;
    await restorePageVersion(activeKey, v);
    setHistoryOpen(false);
    await load(activeKey);
  };

  const openPreview = () => {
    if (!page) return;
    sessionStorage.setItem(`withcom.preview.${page.key}`, JSON.stringify(page));
    window.open(`/preview/${page.key}`, "_blank", "noopener");
  };

  const [aiOpen, setAiOpen] = useState(false);
  const applyAIPage = (newSections: Section[]) => {
    if (!page) return;
    setPage({ ...page, sections: newSections });
    setAiOpen(false);
  };

  const updateSection = (idx: number, patch: Partial<Section>) => {
    if (!page) return;
    const next = [...page.sections];
    next[idx] = { ...next[idx], ...patch };
    setPage({ ...page, sections: next });
  };

  const updateData = (idx: number, patch: object) => {
    if (!page) return;
    const next = [...page.sections];
    next[idx] = { ...next[idx], data: { ...(next[idx].data ?? {}), ...patch } };
    setPage({ ...page, sections: next });
  };

  const move = (idx: number, dir: -1 | 1) => {
    if (!page) return;
    const target = idx + dir;
    if (target < 0 || target >= page.sections.length) return;
    const next = [...page.sections];
    [next[idx], next[target]] = [next[target], next[idx]];
    next.forEach((s, i) => (s.order = i + 1));
    setPage({ ...page, sections: next });
  };

  const remove = (idx: number) => {
    if (!page) return;
    if (!confirm("이 섹션을 삭제하시겠습니까?")) return;
    const next = page.sections.filter((_, i) => i !== idx);
    next.forEach((s, i) => (s.order = i + 1));
    setPage({ ...page, sections: next });
  };

  const add = (type: SectionType) => {
    if (!page) return;
    const order = page.sections.length + 1;
    setPage({ ...page, sections: [...page.sections, newSection(type, order)] });
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );

  return (
    <div>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">페이지·섹션 편집</h1>
          <p className="text-sm text-gray-500 mt-1">
            페이지를 선택하고 섹션을 추가·수정·삭제·정렬하세요.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {savedAt && (
            <span className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg">
              <Check className="w-4 h-4" /> 저장됨
            </span>
          )}
          <button
            onClick={() => setAiOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold text-sm"
          >
            <Sparkles className="w-4 h-4" /> AI로 페이지 생성
          </button>
          <button
            onClick={openHistory}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold"
          >
            <History className="w-4 h-4" /> 이전 버전
          </button>
          <button
            onClick={openPreview}
            disabled={!page}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold disabled:opacity-50"
          >
            <ExternalLink className="w-4 h-4" /> 미리보기
          </button>
          <button
            onClick={save}
            disabled={saving || !page}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            저장
          </button>
        </div>
      </header>
      {aiOpen && (
        <AIPageGenModal
          pageKey={activeKey}
          pageTitle={activeEntry?.title ?? activeKey}
          onClose={() => setAiOpen(false)}
          onApply={applyAIPage}
        />
      )}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-2xl">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold">이전 버전 — {activeEntry?.title}</h2>
              </div>
              <button onClick={() => setHistoryOpen(false)} className="p-1.5 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {versions.length === 0 ? (
                <p className="text-center text-gray-500 py-10 text-sm">이전 버전이 없습니다.</p>
              ) : (
                versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-300"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {v.savedAt
                          ? typeof v.savedAt === "string"
                            ? new Date(v.savedAt).toLocaleString("ko-KR")
                            : v.savedAt.toDate().toLocaleString("ko-KR")
                          : "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        섹션 {v.sections?.length ?? 0}개 · {v.savedBy ?? "?"}
                      </p>
                    </div>
                    <button
                      onClick={() => restore(v)}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                    >
                      복원
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {registry.map((p) => (
          <button
            key={p.key}
            onClick={() => setActiveKey(p.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold border transition-colors inline-flex items-center gap-1.5",
              activeKey === p.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300",
            )}
          >
            {p.title}
            {!p.isBuiltIn && (
              <span className="text-[10px] opacity-60">·{p.slug}</span>
            )}
          </button>
        ))}
        <button
          onClick={() => setPageOps("new")}
          className="px-3 py-2 rounded-lg text-sm font-semibold border-2 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 inline-flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" /> 새 페이지
        </button>
      </div>

      {activeEntry && (
        <div className="flex items-center gap-2 mb-6 text-xs text-gray-500">
          <span className="font-mono px-2 py-0.5 rounded bg-gray-100">
            key={activeEntry.key}
          </span>
          <span className="font-mono px-2 py-0.5 rounded bg-gray-100">
            {activeEntry.slug}
          </span>
          {activeEntry.isBuiltIn && (
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">내장</span>
          )}
          <button
            onClick={() => setPageOps("rename")}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-100 text-gray-600"
          >
            <Pencil className="w-3 h-3" /> 이름·슬러그 변경
          </button>
          {!activeEntry.isBuiltIn && (
            <button
              onClick={handleDeletePage}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-rose-50 text-rose-600"
            >
              <Trash2 className="w-3 h-3" /> 페이지 삭제
            </button>
          )}
        </div>
      )}

      {pageOps === "new" && (
        <NewPageModal
          onClose={() => setPageOps("none")}
          onSubmit={handleAddPage}
        />
      )}
      {pageOps === "rename" && activeEntry && (
        <RenamePageModal
          entry={activeEntry}
          onClose={() => setPageOps("none")}
          onSubmit={handleRenamePage}
        />
      )}

      {page && (
        <div className="space-y-3">
          {page.sections.map((s, idx) => (
            <div
              key={s.id}
              className={cn(
                "bg-white rounded-xl border transition-all",
                editingId === s.id ? "border-blue-400 shadow-md" : "border-gray-200",
              )}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400">#{idx + 1}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                    {s.type}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {sectionTitle(s)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <IconBtn
                    title="위로"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </IconBtn>
                  <IconBtn
                    title="아래로"
                    onClick={() => move(idx, 1)}
                    disabled={idx === page.sections.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </IconBtn>
                  <IconBtn
                    title={s.visible ? "숨김 처리" : "보이기"}
                    onClick={() => updateSection(idx, { visible: !s.visible })}
                  >
                    {s.visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </IconBtn>
                  <IconBtn title="삭제" onClick={() => remove(idx)} danger>
                    <Trash2 className="w-4 h-4" />
                  </IconBtn>
                  <button
                    onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                    className="ml-2 px-3 py-1.5 rounded text-xs font-semibold bg-gray-100 hover:bg-gray-200"
                  >
                    {editingId === s.id ? "닫기" : "편집"}
                  </button>
                </div>
              </div>

              {editingId === s.id && (
                <div className="border-t border-gray-100 p-4">
                  <SectionForm
                    section={s}
                    onChange={(patch) => updateData(idx, patch)}
                  />
                </div>
              )}
            </div>
          ))}

          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" /> 섹션 추가
            </p>
            <div className="flex flex-wrap gap-2">
              {SECTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => add(t.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-400 text-sm text-gray-700 hover:text-blue-600"
                >
                  + {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function sectionTitle(s: Section): string {
  const d = s.data as unknown as Record<string, unknown>;
  if (typeof d.title === "string") return d.title;
  if (s.type === "richtext") return "(본문)";
  if (s.type === "image") return (d.alt as string) || "(이미지)";
  return s.type;
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded hover:bg-gray-100 disabled:opacity-30",
        danger && "hover:bg-rose-50 hover:text-rose-600",
      )}
    >
      {children}
    </button>
  );
}

function SectionForm({
  section,
  onChange,
}: {
  section: Section;
  onChange: (patch: object) => void;
}) {
  const d = section.data as unknown as Record<string, unknown>;

  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <Input
            label="Eyebrow"
            value={(d.eyebrow as string) ?? ""}
            onChange={(v) => onChange({ eyebrow: v })}
          />
          <Input
            label="제목 (HTML 가능)"
            value={(d.title as string) ?? ""}
            onChange={(v) => onChange({ title: v })}
          />
          <Textarea
            label="부제"
            value={(d.subtitle as string) ?? ""}
            onChange={(v) => onChange({ subtitle: v })}
          />
          <ImageUploader
            label="배경 이미지"
            folder="hero"
            value={(d.bgImage as string) ?? ""}
            onChange={(url) => onChange({ bgImage: url })}
            height={140}
          />
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">CTA 버튼</label>
            <SectionItemsEditor
              schema="cta"
              items={(d.ctas as Record<string, unknown>[]) ?? []}
              onChange={(next) => onChange({ ctas: next })}
              folder="hero"
            />
          </div>
        </div>
      );
    case "cards":
      return (
        <div className="space-y-3">
          <Input label="Eyebrow" value={(d.eyebrow as string) ?? ""} onChange={(v) => onChange({ eyebrow: v })} />
          <Input label="제목" value={(d.title as string) ?? ""} onChange={(v) => onChange({ title: v })} />
          <Textarea label="설명" value={(d.description as string) ?? ""} onChange={(v) => onChange({ description: v })} />
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">카드 항목</label>
            <SectionItemsEditor
              schema="card"
              items={(d.items as Record<string, unknown>[]) ?? []}
              onChange={(next) => onChange({ items: next })}
              folder="cards"
            />
          </div>
        </div>
      );
    case "feature":
      return (
        <div className="space-y-3">
          <Input label="Eyebrow" value={(d.eyebrow as string) ?? ""} onChange={(v) => onChange({ eyebrow: v })} />
          <Input label="제목" value={(d.title as string) ?? ""} onChange={(v) => onChange({ title: v })} />
          <ImageUploader
            label="이미지"
            folder="feature"
            value={(d.image as string) ?? ""}
            onChange={(url) => onChange({ image: url })}
            height={140}
          />
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">기능 항목</label>
            <SectionItemsEditor
              schema="card"
              items={(d.items as Record<string, unknown>[]) ?? []}
              onChange={(next) => onChange({ items: next })}
              folder="feature"
            />
          </div>
        </div>
      );
    case "richtext":
      return (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">본문</label>
          <RichEditor
            value={(d.html as string) ?? ""}
            onChange={(html) => onChange({ html })}
            folder="richtext"
            minHeight={280}
          />
        </div>
      );
    case "cta":
      return (
        <div className="space-y-3">
          <Input label="제목" value={(d.title as string) ?? ""} onChange={(v) => onChange({ title: v })} />
          <Textarea label="본문" value={(d.body as string) ?? ""} onChange={(v) => onChange({ body: v })} />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="버튼 라벨"
              value={((d.button as { label?: string })?.label) ?? ""}
              onChange={(v) =>
                onChange({ button: { ...(d.button as object), label: v } })
              }
            />
            <Input
              label="버튼 링크"
              value={((d.button as { href?: string })?.href) ?? ""}
              onChange={(v) =>
                onChange({ button: { ...(d.button as object), href: v } })
              }
            />
          </div>
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <ImageUploader
            label="이미지"
            folder="page-image"
            value={(d.src as string) ?? ""}
            onChange={(url) => onChange({ src: url })}
            height={160}
          />
          <Input label="대체 텍스트" value={(d.alt as string) ?? ""} onChange={(v) => onChange({ alt: v })} />
          <Input label="캡션" value={(d.caption as string) ?? ""} onChange={(v) => onChange({ caption: v })} />
          <Input label="링크 (선택)" value={(d.href as string) ?? ""} onChange={(v) => onChange({ href: v })} />
        </div>
      );
    case "blog":
      return (
        <div className="space-y-3">
          <Input label="Eyebrow" value={(d.eyebrow as string) ?? ""} onChange={(v) => onChange({ eyebrow: v })} />
          <Input label="제목" value={(d.title as string) ?? ""} onChange={(v) => onChange({ title: v })} />
          <Input
            label="전체 보기 링크"
            value={(d.viewAllHref as string) ?? ""}
            onChange={(v) => onChange({ viewAllHref: v })}
          />
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">콘텐츠 카드</label>
            <SectionItemsEditor
              schema="blog"
              items={(d.items as Record<string, unknown>[]) ?? []}
              onChange={(next) => onChange({ items: next })}
              folder="blog"
            />
          </div>
        </div>
      );
    case "services":
      return (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">서비스 카드</label>
          <SectionItemsEditor
            schema="service"
            items={(d.items as Record<string, unknown>[]) ?? []}
            onChange={(next) => onChange({ items: next })}
            folder="services"
          />
        </div>
      );
    case "contact":
      return (
        <div className="space-y-3">
          <Input
            label="제목 (기본: 문의하기)"
            value={(d.title as string) ?? ""}
            onChange={(v) => onChange({ title: v })}
          />
          <Textarea
            label="설명"
            value={(d.description as string) ?? ""}
            onChange={(v) => onChange({ description: v })}
          />
          <p className="text-xs text-gray-500">
            아래 3개 필드를 비우면 회사 기본 연락처(constants)를 사용합니다.
          </p>
          <Input
            label="전화 (선택)"
            value={(d.phone as string) ?? ""}
            onChange={(v) => onChange({ phone: v })}
          />
          <Input
            label="이메일 (선택)"
            value={(d.email as string) ?? ""}
            onChange={(v) => onChange({ email: v })}
          />
          <Input
            label="주소 (선택)"
            value={(d.address as string) ?? ""}
            onChange={(v) => onChange({ address: v })}
          />
        </div>
      );
  }
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded border border-gray-200 outline-none focus:border-blue-500 text-sm"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded border border-gray-200 outline-none focus:border-blue-500 text-sm font-mono"
      />
    </div>
  );
}

function AIPageGenModal({
  pageKey,
  pageTitle,
  onClose,
  onApply,
}: {
  pageKey: string;
  pageTitle: string;
  onClose: () => void;
  onApply: (sections: Section[]) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly" | "marketing">(
    "professional",
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<Section[] | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setErr(null);
    setPreview(null);
    try {
      const res = await authedFetch("/api/ai/page-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tone, pageKey, pageTitle }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `요청 실패 (${res.status})`);
      }
      const data = (await res.json()) as { sections: Section[] };
      setPreview(data.sections);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI 호출 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold">AI로 페이지 생성</h2>
            <span className="text-xs text-gray-400">({pageTitle})</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              어떤 페이지를 만들까요?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="예) 중소기업 대상 AI 도구 도입 가이드 페이지. Hero + 4개 도구 카드 + 도입 효과 + 상담 신청 CTA."
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">톤</label>
            <select
              value={tone}
              onChange={(e) =>
                setTone(e.target.value as "professional" | "friendly" | "marketing")
              }
              className="px-3 py-2 rounded border border-gray-200 text-sm"
            >
              <option value="professional">전문적</option>
              <option value="friendly">친근한</option>
              <option value="marketing">마케팅 (강조 톤)</option>
            </select>
          </div>
          {err && <p className="text-sm text-rose-600">{err}</p>}

          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? "생성 중... (10-20초)" : "생성하기"}
          </button>

          {preview && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                생성된 섹션 ({preview.length}개):
              </p>
              <ul className="space-y-1 mb-4">
                {preview.map((s, i) => (
                  <li key={i} className="text-sm">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold mr-2">
                      {s.type}
                    </span>
                    {(s.data as Record<string, unknown>).title as string ?? ""}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 mb-3">
                ⚠️ 적용하면 현재 섹션이 모두 교체됩니다. 미리 저장해두세요.
              </p>
              <button
                onClick={() => onApply(preview)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
              >
                <Check className="w-4 h-4" /> 이 섹션들로 교체
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewPageModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: { key: string; title: string; slug: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 제목 입력 시 key·slug 자동 제안
  const onTitleChange = (v: string) => {
    setTitle(v);
    const auto = v
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 30);
    if (!key) setKey(auto.replace(/[가-힣]/g, "x") || `page-${Date.now() % 10000}`);
    if (!slug) setSlug("/" + auto);
  };

  const submit = async () => {
    if (!isValidKey(key)) {
      setErr("키는 영문 소문자·숫자·하이픈만 가능합니다 (예: case-study)");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({ key, title, slug: normalizeSlug(slug) });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold">새 페이지</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="예: 사례 연구"
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              키 (Firestore 문서 ID)
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase())}
              placeholder="case-study"
              className="w-full px-3 py-2 rounded border border-gray-200 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              영문 소문자·숫자·하이픈만. 한 번 만들면 변경 불가.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">슬러그 (URL)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="/case-study"
              className="w-full px-3 py-2 rounded border border-gray-200 font-mono text-sm"
            />
          </div>
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
              취소
            </button>
            <button
              onClick={submit}
              disabled={busy || !title.trim() || !key.trim() || !slug.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RenamePageModal({
  entry,
  onClose,
  onSubmit,
}: {
  entry: PageRegistryEntry;
  onClose: () => void;
  onSubmit: (newTitle: string, newSlug?: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(entry.title);
  const [slug, setSlug] = useState(entry.slug);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onSubmit(title, entry.isBuiltIn ? undefined : slug);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "수정 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold">페이지 이름 변경</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">슬러그 (URL)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={entry.isBuiltIn}
              className="w-full px-3 py-2 rounded border border-gray-200 font-mono text-sm disabled:bg-gray-50"
            />
            {entry.isBuiltIn && (
              <p className="mt-1 text-xs text-gray-500">
                내장 페이지의 슬러그는 변경할 수 없습니다.
              </p>
            )}
          </div>
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
              취소
            </button>
            <button
              onClick={submit}
              disabled={busy || !title.trim() || (!entry.isBuiltIn && !slug.trim())}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
