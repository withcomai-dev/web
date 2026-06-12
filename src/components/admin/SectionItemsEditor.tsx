"use client";

import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import ImageUploader from "./ImageUploader";
import { cn } from "@/lib/utils";

type ItemSchema =
  | "card" // {icon?, title, body, href?}
  | "blog" // {category, date, title, summary, thumbnail, href?}
  | "service" // {icon, title, body, href, external?, bg, ctaLabel?}
  | "cta"; // {label, href, variant?}

interface Props<T extends Record<string, unknown>> {
  schema: ItemSchema;
  items: T[];
  onChange: (next: T[]) => void;
  folder?: string;
}

const ICON_OPTIONS = [
  "cpu",
  "zap",
  "message-square",
  "shield-check",
  "users",
  "monitor",
  "shopping-bag",
  "headphones",
  "youtube",
  "globe",
  "sparkles",
  "book-open",
  "bot",
  "cloud",
  "database",
  "settings",
  "store",
  "flask",
];

const BG_OPTIONS = ["blue", "slate", "rose", "emerald"];

export default function SectionItemsEditor<T extends Record<string, unknown>>({
  schema,
  items,
  onChange,
  folder = "sections",
}: Props<T>) {
  const update = (idx: number, patch: Partial<T>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const remove = (idx: number) => {
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    onChange(items.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const add = () => {
    const newItem = createDefault(schema) as T;
    onChange([...items, newItem]);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-lg">
          아이템이 없습니다. 아래에서 추가하세요.
        </p>
      )}

      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-gray-500">#{idx + 1}</span>
            <div className="flex items-center gap-1">
              <IconBtn onClick={() => move(idx, -1)} disabled={idx === 0} title="위로">
                <ChevronUp className="w-4 h-4" />
              </IconBtn>
              <IconBtn
                onClick={() => move(idx, 1)}
                disabled={idx === items.length - 1}
                title="아래로"
              >
                <ChevronDown className="w-4 h-4" />
              </IconBtn>
              <IconBtn onClick={() => remove(idx)} title="삭제" danger>
                <Trash2 className="w-4 h-4" />
              </IconBtn>
            </div>
          </div>
          <ItemFields
            schema={schema}
            item={item}
            onUpdate={(patch) => update(idx, patch as Partial<T>)}
            folder={folder}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> 항목 추가
      </button>
    </div>
  );
}

function ItemFields({
  schema,
  item,
  onUpdate,
  folder,
}: {
  schema: ItemSchema;
  item: Record<string, unknown>;
  onUpdate: (patch: Record<string, unknown>) => void;
  folder: string;
}) {
  switch (schema) {
    case "card":
      return (
        <div className="space-y-2">
          <Row label="아이콘">
            <select
              value={(item.icon as string) ?? ""}
              onChange={(e) => onUpdate({ icon: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            >
              <option value="">(아이콘 없음)</option>
              {ICON_OPTIONS.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </Row>
          <Row label="제목">
            <input
              type="text"
              value={(item.title as string) ?? ""}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            />
          </Row>
          <Row label="본문">
            <textarea
              value={(item.body as string) ?? ""}
              onChange={(e) => onUpdate({ body: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            />
          </Row>
          <Row label="링크 (선택 — 입력 시 카드가 클릭됩니다)">
            <input
              type="text"
              value={(item.href as string) ?? ""}
              onChange={(e) => onUpdate({ href: e.target.value })}
              placeholder="/ai-tools?cat=ai-assistant"
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            />
          </Row>
        </div>
      );
    case "blog":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Row label="카테고리">
              <input
                type="text"
                value={(item.category as string) ?? ""}
                onChange={(e) => onUpdate({ category: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
              />
            </Row>
            <Row label="날짜">
              <input
                type="text"
                value={(item.date as string) ?? ""}
                onChange={(e) => onUpdate({ date: e.target.value })}
                placeholder="2024.03.20"
                className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
              />
            </Row>
          </div>
          <Row label="제목">
            <input
              type="text"
              value={(item.title as string) ?? ""}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            />
          </Row>
          <Row label="요약">
            <textarea
              value={(item.summary as string) ?? ""}
              onChange={(e) => onUpdate({ summary: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            />
          </Row>
          <Row label="링크 (선택)">
            <input
              type="text"
              value={(item.href as string) ?? ""}
              onChange={(e) => onUpdate({ href: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            />
          </Row>
          <ImageUploader
            label="썸네일"
            folder={folder}
            value={(item.thumbnail as string) ?? ""}
            onChange={(url) => onUpdate({ thumbnail: url })}
            height={120}
          />
        </div>
      );
    case "service":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Row label="아이콘">
              <select
                value={(item.icon as string) ?? ""}
                onChange={(e) => onUpdate({ icon: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
              >
                {ICON_OPTIONS.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </Row>
            <Row label="배경">
              <select
                value={(item.bg as string) ?? "blue"}
                onChange={(e) => onUpdate({ bg: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
              >
                {BG_OPTIONS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Row>
          </div>
          <Row label="제목">
            <input
              type="text"
              value={(item.title as string) ?? ""}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            />
          </Row>
          <Row label="본문">
            <input
              type="text"
              value={(item.body as string) ?? ""}
              onChange={(e) => onUpdate({ body: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            />
          </Row>
          <div className="grid grid-cols-2 gap-2">
            <Row label="링크">
              <input
                type="text"
                value={(item.href as string) ?? ""}
                onChange={(e) => onUpdate({ href: e.target.value })}
                className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
              />
            </Row>
            <Row label="버튼 라벨">
              <input
                type="text"
                value={(item.ctaLabel as string) ?? ""}
                onChange={(e) => onUpdate({ ctaLabel: e.target.value })}
                placeholder="바로가기"
                className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
              />
            </Row>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={(item.external as boolean) ?? false}
              onChange={(e) => onUpdate({ external: e.target.checked })}
            />
            새 창에서 열기
          </label>
        </div>
      );
    case "cta":
      return (
        <div className="space-y-2">
          <Row label="라벨">
            <input
              type="text"
              value={(item.label as string) ?? ""}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            />
          </Row>
          <Row label="링크">
            <input
              type="text"
              value={(item.href as string) ?? ""}
              onChange={(e) => onUpdate({ href: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            />
          </Row>
          <Row label="스타일">
            <select
              value={(item.variant as string) ?? "primary"}
              onChange={(e) => onUpdate({ variant: e.target.value })}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm bg-white"
            >
              <option value="primary">파란 버튼 (primary)</option>
              <option value="ghost">투명 버튼 (ghost)</option>
            </select>
          </Row>
        </div>
      );
  }
}

function createDefault(schema: ItemSchema): Record<string, unknown> {
  switch (schema) {
    case "card":
      return { icon: "cpu", title: "새 카드", body: "내용을 입력하세요." };
    case "blog":
      return {
        category: "카테고리",
        date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
        title: "새 콘텐츠",
        summary: "",
        thumbnail: "",
        href: "",
      };
    case "service":
      return {
        icon: "shopping-bag",
        title: "새 서비스",
        body: "",
        href: "",
        external: true,
        bg: "blue",
        ctaLabel: "바로가기",
      };
    case "cta":
      return { label: "버튼", href: "/", variant: "primary" };
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
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
        "p-1 rounded hover:bg-white disabled:opacity-30",
        danger && "hover:bg-rose-50 hover:text-rose-600",
      )}
    >
      {children}
    </button>
  );
}
