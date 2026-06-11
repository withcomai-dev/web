import { Mail } from "lucide-react";
import { COMPANY } from "@/lib/constants";
import type { ContactSectionData } from "@/types/cms";
import InquiryForm from "./InquiryForm";
import InquiryList from "./InquiryList";

export default function ContactSection({ data }: { data: ContactSectionData }) {
  const email = data.email ?? COMPANY.email;
  return (
    <section id="contact" className="py-16 sm:py-24 bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
          <div className="lg:w-1/3 bg-blue-600 p-8 sm:p-10 lg:p-12 text-white">
            <h2 className="text-3xl font-bold mb-6">{data.title ?? "문의하기"}</h2>
            <p className="text-blue-100 mb-12">
              {data.description ??
                "스마트워크 도입, AI 컨설팅, IT 인프라 구축 등 궁금하신 점을 남겨주시면 전문가가 신속히 답변해 드립니다."}
            </p>
            <div className="space-y-6">
              <Info icon={<Mail className="w-5 h-5" />} label="이메일 문의" value={email} />
            </div>
          </div>
          <div className="lg:w-2/3 p-6 sm:p-10 lg:p-12">
            <InquiryForm />
          </div>
        </div>

        {/* 공개 문의 내역 — 이름 마스킹·내용 비공개 (contact 페이지에서만 showList로 켠다) */}
        {data.showList && <InquiryList />}
      </div>
    </section>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm text-blue-200">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </div>
  );
}
