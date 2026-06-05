import type { PageDoc, Section } from "@/types/cms";

// HTML 초안(withcom_info.html)을 섹션 데이터로 변환한 시드.
// 관리자 모드에서 편집 가능하도록 Firestore siteSettings/page_{key} 에 저장.

export const SEED_HOME: PageDoc = {
  key: "home",
  title: "홈",
  seoTitle: "위드컴정보 — 중소기업 디지털 전환 파트너",
  seoDescription:
    "위드컴정보는 IT 인프라 구축부터 최신 AI 기술 도입까지, 중소기업의 업무 효율 향상을 위한 최적의 솔루션을 제안합니다.",
  sections: [
    {
      id: "home-hero",
      order: 1,
      visible: true,
      type: "hero",
      data: {
        bgImage:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000",
        eyebrow: "Digital Transformation Partner",
        title:
          '중소기업의 <span class="text-blue-500">스마트워크</span>와 <br class="hidden md:block"> <span class="text-blue-500">생성형 AI</span> 활용을 지원하는 파트너',
        subtitle:
          "위드컴정보는 IT 인프라 구축부터 최신 AI 기술 도입까지, 중소기업의 업무 효율 향상을 위한 최적의 솔루션을 제안합니다.",
        ctas: [
          { label: "상담 신청하기", href: "#contact", variant: "primary" },
          { label: "자세히 보기", href: "#about", variant: "ghost" },
        ],
      },
    },
    {
      id: "home-strengths",
      order: 2,
      visible: true,
      type: "cards",
      data: {
        eyebrow: "Our Strengths",
        title: "위드컴정보의 핵심 역량",
        description: "단순한 기술 제공을 넘어, 고객사의 비즈니스 성장을 함께 고민합니다.",
        columns: 4,
        items: [
          {
            icon: "cpu",
            title: "IT 인프라 구축",
            body: "최적화된 네트워크 및 서버 환경 구축으로 안정적인 비즈니스 기반을 제공합니다.",
          },
          {
            icon: "zap",
            title: "스마트워크 솔루션",
            body: "언제 어디서나 효율적으로 일할 수 있는 협업 도구와 시스템 도입을 지원합니다.",
          },
          {
            icon: "message-square",
            title: "생성형 AI 컨설팅",
            body: "ChatGPT 등 최신 AI 기술을 실무에 즉시 적용할 수 있는 맞춤형 가이드를 제공합니다.",
          },
          {
            icon: "shield-check",
            title: "철저한 기술 지원",
            body: "전문 엔지니어의 상시 모니터링과 신속한 원격 지원으로 업무 중단을 최소화합니다.",
          },
        ],
      },
    },
    {
      id: "home-smartwork",
      order: 3,
      visible: true,
      type: "feature",
      data: {
        eyebrow: "Smart Work & AI",
        title: "업무의 패러다임을 바꾸는 디지털 전환의 시작",
        image:
          "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1000",
        side: "right",
        items: [
          {
            icon: "users",
            title: "협업 효율 극대화",
            body: "분산된 업무 환경에서도 실시간 소통과 문서 공유가 가능한 스마트워크 시스템을 구축합니다.",
          },
          {
            icon: "cpu",
            title: "생성형 AI 실무 적용",
            body: "단순 반복 업무는 AI에게 맡기고, 임직원들은 더 창의적이고 핵심적인 업무에 집중할 수 있습니다.",
          },
          {
            icon: "monitor",
            title: "맞춤형 도구 추천",
            body: "기업의 규모와 업종에 맞는 최적의 SaaS 및 AI 도구를 선별하여 도입 가이드를 제공합니다.",
          },
        ],
      },
    },
    {
      id: "home-blog",
      order: 4,
      visible: true,
      type: "blog",
      data: {
        eyebrow: "Contents",
        title: "업무활용 콘텐츠",
        viewAllHref: "/contents",
        items: [
          {
            category: "AI 활용 팁",
            date: "2024.03.20",
            title: "생성형 AI로 보고서 작성 시간 50% 단축하기",
            summary:
              "실무에서 바로 활용 가능한 구체적인 방법론과 사례를 통해 디지털 전환의 해답을 제시합니다.",
            thumbnail:
              "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
            href: "/contents/view?slug=ai-report-tips",
          },
          {
            category: "스마트워크",
            date: "2024.03.15",
            title: "중소기업을 위한 협업 도구 도입 성공 사례",
            summary:
              "실무에서 바로 활용 가능한 구체적인 방법론과 사례를 통해 디지털 전환의 해답을 제시합니다.",
            thumbnail:
              "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
            href: "/contents/view?slug=collab-tools-case",
          },
          {
            category: "IT 트렌드",
            date: "2024.03.10",
            title: "2024년 디지털 전환(DX) 핵심 전략 가이드",
            summary:
              "실무에서 바로 활용 가능한 구체적인 방법론과 사례를 통해 디지털 전환의 해답을 제시합니다.",
            thumbnail:
              "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
            href: "/contents/view?slug=dx-strategy-2026",
          },
        ],
      },
    },
    {
      id: "home-services",
      order: 5,
      visible: true,
      type: "services",
      data: {
        items: [
          {
            icon: "shopping-bag",
            title: "공식 쇼핑몰",
            body: "비즈니스에 필요한 IT 하드웨어 및 소프트웨어",
            href: "https://withcom.runmoa.com",
            external: true,
            bg: "blue",
            ctaLabel: "바로가기",
          },
          {
            icon: "headphones",
            title: "원격 지원 서비스",
            body: "전문 엔지니어의 신속한 문제 해결 지원",
            href: "http://15663669.co.kr/start",
            external: true,
            bg: "slate",
            ctaLabel: "지원받기",
          },
          {
            icon: "youtube",
            title: "유튜브 자료실",
            body: "IT 트렌드 및 솔루션 활용 가이드 영상",
            href: "https://www.youtube.com/@%EC%9C%84%EB%8D%94%EC%8A%A4%EC%BB%B4%ED%93%A8%ED%84%B0%EC%A3%BC",
            external: true,
            bg: "rose",
            ctaLabel: "시청하기",
          },
        ],
      },
    },
    {
      id: "home-contact",
      order: 6,
      visible: true,
      type: "contact",
      data: {
        title: "문의하기",
        description:
          "스마트워크 도입, AI 컨설팅, IT 인프라 구축 등 궁금하신 점을 남겨주시면 전문가가 신속히 답변해 드립니다.",
      },
    },
  ] as Section[],
};

