import { Page, Panel, Badge, Stat } from "@/components/ui-kit";
import type { BadgeVariant } from "@/components/ui-kit";
import { Hammer, CheckCircle2, Clock, User2, Gem } from "lucide-react";
import { useTranslation } from "react-i18next";

const stages = [
  {
    key: "stone",
    count: 6,
    items: [
      {
        id: "BSP-441",
        client: "Mr. K. Tanaka",
        desc: "Bespoke engagement · 3.8ct cushion",
        artisan: "M. Laurent",
        due: "12 Jun",
        priority: "gold",
      },
      {
        id: "BSP-440",
        client: "Mme. Ferreira",
        desc: "Emerald pendant · Colombian",
        artisan: "—",
        due: "20 Jun",
        priority: "info",
      },
    ],
  },
  {
    key: "cad",
    count: 8,
    items: [
      {
        id: "BSP-438",
        client: "Ms. Lin Wei",
        desc: "Bracelet · 18 stones pavé",
        artisan: "S. Okafor",
        due: "8 Jun",
        priority: "warning",
      },
      {
        id: "BSP-437",
        client: "Sir J. Whitcombe",
        desc: "Signet · armorial",
        artisan: "T. Berger",
        due: "15 Jun",
        priority: "info",
      },
    ],
  },
  {
    key: "cast",
    count: 4,
    items: [
      {
        id: "BSP-434",
        client: "Ray Paradis · Stock",
        desc: "Solstice Solitaire ×3",
        artisan: "Casting team B",
        due: "5 Jun",
        priority: "info",
      },
    ],
  },
  {
    key: "finish",
    count: 9,
    items: [
      {
        id: "BSP-431",
        client: "Mr. A. Volkov",
        desc: "Cufflinks · sapphire",
        artisan: "M. Laurent",
        due: "3 Jun",
        priority: "gold",
      },
      {
        id: "BSP-430",
        client: "Mme. Dubois",
        desc: "Earrings · diamond drop",
        artisan: "C. Ravel",
        due: "4 Jun",
        priority: "warning",
      },
    ],
  },
  {
    key: "qc",
    count: 5,
    items: [
      {
        id: "BSP-428",
        client: "Mr. R. Patel",
        desc: "Wedding band trio",
        artisan: "QC bench 1",
        due: "2 Jun",
        priority: "success",
      },
    ],
  },
];

