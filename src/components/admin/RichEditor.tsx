"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Undo2,
  Redo2,
  Sparkles,
  Loader2,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadAsset } from "@/lib/storage-upload";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  folder?: string;
  enableAI?: boolean;
  minHeight?: number;
}

export default function RichEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  folder = "rich-content",
  enableAI = true,
  minHeight = 280,
}: Props) {
  const [aiLoading, setAiLoading] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full" } }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline" },
      }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose-content focus:outline-none px-4 py-3 max-w-none min-h-[200px]",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value && !editor.isFocused) {
      editor.commands.setContent(value || "<p></p>", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const askLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
  };

  const insertImage = () => fileInput.current?.click();

  const handleFile = async (file: File) => {
    try {
      const res = await uploadAsset(file, folder);
      editor.chain().focus().setImage({ src: res.url, alt: file.name }).run();
    } catch (e) {
      alert(e instanceof Error ? e.message : "업로드 실패");
    }
  };

  const insertTable = () =>
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  const aiAssist = async (mode: "polish" | "summarize" | "expand") => {
    const selection = editor.state.selection;
    const text = editor.state.doc.textBetween(selection.from, selection.to, "\n");
    if (!text.trim()) {
      alert("텍스트를 선택한 뒤 AI 보조를 사용하세요.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/refine-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const data = (await res.json()) as { result: string };
      editor.chain().focus().deleteRange({ from: selection.from, to: selection.to }).insertContent(data.result).run();
    } catch (e) {
      alert(e instanceof Error ? e.message : "AI 호출 실패");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <Toolbar
        editor={editor}
        onLink={askLink}
        onImage={insertImage}
        onTable={insertTable}
        onAI={enableAI ? aiAssist : undefined}
        aiLoading={aiLoading}
        showHtml={showHtml}
        onToggleHtml={() => setShowHtml((v) => !v)}
      />
      {showHtml ? (
        <textarea
          value={editor.getHTML()}
          onChange={(e) => {
            editor.commands.setContent(e.target.value, true);
          }}
          rows={Math.max(10, Math.floor(minHeight / 24))}
          className="w-full px-4 py-3 font-mono text-sm border-t border-gray-100 outline-none"
        />
      ) : (
        <EditorContent editor={editor} style={{ minHeight }} />
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          if (fileInput.current) fileInput.current.value = "";
        }}
      />
    </div>
  );
}

function Toolbar({
  editor,
  onLink,
  onImage,
  onTable,
  onAI,
  aiLoading,
  showHtml,
  onToggleHtml,
}: {
  editor: Editor;
  onLink: () => void;
  onImage: () => void;
  onTable: () => void;
  onAI?: (mode: "polish" | "summarize" | "expand") => void;
  aiLoading: boolean;
  showHtml: boolean;
  onToggleHtml: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
      <Btn
        title="굵게"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" />
      </Btn>
      <Btn
        title="기울임"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" />
      </Btn>
      <Btn
        title="밑줄"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="w-4 h-4" />
      </Btn>
      <Btn
        title="취소선"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="w-4 h-4" />
      </Btn>
      <Sep />
      <Btn
        title="H1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="w-4 h-4" />
      </Btn>
      <Btn
        title="H2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="w-4 h-4" />
      </Btn>
      <Btn
        title="H3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="w-4 h-4" />
      </Btn>
      <Sep />
      <Btn
        title="글머리"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="w-4 h-4" />
      </Btn>
      <Btn
        title="번호 매김"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="w-4 h-4" />
      </Btn>
      <Btn
        title="인용"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="w-4 h-4" />
      </Btn>
      <Btn
        title="코드"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="w-4 h-4" />
      </Btn>
      <Sep />
      <Btn title="링크" onClick={onLink}>
        <Link2 className="w-4 h-4" />
      </Btn>
      <Btn title="이미지" onClick={onImage}>
        <ImageIcon className="w-4 h-4" />
      </Btn>
      <Btn title="표" onClick={onTable}>
        <TableIcon className="w-4 h-4" />
      </Btn>
      <Btn
        title="가로선"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="w-4 h-4" />
      </Btn>
      <Sep />
      <Btn
        title="실행 취소"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="w-4 h-4" />
      </Btn>
      <Btn
        title="다시 실행"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="w-4 h-4" />
      </Btn>
      {onAI && (
        <>
          <Sep />
          <div className="relative group">
            <Btn title="AI 보조" onClick={() => {}}>
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-violet-600" />
              )}
            </Btn>
            <div className="hidden group-hover:flex absolute top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg p-1 z-20 min-w-[120px] flex-col">
              <button
                onClick={() => onAI("polish")}
                className="text-left px-3 py-1.5 hover:bg-blue-50 rounded text-xs"
              >
                ✨ 다듬기
              </button>
              <button
                onClick={() => onAI("summarize")}
                className="text-left px-3 py-1.5 hover:bg-blue-50 rounded text-xs"
              >
                📝 요약
              </button>
              <button
                onClick={() => onAI("expand")}
                className="text-left px-3 py-1.5 hover:bg-blue-50 rounded text-xs"
              >
                ➕ 확장
              </button>
            </div>
          </div>
        </>
      )}
      <div className="flex-1" />
      <Btn
        title="HTML 보기"
        active={showHtml}
        onClick={onToggleHtml}
      >
        <Code2 className="w-4 h-4" />
      </Btn>
    </div>
  );
}

function Btn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded hover:bg-gray-200 transition-colors",
        active && "bg-blue-100 text-blue-700",
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-gray-300 mx-1" />;
}