export const SEED_ABOUT: PageDoc = {
  key: "about",
  title: "회사 소개",
  sections: [
    {
      id: "about-hero",
      order: 1,
      visible: true,
      type: "hero",
      data: {
        eyebrow: "About Us",
        title: "위드컴정보는 중소기업의 성장 파트너입니다",
        subtitle:
          "1999년 설립 이래, 우리는 중소기업의 IT 환경을 끊임없이 개선하며 함께 성장해 왔습니다.",
      },
    },
    {
      id: "about-richtext",
      order: 2,
      visible: true,
      type: "richtext",
      data: {
        html: `
          <h2>우리의 미션</h2>
          <p>중소기업이 디지털 시대의 변화에 발맞춰 성장할 수 있도록 든든한 IT 파트너 역할을 합니다.</p>
          <h2>우리의 가치</h2>
          <ul>
            <li>고객 비즈니스에 대한 깊은 이해</li>
            <li>실무에 즉시 적용 가능한 실용적 솔루션</li>
            <li>지속적인 기술 지원과 동반 성장</li>
          </ul>
        `,
      },
    },
  ] as Section[],
};

export const SEED_SMARTWORK_AI: PageDoc = {
  key: "smartwork-ai",
  title: "스마트워크 & AI",
  sections: [
    {
      id: "sw-hero",
      order: 1,
      visible: true,
      type: "hero",
      data: {
        eyebrow: "Smart Work & AI",
        title: "업무의 패러다임을 바꾸는 디지털 전환의 시작",
        subtitle:
          "협업 효율, AI 실무 적용, 맞춤형 도구 추천까지 — 중소기업에 최적화된 스마트워크를 제안합니다.",
      },
    },
    {
      id: "sw-feature",
      order: 2,
      visible: true,
      type: "feature",
      data: {
        title: "스마트워크 도입의 효과",
        image:
          "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1000",
        side: "right",
        items: [
          {
            icon: "users",
            title: "협업 효율 극대화",
            body: "분산된 업무 환경에서도 실시간 소통과 문서 공유가 가능합니다.",
          },
          {
            icon: "cpu",
            title: "생성형 AI 실무 적용",
            body: "단순 반복 업무는 AI에게 맡기고, 임직원은 핵심 업무에 집중합니다.",
          },
          {
            icon: "monitor",
            title: "맞춤형 도구 추천",
            body: "기업의 규모·업종에 맞는 SaaS·AI 도구를 선별하여 도입 가이드를 제공합니다.",
          },
        ],
      },
    },
  ] as Section[],
};