export function AtelierPage() {
  const { t } = useTranslation("atelier");

  return (
    <Page>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-display text-3xl flex items-center gap-3">
            <Hammer className="h-6 w-6 text-gold" /> {t("page.title")}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            {t("page.subtitle", { count: 32, time: "4 minutes" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="h-9 px-3 rounded-md border border-border bg-surface text-[12.5px]">
            {t("actions.timelineView")}
          </button>
          <button className="h-9 px-3 rounded-md gold-gradient text-gold-foreground text-[12.5px] font-medium">
            {t("actions.newCommission")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat accent label={t("kpis.onSchedule")} value="86%" delta="+3pt" trend="up" />
        <Stat label={t("kpis.atRisk")} value="3" hint={t("kpis.atRiskHint")} />
        <Stat
          label={t("kpis.avgLeadTime")}
          value="42d"
          delta="−4d"
          trend="up"
          hint={t("kpis.avgLeadTimeHint")}
        />
        <Stat label={t("kpis.qcPassRate")} value="98.4%" delta="+0.6pt" trend="up" />
      </div>

      <Panel title={t("kanban.title")} subtitle={t("kanban.subtitle")} padded={false}>
        <div className="grid grid-cols-5 gap-px bg-border">
          {stages.map((stage) => (
            <div key={stage.key} className="bg-surface-sunken min-h-[420px]">
              <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.14em] font-medium">
                  {t(`kanban.stages.${stage.key}` as never)}
                </span>
                <span className="text-mono text-[10.5px] text-muted-foreground tabular">
                  {stage.count}
                </span>
              </div>
              <div className="p-2 space-y-2">
                {stage.items.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-md border border-border bg-card p-3 hover:border-gold/40 hover:bg-accent/40 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-mono text-[10.5px] text-muted-foreground">{c.id}</span>
                      <Badge variant={c.priority as BadgeVariant}>{t("kanban.priority")}</Badge>
                    </div>
                    <div className="text-[12px] font-medium mt-1.5">{c.client}</div>
                    <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">
                      {c.desc}
                    </div>
                    <div className="luxury-divider my-2.5" />
                    <div className="flex items-center justify-between text-[10.5px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User2 className="h-2.5 w-2.5" />
                        {c.artisan}
                      </span>
                      <span className="flex items-center gap-1 tabular">
                        <Clock className="h-2.5 w-2.5" />
                        {c.due}
                      </span>
                    </div>
                  </div>
                ))}
                <button className="w-full text-[10.5px] text-muted-foreground py-2 rounded-md border border-dashed border-border hover:border-border-strong hover:text-foreground">
                  {t("actions.addCard")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-3 gap-4">
        <Panel
          className="col-span-2"
          title={`${t("dossier.title")} · BSP-441`}
          subtitle={`Mr. K. Tanaka · ${t("dossier.subtitle")}`}
        >
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-[12px]">
                {[
                  { key: "centreStone", v: "3.82 ct cushion · D-IF" },
                  { key: "setting", v: "Pt950 · 8 prongs" },
                  { key: "sidestones", v: "0.96 ct tw · F-VS1" },
                  { key: "engraving", v: '"Pour toujours, 14·06"' },
                  { key: "box", v: t("dossier.boxMaisonSignature") },
                  { key: "delivery", v: "Tokyo Ginza · 12 Jun" },
                ].map((f) => (
                  <div key={f.key}>
                    <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      {t(`dossier.fields.${f.key}` as never)}
                    </div>
                    <div className="mt-0.5 font-medium">{f.v}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
                  {t("dossier.timeline.title")}
                </div>
                <ol className="relative border-l border-border ml-2 space-y-3">
                  {[
                    { key: "stoneSelection", params: { count: 4 }, done: true },
                    { key: "cadValidated", done: true },
                    { key: "waxApproved", done: true },
                    { key: "castingInProgress", done: false, current: true },
                    { key: "handFinishing", done: false },
                    { key: "qcHallmark", done: false },
                    { key: "conciergeHandover", done: false },
                  ].map((e, i) => (
                    <li key={i} className="ml-4">
                      <span
                        className={`absolute -left-[5px] h-2 w-2 rounded-full border border-background ${
                          e.done ? "bg-gold" : e.current ? "bg-gold animate-pulse" : "bg-muted"
                        }`}
                      />
                      <div className="text-[11px] text-mono tabular text-muted-foreground">
                        {i === 0
                          ? "12 May"
                          : i === 1
                            ? "18 May"
                            : i === 2
                              ? "24 May"
                              : i === 3
                                ? "29 May"
                                : i === 4
                                  ? "5 Jun"
                                  : i === 5
                                    ? "10 Jun"
                                    : "12 Jun"}
                      </div>
                      <div className="text-[12px] mt-0.5">
                        {t(`dossier.timeline.stages.${e.key}` as never, e.params)}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="space-y-3">
              <div className="aspect-square rounded-lg bg-gradient-to-br from-surface-raised via-muted to-surface-sunken border border-border flex items-center justify-center">
                <Gem className="h-10 w-10 text-gold/40" />
              </div>
              <div className="rounded-md border border-border bg-surface p-3 text-[11.5px] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("dossier.financials.quote")}</span>
                  <span className="text-mono tabular">€186,400</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("dossier.financials.deposit")}</span>
                  <span className="text-mono tabular text-success">
                    €93,200 {t("dossier.financials.depositReceived")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("dossier.financials.balance")}</span>
                  <span className="text-mono tabular">€93,200</span>
                </div>
              </div>
              <button className="w-full h-9 rounded-md border border-gold/40 text-gold text-[12.5px] hover:bg-gold/10 transition">
                {t("actions.openDossier")}
              </button>
            </div>
          </div>
        </Panel>

        <Panel title={t("artisanWorkload.title")}>
          <div className="space-y-3">
            {[
              { name: "M. Laurent", roleKey: "masterJeweller", load: 92, items: 6 },
              { name: "C. Ravel", roleKey: "stonesetter", load: 78, items: 4 },
              { name: "T. Berger", roleKey: "cadLead", load: 65, items: 3 },
              { name: "S. Okafor", roleKey: "paveSpecialist", load: 88, items: 5 },
              { name: "QC Bench 1", roleKey: "qualityControl", load: 54, items: 5 },
            ].map((a) => (
              <div key={a.name} className="rounded-md border border-border bg-surface p-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-mono text-[10.5px] tabular text-muted-foreground">
                    {t("artisanWorkload.active", { n: a.items })}
                  </span>
                </div>
                <div className="text-[10.5px] text-muted-foreground mb-2">
                  {t(`artisanWorkload.roles.${a.roleKey}` as never)}
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${a.load > 85 ? "bg-warning" : "bg-gold/70"}`}
                    style={{ width: `${a.load}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title={t("qcPanel.title")}>
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: "QC-9912", item: "Solstice Solitaire", resultKey: "pass", v: "success" },
            { id: "QC-9911", item: "Aurora Pavé Earrings", resultKey: "repolish", v: "warning" },
            { id: "QC-9910", item: "Nocturne Riviera", resultKey: "pass", v: "success" },
            { id: "QC-9909", item: "Méridien Bracelet", resultKey: "pass", v: "success" },
          ].map((q) => (
            <div
              key={q.id}
              className="rounded-md border border-border bg-surface p-3 flex items-center justify-between"
            >
              <div>
                <div className="text-mono text-[10.5px] text-muted-foreground">{q.id}</div>
                <div className="text-[12.5px] font-medium mt-0.5">{q.item}</div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 ${q.v === "success" ? "text-success" : "text-warning"}`}
                />
                <Badge variant={q.v as BadgeVariant}>
                  {t(`qcPanel.results.${q.resultKey}` as never)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </Page>
  );
}
