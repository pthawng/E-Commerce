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

  return (
    <main data-theme="" className="min-h-screen  bg-light sm:bg-blue-400 md:bg-red-600 text-text transition-colors duration-300">
  <Header />

  {/* Hero Section */}
  <section className="relative text-center py-20 overflow-hidden">
    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary/5 to-transparent" />

    <div className="relative max-w-4xl mx-auto px-4">
      <h1
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-primary), var(--color-accent))",
        }}
      >
        {t("title")}
      </h1>
      <p className="text-base sm:text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed text-muted-foreground">
        {t("description")}
      </p>

      <button
        className="group relative px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
        style={{
          backgroundColor: "var(--color-primary)",
          color: "var(--color-button-text)",
        }}
      >
        <span className="relative z-10">{t("discoverButton")}</span>
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(to right, var(--color-accent), var(--color-primary))",
          }}
        />
      </button>

    </div>
  </section>

  {/* Philosophy Section */}
  <section className="max-w-4xl mx-auto mt-24 px-4 text-center">
    <h2
      className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent"
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--color-text-primary), var(--color-accent))",
      }}
    >
      {t("philosophyTitle")}
    </h2>
    <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-rainbow-red to-rainbow-violet" />
    <p className="text-base sm:text-lg md:text-xl leading-relaxed mb-8 text-muted-foreground">
      {t("philosophyText")}
    </p>
    <Link
      href={`/${resolvedParams.locale}/about`}
      className="inline-flex items-center gap-2 font-semibold text-base sm:text-lg transition-all duration-300 text-primary hover:translate-x-1"
    >
      {t("readMore")} →
    </Link>
  </section>

  {/* Featured Collection */}
  <section className="max-w-6xl mx-auto mt-24 px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {featuredItems.map((item) => (
      <div
        key={item.name}
        className="group relative rounded-2xl p-6 transition-all duration-500 overflow-hidden bg-card border border-border"
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(to bottom right, var(--${item.color}, var(--color-accent)), var(--color-secondary))`,
          }}
        />
        <div className="relative z-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `var(--${item.color}, var(--color-accent))` }}
          >
            <span className="text-xl sm:text-2xl">{item.icon}</span>
          </div>
          <h3 className="text-xl sm:text-2xl md:text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <p
            className="text-xl sm:text-2xl md:text-2xl font-bold mb-6"
            style={{ color: `var(--${item.color}, var(--color-text-primary))` }}
          >
            {item.price}
          </p>
          <button
            className="w-full py-3 rounded-lg font-medium text-base sm:text-lg transition-all duration-300"
            style={{
              backgroundColor: `var(--${item.color}, var(--color-accent))`,
              color: `var(--${item.color}, var(--color-text-primary))`,
              border: `1px solid var(--${item.color}, var(--color-border-light))`,
            }}
          >
            {t("viewDetails")}
          </button>
        </div>
      </div>
    ))}
  </section>

  {/* Newsletter */}
  <section className="mt-32 py-16 rounded-3xl mx-4 bg-primary text-primary-foreground text-center">
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{t("stayUpdated")}</h2>
      <p className="text-base sm:text-lg md:text-xl mb-8 text-primary-foreground/80">
        {t("newsletterText")}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
        <input
          type="email"
          placeholder={t("emailPlaceholder")}
          className="flex-1 px-4 py-3 rounded-lg text-base sm:text-lg focus:outline-none"
          style={{
            backgroundColor: "var(--color-button-bg)",
            border: "1px solid var(--color-border-light)",
            color: "var(--color-button-text)",
          }}
        />
        <button
          className="px-6 py-3 rounded-lg font-semibold text-base sm:text-lg transition-colors"
          style={{
            backgroundColor: "var(--color-button-text)",
            color: "var(--color-primary)",
          }}
        >
          {t("subscribe")}
        </button>
      </div>
    </div>
  </section>

  {/* Footer */}
  <footer className="mt-16 py-12 border-t border-border text-center">
    <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-base sm:text-lg text-muted-foreground">{t("footerText")}</p>
      <div className="flex items-center gap-6">
        <ThemeToggle />
        <div className="flex gap-4">
          <Link
            href={`/${resolvedParams.locale}/privacy`}
            className="text-base sm:text-lg text-muted-foreground"
          >
            {t("privacy")}
          </Link>
          <Link
            href={`/${resolvedParams.locale}/terms`}
            className="text-base sm:text-lg text-muted-foreground"
          >
            {t("terms")}
          </Link>
        </div>
      </div>
    </div>
    <div className="text-center mt-8 pt-8 border-t border-border text-muted-foreground text-base sm:text-lg">
      <p>© {new Date().getFullYear()} Heavenly Light. {t("allRightsReserved")}</p>
    </div>
  </footer>
    </main>
  );
}
