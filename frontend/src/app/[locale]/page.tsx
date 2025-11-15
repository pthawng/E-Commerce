import { routing } from "@/lib/i18n/routing";
import { useTranslations } from "next-intl";
import Link from "next/link";

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default function HomePage() {
  const t = useTranslations("home");

  const featuredItems = [
    { name: "Aurora Necklace", price: "$890" },
    { name: "Sol Ring", price: "$420" },
    { name: "Lume Earrings", price: "$640" },
  ];

  return (
    <main>
      {/* Hero */}
      <section style={{ textAlign: "center", padding: "4rem 0" }}>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
        <button>{t("discoverButton")}</button>
      </section>

      {/* Philosophy */}
      <section style={{ marginTop: "6rem" }}>
        <h2>{t("philosophyTitle")}</h2>
        <p>{t("philosophyText")}</p>
        <Link href="/about">{t("readMore")}</Link>
      </section>

      {/* Featured Collection */}
      <section style={{ marginTop: "6rem" }}>
        <h2>{t("featuredCollectionTitle")}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
            marginTop: "2rem",
          }}
        >
          {featuredItems.map(item => (
            <div key={item.name} className="card">
              <h3>{item.name}</h3>
              <p style={{ color: "var(--paragraph-color)" }}>{item.price}</p>
              <button>{t("viewDetails")}</button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          marginTop: "8rem",
          padding: "2rem 0",
          color: "var(--neutral-color)",
        }}
      >
        <p>{t("footerText")}</p>
      </footer>
    </main>
  );
}