export const SEED_IT_SERVICE: PageDoc = {
  key: "it-service",
  title: "IT 서비스 / 원격지원",
  sections: [
    {
      id: "it-hero",
      order: 1,
      visible: true,
      type: "hero",
      data: {
        eyebrow: "IT Service",
        title: "전문 엔지니어의 신속한 IT 서비스",
        subtitle: "원격지원, 인프라 구축, 모니터링까지 — 업무 중단을 최소화합니다.",
      },
    },
    {
      id: "it-cards",
      order: 2,
      visible: true,
      type: "cards",
      data: {
        title: "주요 서비스",
        columns: 3,
        items: [
          {
            icon: "cpu",
            title: "IT 인프라 구축",
            body: "네트워크·서버 환경의 최적 구성을 설계하고 운영합니다.",
          },
          {
            icon: "shield-check",
            title: "원격지원",
            body: "전문 엔지니어가 신속하게 문제를 해결합니다.",
          },
          {
            icon: "monitor",
            title: "상시 모니터링",
            body: "주요 지표를 모니터링하여 장애를 사전에 감지합니다.",
          },
        ],
      },
    },
  ] as Section[],
};

export const SEED_SME_SUPPORT: PageDoc = {
  key: "sme-support",
  title: "중소기업 지원사업",
  sections: [
    {
      id: "sme-hero",
      order: 1,
      visible: true,
      type: "hero",
      data: {
        eyebrow: "SME Support",
        title: "중소기업 지원사업 안내",
        subtitle:
          "정부·지자체의 IT 지원사업 정보를 한눈에 확인하고, 신청 컨설팅까지 도와드립니다.",
      },
    },
    {
      id: "sme-richtext",
      order: 2,
      visible: true,
      type: "richtext",
      data: {
        html: `
          <p>위드컴정보는 다양한 중소기업 지원사업의 신청 자격과 절차를 안내하고, 신청서 작성까지 도와드립니다.</p>
          <p>아래 콘텐츠를 통해 진행 중인 사업 목록을 확인하세요.</p>
        `,
      },
    },
  ] as Section[],
};

export const SEED_CONTACT: PageDoc = {
  key: "contact",
  title: "문의하기",
  sections: [
    {
      id: "contact-hero",
      order: 1,
      visible: true,
      type: "hero",
      data: {
        eyebrow: "Contact",
        title: "전문가가 직접 상담해 드립니다",
        subtitle:
          "스마트워크 도입, AI 컨설팅, IT 인프라 구축 — 어떤 문의든 환영합니다.",
      },
    },
  ] as Section[],
};

export const ALL_PAGE_SEEDS: PageDoc[] = [
  SEED_HOME,
  SEED_ABOUT,
  SEED_SMARTWORK_AI,
  SEED_IT_SERVICE,
  SEED_SME_SUPPORT,
  SEED_CONTACT,
];
