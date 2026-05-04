"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Library } from "lucide-react";
import { uploadAsset, listAssets, type AssetItem } from "@/lib/storage-upload";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  height?: number;
  allowGallery?: boolean;
  accept?: string;
}

export default function ImageUploader({
  value,
  onChange,
  folder = "general",
  label = "이미지",
  height = 160,
  allowGallery = true,
  accept = "image/*",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress(20);
      setErr(null);
      try {
        setProgress(40);
        const res = await uploadAsset(file, folder);
        setProgress(100);
        onChange(res.url);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "업로드 실패");
      } finally {
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
        }, 400);
      }
    },
    [folder, onChange],
  );

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) void upload(file);
    };
    const prevent = (e: DragEvent) => e.preventDefault();
    el.addEventListener("drop", onDrop);
    el.addEventListener("dragover", prevent);
    return () => {
      el.removeEventListener("drop", onDrop);
      el.removeEventListener("dragover", prevent);
    };
  }, [upload]);

  return (
    <div>
      {label && (
        <p className="text-xs font-semibold text-gray-600 mb-1">{label}</p>
      )}
      <div
        ref={dropRef}
        className={cn(
          "relative rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:border-blue-400 transition-colors overflow-hidden",
          uploading && "opacity-70",
        )}
        style={{ minHeight: height }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt=""
              className="w-full object-cover"
              style={{ maxHeight: height * 1.4 }}
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full"
              title="제거"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm gap-2 px-4 text-center">
            <ImageIcon className="w-8 h-8" />
            <p>드래그하여 업로드 또는 아래 버튼</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-400 text-xs font-semibold disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" /> 파일 선택
        </button>
        {allowGallery && (
          <button
            type="button"
            onClick={() => setShowGallery(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-400 text-xs font-semibold"
          >
            <Library className="w-3.5 h-3.5" /> 갤러리에서 선택
          </button>
        )}
        <input
          type="text"
          value={value}
          placeholder="또는 URL 직접 입력"
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border border-gray-200 text-xs"
        />
      </div>
      {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}

      {showGallery && (
        <ImageGallery
          folder={folder}
          onSelect={(url) => {
            onChange(url);
            setShowGallery(false);
          }}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}

function ImageGallery({
  folder,
  onSelect,
  onClose,
}: {
  folder: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listAssets(folder)
      .then(setItems)
      .catch((e) => setErr(e instanceof Error ? e.message : "목록 실패"))
      .finally(() => setLoading(false));
  }, [folder]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold">갤러리 — {folder}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : err ? (
            <p className="text-rose-600 text-center py-10">{err}</p>
          ) : items.length === 0 ? (
            <p className="text-gray-500 text-center py-10">자산이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {items.map((it) => (
                <button
                  key={it.path}
                  onClick={() => onSelect(it.url)}
                  className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 hover:scale-105 transition-all"
                >
                  <img
                    src={it.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
