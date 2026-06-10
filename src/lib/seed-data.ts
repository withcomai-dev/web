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
          "위더스컴퓨터와 WITHCOM AI는 IT 인프라 구축부터 최신 AI 기술 도입까지, 중소기업의 업무 효율 향상을 위한 최적의 솔루션을 제안합니다.",
        ctas: [],
      },
    },
    {
      id: "home-strengths",
      order: 2,
      visible: true,
      type: "cards",
      data: {
        eyebrow: "Our Strengths",
        title: "WITHCOM AI의 핵심역량",
        description: "단순한 기술 제공을 넘어, 고객사의 비즈니스 성장을 함께 고민합니다.",
        variant: "highlight",
        columns: 4,
        items: [
          {
            icon: "zap",
            title: "AI 기반 스마트워크 구축",
            body: "기업 업무 환경에 맞는 AI 도구와 협업 시스템을 도입하여 반복 업무를 줄이고, 문서 작성·자료 정리·보고·고객 응대 등 전반적인 업무 생산성을 높입니다.",
          },
          {
            icon: "cpu",
            title: "IT 인프라 및 시스템 통합 지원",
            body: "AI PC(on device), 서버, 네트워크, 소프트웨어, 보안 등 기업 운영에 필요한 IT 인프라를 안정적으로 구축하고 관리합니다.",
          },
          {
            icon: "monitor",
            title: "디지털 비즈니스 구축(홈페이지·쇼핑몰)",
            body: "기업 홈페이지, 쇼핑몰, 온라인 마케팅 채널을 구축하고 고객 문의, 원격지원, 콘텐츠 운영까지 연결되는 디지털 비즈니스 환경을 지원합니다.",
          },
          {
            icon: "message-square",
            title: "맞춤형 AI 컨설팅 및 교육",
            body: "기업의 업무 프로세스를 분석해 실제 활용 가능한 AI 적용 방안을 제안하고, 임직원이 직접 활용할 수 있도록 실무 중심 교육을 제공합니다.",
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
      id: "home-sme",
      order: 5,
      visible: true,
      type: "sme",
      data: {
        eyebrow: "SME Support",
        heading: "중소기업 지원사업",
        description: "소상공인·R&D 지원사업 정보를 한눈에 확인하세요.",
        limitPerCategory: 3,
        showViewAll: true,
      },
    },
    {
      id: "home-services",
      order: 6,
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
      order: 7,
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
        variant: "banner",
        eyebrow: "About Us",
        title:
          '중소기업의 성장을 함께 만드는<br class="hidden sm:block"/> <span class="text-blue-400">IT 파트너</span>, 위드컴정보',
        subtitle:
          "1999년 설립 이래, 우리는 중소기업의 IT 환경을 끊임없이 개선하며 함께 성장해 왔습니다.",
      },
    },
    {
      id: "about-values",
      order: 2,
      visible: true,
      type: "cards",
      data: {
        eyebrow: "Our Promise",
        title: "위드컴정보가 일하는 방식",
        description: "기술보다 고객의 비즈니스를 먼저 이해합니다.",
        columns: 3,
        items: [
          {
            icon: "users",
            title: "고객 비즈니스 이해",
            body: "업종·규모·업무 흐름을 먼저 파악하고, 우리 회사에 맞는 답을 제안합니다.",
          },
          {
            icon: "zap",
            title: "실무 중심 솔루션",
            body: "보여주기식 도입이 아니라, 실무에서 바로 쓰이는 실용적인 솔루션만 권합니다.",
          },
          {
            icon: "shield-check",
            title: "지속적인 동반 성장",
            body: "구축으로 끝나지 않습니다. 운영·교육·지원까지 책임지는 파트너가 됩니다.",
          },
        ],
      },
    },
    {
      id: "about-richtext",
      order: 3,
      visible: true,
      type: "richtext",
      data: {
        html: `
          <h2>우리의 미션</h2>
          <p>중소기업이 디지털 시대의 변화에 발맞춰 성장할 수 있도록 든든한 IT 파트너 역할을 합니다.</p>
          <p>위더스컴퓨터(하드웨어·인프라)와 WITHCOM AI(스마트워크·AI 컨설팅)가 함께, 장비 한 대의 구매 상담부터 전사 디지털 전환까지 끊김 없이 지원합니다.</p>
        `,
      },
    },
    {
      id: "about-cta",
      order: 4,
      visible: true,
      type: "cta",
      data: {
        bg: "blue",
        title: "우리 회사 이야기를 들려주세요",
        body: "현재 업무 환경을 알려주시면, 가장 효과적인 개선 방안을 무료로 상담해 드립니다.",
        button: { label: "상담 신청하기", href: "/contact" },
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
        variant: "banner",
        eyebrow: "Smart Work & AI",
        title:
          '업무의 패러다임을 바꾸는<br class="hidden sm:block"/> <span class="text-blue-400">디지털 전환</span>의 시작',
        subtitle:
          "협업 효율, AI 실무 적용, 맞춤형 도구 추천까지 — 중소기업에 최적화된 스마트워크를 제안합니다.",
        ctas: [{ label: "도입 상담 신청", href: "/contact", variant: "primary" }],
      },
    },
    {
      id: "sw-tools",
      order: 2,
      visible: true,
      type: "cards",
      data: {
        eyebrow: "AI Tools",
        title: "AI TOOL 소개",
        description:
          "업무에 바로 적용할 수 있는 대표 AI·협업 도구를 선별해 도입을 도와드립니다.",
        columns: 3,
        items: [
          {
            icon: "bot",
            title: "생성형 AI 어시스턴트",
            body: "ChatGPT·Claude·Gemini 등으로 문서 작성, 요약, 번역, 아이디어 발굴을 자동화합니다.",
          },
          {
            icon: "users",
            title: "협업·메신저 도구",
            body: "팀즈·슬랙·잔디 등 실시간 소통과 자료 공유로 회의·보고 시간을 줄입니다.",
          },
          {
            icon: "cloud",
            title: "클라우드 오피스",
            body: "구글 워크스페이스·M365로 언제 어디서나 문서를 함께 작성하고 관리합니다.",
          },
          {
            icon: "settings",
            title: "업무 자동화",
            body: "반복 입력·전송 업무를 자동화 도구로 연결해 사람의 실수를 줄입니다.",
          },
          {
            icon: "database",
            title: "데이터 정리·분석",
            body: "흩어진 자료를 한곳에 모으고, AI로 검색·분석 가능한 자산으로 만듭니다.",
          },
          {
            icon: "message-square",
            title: "고객 응대 AI",
            body: "챗봇·자동 응답으로 단순 문의를 처리하고 상담 품질을 높입니다.",
          },
        ],
      },
    },
    {
      id: "sw-feature",
      order: 3,
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
    {
      id: "sw-cta",
      order: 4,
      visible: true,
      type: "cta",
      data: {
        bg: "slate",
        title: "어떤 도구부터 시작해야 할지 막막하신가요?",
        body: "업무 프로세스를 진단하고, 우리 회사에 맞는 도입 순서를 제안해 드립니다.",
        button: { label: "무료 진단 상담", href: "/contact" },
      },
    },
  ] as Section[],
};

export const SEED_IT_SERVICE: PageDoc = {
  key: "it-service",
  title: "하드웨어 및 소프트웨어 구축",
  seoTitle: "하드웨어 및 소프트웨어 구축 — WITHCOM AI",
  seoDescription:
    "WITHCOM AI는 고객사의 업무 특성과 예산에 맞춰 하드웨어와 소프트웨어를 통합 설계하고, 설치·설정·운영 지원까지 원스톱으로 제공합니다.",
  sections: [
    // 1. 메인 비주얼
    {
      id: "it-hero",
      order: 1,
      visible: true,
      type: "hero",
      data: {
        variant: "banner",
        bgImage: "/banner-it-service.png",
        title: "기업의 업무 효율을 높이는 안정적인 IT 인프라 구축",
      },
    },
    // 2. IT 인프라 구축 소개
    {
      id: "it-intro",
      order: 2,
      visible: true,
      type: "feature",
      data: {
        eyebrow: "Why Infra Matters",
        title: "안정적인 IT 환경이 곧 비즈니스 경쟁력입니다",
        image:
          "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1000",
        side: "right",
        items: [
          {
            icon: "zap",
            title: "생산성 향상",
            body: "업무에 최적화된 장비와 소프트웨어로 임직원의 업무 효율을 높입니다.",
          },
          {
            icon: "shield-check",
            title: "업무 중단 최소화",
            body: "안정적으로 설계된 인프라와 상시 지원으로 장애와 다운타임을 줄입니다.",
          },
          {
            icon: "cpu",
            title: "디지털 전환의 기초",
            body: "탄탄한 IT 환경은 스마트워크·AI 도입 등 디지털 전환의 토대가 됩니다.",
          },
        ],
      },
    },
    // 3. 하드웨어 구축 항목
    {
      id: "it-hardware",
      order: 3,
      visible: true,
      type: "cards",
      data: {
        eyebrow: "Hardware",
        title: "하드웨어 구축",
        description: "업무 환경에 필요한 모든 장비를 진단·설계·구축합니다.",
        columns: 3,
        items: [
          {
            icon: "laptop",
            title: "업무용 PC 및 노트북",
            body: "업무 특성과 예산에 맞는 데스크톱·노트북을 선정하고 세팅합니다.",
          },
          {
            icon: "server",
            title: "서버 구축",
            body: "파일·업무·백업 서버를 안정적으로 구성하고 운영을 지원합니다.",
          },
          {
            icon: "network",
            title: "네트워크 장비 구축",
            body: "유무선 네트워크, 스위치·공유기 등 통신 환경을 최적화합니다.",
          },
          {
            icon: "lock",
            title: "보안 장비 구축",
            body: "방화벽, CCTV, 출입 통제 등 물리·네트워크 보안 장비를 구축합니다.",
          },
          {
            icon: "printer",
            title: "프린터 및 주변기기",
            body: "복합기, 스캐너 등 사무용 주변기기를 설치하고 연동합니다.",
          },
          {
            icon: "cpu",
            title: "사무실 IT 장비 세팅",
            body: "신규 사무실 이전·확장 시 IT 장비 전반을 일괄 세팅합니다.",
          },
        ],
      },
    },
    // 4. 소프트웨어 구축 항목
    {
      id: "it-software",
      order: 4,
      visible: true,
      type: "cards",
      data: {
        eyebrow: "Software",
        title: "소프트웨어 구축",
        description: "업무에 필요한 소프트웨어와 솔루션을 도입·연동합니다.",
        columns: 3,
        items: [
          {
            icon: "monitor",
            title: "업무용 소프트웨어",
            body: "오피스, 회계, 그룹웨어 등 업무에 필요한 소프트웨어를 도입합니다.",
          },
          {
            icon: "shield-check",
            title: "보안 솔루션",
            body: "백신, 문서 보안, 망 분리 등 기업 보안 솔루션을 적용합니다.",
          },
          {
            icon: "users",
            title: "협업 도구",
            body: "메신저, 화상회의, 일정·문서 공유 등 협업 환경을 구축합니다.",
          },
          {
            icon: "cloud",
            title: "클라우드 기반 서비스",
            body: "클라우드 스토리지·SaaS로 언제 어디서나 일할 수 있게 지원합니다.",
          },
          {
            icon: "database",
            title: "백업 및 데이터 관리",
            body: "정기 백업과 복구 체계로 중요한 데이터를 안전하게 보호합니다.",
          },
          {
            icon: "bot",
            title: "업무 자동화 솔루션",
            body: "반복 업무를 줄이는 자동화·AI 도구로 생산성을 높입니다.",
          },
        ],
      },
    },
    // 5. 설치·설정·유지보수 지원
    {
      id: "it-support",
      order: 5,
      visible: true,
      type: "feature",
      data: {
        eyebrow: "One-stop Service",
        title: "설치부터 설정·유지보수까지 원스톱 지원",
        image:
          "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&q=80&w=1000",
        side: "left",
        items: [
          {
            icon: "wrench",
            title: "설치 및 설정",
            body: "현장 방문 설치와 초기 설정까지 전문 엔지니어가 직접 진행합니다.",
          },
          {
            icon: "settings",
            title: "운영 및 유지보수",
            body: "정기 점검과 신속한 장애 대응으로 안정적인 운영을 지원합니다.",
          },
          {
            icon: "headphones",
            title: "원격 지원",
            body: "원격 지원으로 문제를 빠르게 진단하고 해결합니다.",
          },
        ],
      },
    },
    // 6. 상담 유도 CTA
    {
      id: "it-cta",
      order: 6,
      visible: true,
      type: "cta",
      data: {
        bg: "blue",
        title: "우리 회사에 맞는 IT 인프라, 어떻게 시작해야 할까요?",
        body: "업무 특성과 예산에 맞는 하드웨어·소프트웨어 구축, WITHCOM AI가 상담해 드립니다.",
        button: { label: "구축 상담 신청하기", href: "/contact" },
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
        variant: "banner",
        eyebrow: "SME Support",
        title:
          '놓치면 아까운<br class="hidden sm:block"/> <span class="text-blue-400">중소기업 지원사업</span> 안내',
        subtitle:
          "정부·지자체의 소상공인·R&D 지원사업 정보를 한눈에 확인하고, 신청 컨설팅까지 도와드립니다.",
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
  seoTitle: "문의하기 — WITHCOM AI",
  seoDescription:
    "구글·네이버·카카오 간편 로그인으로 빠르게 상담을 신청하세요. 접수된 상담은 담당자가 신속하게 확인하고 안내해 드립니다.",
  sections: [
    {
      id: "contact-hero",
      order: 1,
      visible: true,
      type: "hero",
      data: {
        variant: "banner",
        bgImage: "/banner-contact.png",
        title: "간편하게 시작하는 상담 신청하기",
      },
    },
    {
      id: "contact-form",
      order: 2,
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

export const ALL_PAGE_SEEDS: PageDoc[] = [
  SEED_HOME,
  SEED_ABOUT,
  SEED_SMARTWORK_AI,
  SEED_IT_SERVICE,
  SEED_SME_SUPPORT,
  SEED_CONTACT,
];
