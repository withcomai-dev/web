import HeroSection from "./HeroSection";
import CardsSection from "./CardsSection";
import FeatureSection from "./FeatureSection";
import RichTextSection from "./RichTextSection";
import CTASection from "./CTASection";
import ImageSection from "./ImageSection";
import BlogSection from "./BlogSection";
import ServicesSection from "./ServicesSection";
import ContactSection from "./ContactSection";
import type {
  Section,
  HeroData,
  CardsData,
  FeatureData,
  RichTextData,
  CTAData,
  ImageBlockData,
  BlogData,
  ServicesData,
  ContactSectionData,
} from "@/types/cms";

export default function SectionRenderer({ sections }: { sections: Section[] }) {
  const visible = (sections ?? [])
    .filter((s) => s.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <>
      {visible.map((s) => {
        switch (s.type) {
          case "hero":
            return <HeroSection key={s.id} data={s.data as HeroData} />;
          case "cards":
            return <CardsSection key={s.id} data={s.data as CardsData} />;
          case "feature":
            return <FeatureSection key={s.id} data={s.data as FeatureData} />;
          case "richtext":
            return <RichTextSection key={s.id} data={s.data as RichTextData} />;
          case "cta":
            return <CTASection key={s.id} data={s.data as CTAData} />;
          case "image":
            return <ImageSection key={s.id} data={s.data as ImageBlockData} />;
          case "blog":
            return <BlogSection key={s.id} data={s.data as BlogData} />;
          case "services":
            return <ServicesSection key={s.id} data={s.data as ServicesData} />;
          case "contact":
            return (
              <ContactSection key={s.id} data={s.data as ContactSectionData} />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
