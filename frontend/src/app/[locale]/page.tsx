import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/Header/Header";
import HeroSection from "@/components/composite/Header/HeroSection";
import HighlightSection from "@/components/composite/HighLightSection/HighLightSection";

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const t = await getTranslations({
    locale: resolvedParams.locale,
    namespace: "home",
  });

  return (
    <main >
      <Header />
      <HeroSection type="youtube" 
        // 1. Thay ID video mới vào đây
        src="u5i6jKgz1g0" 
        // 2. Cực kỳ quan trọng: Cập nhật luôn link thumbnail để tránh LCP bị ảnh hưởng
        // (User sẽ thấy ảnh này trong 1-2s đầu tiên khi Youtube đang load script)
        poster="https://img.youtube.com/vi/u5i6jKgz1g0/maxresdefault.jpg" />
      <HighlightSection 
        title={t("highlight.title")}
        subtitle={t("highlight.subtitle")}
        description={t("highlight.description")}
        imageSrc="/images/highlight.jpg"
        ctaText={t("highlight.ctaText")}
        reversed={false}
      />
      
    </main> 
  );
}
