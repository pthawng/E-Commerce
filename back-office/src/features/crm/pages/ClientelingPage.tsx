import { Page, Panel, Badge, Stat, DataTable } from "@/components/ui-kit";
import type { BadgeVariant } from "@/components/ui-kit";
import { Crown, Calendar, MessageCircle, Plane, Gift, Heart, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const clients = [
  {
    initials: "KT",
    name: "Mr. Kenji Tanaka",
    tierKey: "foundersCircle",
    city: "Tokyo",
    ltv: "€4.82M",
    last: "2d ago",
    concierge: "S. Chen",
    v: "gold",
  },
  {
    initials: "LW",
    name: "Ms. Lin Wei",
    tierKey: "atelierPrive",
    city: "Shanghai",
    ltv: "€1.94M",
    last: "Today",
    concierge: "S. Chen",
    v: "gold",
  },
  {
    initials: "AF",
    name: "Mme. Adriana Ferreira",
    tierKey: "atelierPrive",
    city: "São Paulo",
    ltv: "€1.41M",
    last: "1w ago",
    concierge: "J. Dubois",
    v: "info",
  },
  {
    initials: "AV",
    name: "Mr. Andrei Volkov",
    tierKey: "maison",
    city: "Geneva",
    ltv: "€680K",
    last: "Today",
    concierge: "L. Müller",
    v: "info",
  },
  {
    initials: "JW",
    name: "Sir James Whitcombe",
    tierKey: "maison",
    city: "London",
    ltv: "€512K",
    last: "3d ago",
    concierge: "P. Holt",
    v: "info",
  },
];

export function ClientelingPage() {
  const { t } = useTranslation("clienteling");
  const { t: tc } = useTranslation("common");

  return (
    <Page>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-display text-3xl flex items-center gap-3">
            <Crown className="h-6 w-6 text-gold" /> {t("page.title")}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            {t("page.subtitle", { count: 386, concierges: 24, ateliers: 12 })}
          </p>
        </div>
        <button className="h-9 px-3 rounded-md gold-gradient text-gold-foreground text-[12.5px] font-medium">
          {t("actions.openRelationship")}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat
          accent
          label={t("kpis.foundersCircle")}
          value="24"
          hint={t("kpis.foundersCircleHint")}
        />
        <Stat label={t("kpis.avgLTV")} value="€482K" delta="+12%" trend="up" />
        <Stat label={t("kpis.conciergeLoad")} value="16" hint={t("kpis.conciergeLoadHint")} />
        <Stat label={t("kpis.nps")} value="82" delta="+4" trend="up" hint={t("kpis.npsHint")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel className="col-span-2" title={t("table.title")} padded={false}>
          <DataTable
            columns={[
              {
                key: "name",
                header: t("table.columns.client"),
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-muted to-surface-raised border border-border-strong flex items-center justify-center text-[11.5px] font-medium">
                      {r.initials}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">{r.name}</div>
                      <div className="text-[10.5px] text-muted-foreground">{r.city}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: "tier",
                header: t("table.columns.tier"),
                render: (r) => (
                  <Badge variant={r.v as BadgeVariant}>
                    {t(`table.tiers.${r.tierKey}` as never)}
                  </Badge>
                ),
              },
              {
                key: "ltv",
                header: t("table.columns.ltv"),
                className: "text-mono tabular text-right",
              },
              { key: "concierge", header: t("table.columns.concierge") },
              {
                key: "last",
                header: t("table.columns.lastTouch"),
                className: "text-[11.5px] text-muted-foreground",
              },
            ]}
            rows={clients}
          />
        </Panel>

        <Panel title={t("concierge.panelTitle")}>
          <div className="space-y-3">
            {[
              { name: "S. Chen", region: "APAC", clients: 22, sla: "1.2h" },
              { name: "J. Dubois", region: "LATAM/EU", clients: 18, sla: "0.8h" },
              { name: "L. Müller", region: "DACH", clients: 14, sla: "1.5h" },
              { name: "P. Holt", region: "UK", clients: 12, sla: "2.1h" },
            ].map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between rounded-md border border-border bg-surface p-3"
              >
                <div>
                  <div className="text-[12.5px] font-medium">{c.name}</div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {c.region} · {t("concierge.clients", { n: c.clients })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-mono tabular text-[13px]">{c.sla}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {t("concierge.avgResponse")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel
          className="col-span-2"
          title={`Mr. Kenji Tanaka · ${t("table.columns.client")}`}
          subtitle={`${t("table.tiers.foundersCircle")} · ${t("table.columns.concierge")}: S. Chen`}
        >
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t("profile.preferences")}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Cushion cut", "Burmese ruby", "Platinum", "Engraved", "Lacquer box"].map(
                    (p) => (
                      <Badge key={p} variant="outline">
                        {p}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t("profile.sizes")}
                </div>
                <div className="mt-1.5 text-[12px] space-y-0.5 text-mono">
                  <div>{t("profile.ring")} · 17.5mm (US 7.5)</div>
                  <div>{t("profile.bracelet")} · 16.5cm</div>
                  <div>{t("profile.necklace")}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t("profile.lifeEvents")}
                </div>
                <ul className="mt-2 space-y-2 text-[12px]">
                  <li className="flex gap-2">
                    <Heart className="h-3.5 w-3.5 text-gold mt-0.5" />
                    <div>
                      <b>{t("profile.engagement")}</b> · 14 Jun 2026
                      <div className="text-[10.5px] text-muted-foreground">
                        {t("profile.commissionInProgress")}
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <Calendar className="h-3.5 w-3.5 text-info mt-0.5" />
                    <div>
                      <b>{t("profile.birthday")}</b> · 22 Sep
                      <div className="text-[10.5px] text-muted-foreground">
                        {t("profile.giftReady")}
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <Plane className="h-3.5 w-3.5 text-platinum mt-0.5" />
                    <div>
                      <b>{t("profile.parisVisit")}</b> · 08–11 Jun
                      <div className="text-[10.5px] text-muted-foreground">
                        {t("profile.atelierVisitScheduled")}
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                {t("profile.lookbook")}
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-md border border-border bg-surface overflow-hidden">
                  <div className="aspect-[16/9] bg-gradient-to-br from-surface-raised to-muted" />
                  <div className="p-2.5">
                    <div className="text-[12px] font-medium">
                      {["Empress Ruby Cocktail", "Aurora Pavé Earrings", "Lumière Pearl Strand"][i]}
                    </div>
                    <div className="text-[10.5px] text-muted-foreground">
                      {t("profile.sentAwaitingFeedback")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title={t("communication.title")}
          action={<button className="text-[11px] text-gold">{t("actions.newMessage")}</button>}
        >
          <ol className="space-y-3">
            {[
              {
                t: "16:22",
                channelKey: "whatsapp" as const,
                from: "S. Chen",
                msg: "Sending updated wax photographs for your approval, sir.",
                v: "info",
              },
              {
                t: "Yesterday",
                channelKey: "email" as const,
                from: "K. Tanaka",
                msg: "Pourriez-vous confirmer la pierre centrale?",
                v: "default",
              },
              {
                t: "27 May",
                channelKey: "atelierVisit" as const,
                from: "Paris",
                msg: "Private viewing · 90 min · M. Laurent attended",
                v: "gold",
              },
              {
                t: "22 May",
                channelKey: "gift" as const,
                from: "Maison",
                msg: "Maison candle dispatched (birthday of spouse)",
                v: "success",
              },
            ].map((c, i) => (
              <li key={i} className="rounded-md border border-border bg-surface p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <MessageCircle className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{c.from}</span>
                    <Badge variant={c.v as BadgeVariant}>
                      {t(`communication.channels.${c.channelKey}`)}
                    </Badge>
                  </div>
                  <span className="text-mono text-[10.5px] text-muted-foreground tabular">
                    {c.t}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1.5 italic">"{c.msg}"</p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel title={t("gestures.title")} subtitle={t("gestures.subtitle")}>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              i: Gift,
              typeKey: "anniversaryGift" as const,
              c: "Mme. Ferreira · 4 Jun",
              aKey: "ferreira" as const,
            },
            {
              i: Calendar,
              typeKey: "atelierVisit" as const,
              c: "Mr. Volkov · Geneva",
              aKey: "volkov" as const,
            },
            {
              i: Sparkles,
              typeKey: "newCollectionPreview" as const,
              c: "Founder's Circle (24)",
              aKey: "foundersCircle" as const,
            },
          ].map((g, i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-surface p-4 hover:border-gold/40 transition"
            >
              <g.i className="h-4 w-4 text-gold" />
              <div className="text-[12.5px] font-medium mt-2">
                {t(`gestures.types.${g.typeKey}`)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{g.c}</div>
              <div className="text-[11.5px] mt-2">{t(`gestures.gestureSuggestions.${g.aKey}`)}</div>
              <div className="flex gap-2 mt-3">
                <button className="text-[11px] px-2 py-1 rounded border border-gold/40 text-gold hover:bg-gold/10">
                  {t("gestures.actions.approve")}
                </button>
                <button className="text-[11px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-accent">
                  {t("gestures.actions.dismiss")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </Page>
  );
}
