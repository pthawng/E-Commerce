import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/sections/HeroSection";
import { RefractionSection } from "@/components/sections/RefractionSection";
import { AtelierSection } from "@/components/sections/AtelierSection";
import { CuratedFavoritesSection } from "@/components/sections/CuratedFavoritesSection";
import { HeritageSection } from "@/components/sections/HeritageSection";
import { NewsletterSection } from "@/components/sections/NewsletterSection";

const Index = () => {
  return (
    <Layout>
      {/* Section 1: Hero with Particles (Attract) */}
      <HeroSection />
      
      {/* Section 2: The Art of Refraction (Explain/Value) */}
      <RefractionSection />
      
      {/* Section 3: The Atelier - Video Section (Prove) */}
      <AtelierSection />
      
      {/* Section 4: Curated Favorites - Horizontal Scroll (Desire) */}
      <CuratedFavoritesSection />
      
      {/* Section 5: Heritage Story */}
      <HeritageSection />
      
      {/* Section 6: Newsletter (Action) */}
      <NewsletterSection />
    </Layout>
  );
};

export default Index;