"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadMemberGrades, gradesWithGuest } from "@/lib/grades";
import type { MemberGrade } from "@/types/cms";
import { cn } from "@/lib/utils";

/**
 * 콘텐츠/AI TOOL 편집기용 "열람 허용 등급" 다중선택 (요청 20260701 #8).
 * 아무것도 선택하지 않으면 전체 공개.
 */
export default function GradeAccessSelect({
  value,
  onChange,
}: {
  value?: string[];
  onChange: (v: string[]) => void;
}) {
  const [grades, setGrades] = useState<MemberGrade[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadMemberGrades().then((g) => {
      setGrades(g);
      setLoaded(true);
    });
  }, []);

  const selected = value ?? [];
  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );

  const options = gradesWithGuest(grades);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((g) => {
          const on = selected.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggle(g.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors",
                on
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300",
              )}
            >
              {g.label}
            </button>
          );
        })}
      </div>
      {loaded && grades.length === 0 && (
        <p className="text-xs text-gray-400">
          아직 만든 회원 등급이 없습니다.{" "}
          <Link href="/admin/grades" className="text-blue-600 underline">
            회원 등급
          </Link>{" "}
          메뉴에서 등급을 추가하면 여기에 나타납니다. (비회원 기본등급은 항상 사용 가능)
        </p>
      )}
      <p className="text-xs text-gray-400">
        {selected.length === 0
          ? "선택 안 함 = 전체 공개 (비회원 포함 모든 방문자에게 노출)"
          : "선택한 등급에게만 노출됩니다. (관리자는 항상 열람)"}
      </p>
    </div>
  );
}
