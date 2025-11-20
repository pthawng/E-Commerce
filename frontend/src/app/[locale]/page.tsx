
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Header } from "@/components/layout/Header";

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;

  const t = await getTranslations({
    locale: resolvedParams.locale,
    namespace: "home",
  });

  const featuredItems = [
    { name: "Aurora Necklace", price: "$890", color: "rainbow-violet", icon: "✨" },
    { name: "Sol Ring", price: "$420", color: "rainbow-yellow", icon: "☀️" },
    { name: "Lume Earrings", price: "$640", color: "rainbow-blue", icon: "💎" },
  ];

  const rainbowColors = [
    "rainbow-red", "rainbow-orange", "rainbow-yellow",
    "rainbow-green", "rainbow-blue", "rainbow-indigo", "rainbow-violet"
  ];

  return (
    <main className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      <Header />

      {/* Hero Section */}
      <section className="relative text-center py-20 overflow-hidden">
        {/* Background gradient ánh sáng thiên đường */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, hsl(var(--primary)/0.05), transparent)" }} />

        <div className="relative max-w-4xl mx-auto px-4">
          <h1
            className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(to right, hsl(var(--primary)), hsl(var(--rainbow-blue)))" }}
          >
            {t("title")}
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            {t("description")}
          </p>

          <button
            className="group relative px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
            style={{
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            <span className="relative z-10">{t("discoverButton")}</span>
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "linear-gradient(to right, hsl(var(--rainbow-blue)), hsl(var(--rainbow-violet)))" }}
            />
          </button>

          {/* Rainbow dots */}
          <div className="flex justify-center gap-2 mt-8">
            {rainbowColors.map((color, index) => (
              <div
                key={color}
                className="w-3 h-3 rounded-full animate-bounce"
                style={{
                  backgroundColor: `hsl(var(--${color}))`,
                  animationDelay: `${index * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="max-w-4xl mx-auto mt-24 px-4">
        <div className="text-center mb-12">
          <h2
            className="text-4xl font-bold mb-4 bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(to right, hsl(var(--foreground)), hsl(var(--rainbow-indigo)))" }}
          >
            {t("philosophyTitle")}
          </h2>
          <div
            className="w-24 h-1 mx-auto rounded-full"
            style={{ background: "linear-gradient(to right, hsl(var(--rainbow-red)), hsl(var(--rainbow-violet)))" }}
          />
        </div>
        <p className="text-lg leading-relaxed text-center mb-8" style={{ color: "hsl(var(--muted-foreground))" }}>
          {t("philosophyText")}
        </p>
        <div className="text-center">
          <Link
            href={`/${resolvedParams.locale}/about`}
            className="group inline-flex items-center gap-2 font-semibold text-lg transition-all duration-300"
            style={{ color: "hsl(var(--primary))" }}
          >
            {t("readMore")}
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </Link>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="max-w-6xl mx-auto mt-24 px-4">
        <div className="text-center mb-16">
          <h2
            className="text-4xl font-bold mb-4 bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(to right, hsl(var(--rainbow-green)), hsl(var(--rainbow-blue)))" }}
          >
            {t("featuredCollectionTitle")}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
            {t("featuredCollectionDescription") || "Discover our exclusive collection of heavenly inspired jewelry"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredItems.map((item) => (
            <div
              key={item.name}
              className="group relative rounded-2xl p-6 transition-all duration-500 overflow-hidden"
              style={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(to bottom right, hsl(var(--${item.color}))/5, hsl(var(--secondary))/5)`,
                }}
              />
              <div className="relative z-10">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `hsl(var(--${item.color}))/10` }}
                >
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 style={{ color: "hsl(var(--foreground))" }} className="text-2xl font-semibold mb-3 group-hover:text-[var(--primary)] transition-colors duration-300">
                  {item.name}
                </h3>
                <p style={{ color: `hsl(var(--${item.color}))` }} className="text-2xl font-bold mb-6">{item.price}</p>
                <button
                  className="w-full py-3 rounded-lg font-medium transition-all duration-300"
                  style={{
                    backgroundColor: `hsl(var(--${item.color}))/10`,
                    color: `hsl(var(--${item.color}))`,
                    border: `1px solid hsl(var(--${item.color}))/20`,
                  }}
                >
                  {t("viewDetails")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="mt-32 py-16 rounded-3xl mx-4" style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t("stayUpdated") || "Stay in the Light"}</h2>
          <p className="text-lg mb-8" style={{ color: "hsl(var(--primary-foreground)/0.8)" }}>
            {t("newsletterText") || "Be the first to witness new heavenly collections and exclusive offers"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder={t("emailPlaceholder") || "Your email address"}
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none"
              style={{
                backgroundColor: "hsl(var(--primary-foreground)/0.1)",
                border: "1px solid hsl(var(--primary-foreground)/0.2)",
                color: "hsl(var(--primary-foreground))",
              }}
            />
            <button
              className="px-6 py-3 rounded-lg font-semibold transition-colors"
              style={{
                backgroundColor: "hsl(var(--primary-foreground))",
                color: "hsl(var(--primary))",
              }}
            >
              {t("subscribe") || "Subscribe"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 py-12" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-lg" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("footerText")}
            </p>

            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <ThemeToggle />
              <div className="flex gap-4">
                <Link href={`/${resolvedParams.locale}/privacy`} style={{ color: "hsl(var(--muted-foreground))" }}>
                  {t("privacy") || "Privacy"}
                </Link>
                <Link href={`/${resolvedParams.locale}/terms`} style={{ color: "hsl(var(--muted-foreground))" }}>
                  {t("terms") || "Terms"}
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-8 pt-8" style={{ borderTop: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
            <p>© {new Date().getFullYear()} Heavenly Light. {t("allRightsReserved") || "All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
