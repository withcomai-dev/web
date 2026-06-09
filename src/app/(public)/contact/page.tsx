import { Phone, Mail, MapPin } from "lucide-react";
import { COMPANY } from "@/lib/constants";
import InquiryForm from "@/components/sections/InquiryForm";
import HeroSection from "@/components/sections/HeroSection";

export const metadata = { title: "문의하기" };

export default function ContactPage() {
  return (
    <>
      <HeroSection
        data={{
          variant: "banner",
          illustration: "consult",
          eyebrow: "Contact",
          title:
            '간편하게 시작하는<br class="hidden sm:block"/> <span class="text-blue-400">상담 신청하기</span>',
          subtitle:
            "구글·네이버·카카오 간편 로그인으로 회원가입 후 빠르게 상담을 신청할 수 있습니다. 접수된 상담 내용은 자동으로 등록되어 담당자가 신속하게 확인하고 안내해 드립니다.",
        }}
      />
      <section className="py-20 bg-slate-50 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
          <div className="lg:w-1/3 bg-blue-600 p-12 text-white">
            <h1 className="text-3xl font-bold mb-6">문의하기</h1>
            <p className="text-blue-100 mb-12 leading-relaxed">
              스마트워크 도입, AI 컨설팅, IT 인프라 구축 등 궁금하신 점을 남겨주시면
              전문가가 신속히 답변해 드립니다.
            </p>
            <div className="space-y-6 text-sm">
              <Info icon={<Phone className="w-5 h-5" />} label="전화" value={COMPANY.phone} />
              <Info icon={<Mail className="w-5 h-5" />} label="이메일" value={COMPANY.email} />
              <Info
                icon={<MapPin className="w-5 h-5" />}
                label="오시는 길"
                value={COMPANY.address}
              />
            </div>
          </div>
          <div className="lg:w-2/3 p-12">
            <InquiryForm />
          </div>
        </div>
        </div>
      </section>
    </>
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
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-blue-200">{label}</p>
        <p className="font-bold leading-snug">{value}</p>
      </div>
    </div>
  );
}
