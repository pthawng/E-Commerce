import { Page, Panel, Badge, Stat } from "@/components/ui-kit";
import type { BadgeVariant } from "@/components/ui-kit";
import { BookOpen, Image as ImageIcon, Plus, Eye, Edit3, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CmsPage() {
  const { t } = useTranslation("cms");

  const blocks = [
    { typeKey: "hero" as const, labelKey: "heroCoverFilm" as const },
    { typeKey: "editorial" as const, labelKey: "letterFromAtelier" as const },
    { typeKey: "gallery" as const, labelKey: "stoneProvenance" as const, count: 6 },
    { typeKey: "quote" as const, labelKey: "maitreLaurentQuote" as const },
    { typeKey: "product" as const, labelKey: "featuredEmpress" as const },
    { typeKey: "cta" as const, labelKey: "bookPrivateViewing" as const },
  ];

  return (
    <Page>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-display text-3xl flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-gold" /> {t("page.title")}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            {t("page.subtitle", { count: 4 })}
          </p>
        </div>
        <button className="h-9 px-3 rounded-md gold-gradient text-gold-foreground text-[12.5px] font-medium flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" /> {t("actions.newStory")}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat accent label={t("kpis.publishedStories")} value="48" />
        <Stat label={t("kpis.inReview")} value="6" hint={t("kpis.inReviewHint")} />
        <Stat
          label={t("kpis.scheduled")}
          value="3"
          hint={t("kpis.scheduledHint", { date: "4 Jun" })}
        />
        <Stat label={t("kpis.mediaAssets")} value="1,284" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel className="col-span-2" title={t("builder.title")} subtitle={t("builder.subtitle")}>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              {blocks.map((b, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-3 rounded-md border border-border bg-surface p-3 hover:border-gold/40 transition cursor-grab"
                >
                  <div className="text-mono text-[10px] text-muted-foreground w-6 tabular">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <Badge variant="outline">{t(`builder.blockTypes.${b.typeKey}`)}</Badge>
                  <div className="flex-1 text-[12.5px] font-medium">
                    {t(`builder.blockLabels.${b.labelKey}` as never, { count: b.count })}
                  </div>
                  <button className="h-7 w-7 rounded hover:bg-accent flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button className="w-full py-3 rounded-md border border-dashed border-border text-[11.5px] text-muted-foreground hover:border-gold/40 hover:text-gold transition">
                {t("actions.addBlock")}
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-md border border-border bg-surface p-3">
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t("builder.sidebar.status")}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="warning">{t("builder.sidebar.inReview")}</Badge>
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface p-3">
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t("builder.sidebar.schedule")}
                </div>
                <div className="mt-1.5 text-[12.5px] flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-gold" /> 4 Jun · 18:00 CET
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface p-3">
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t("builder.sidebar.distribution")}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {["maisonSite", "emailVIP", "wechat", "instagram"].map((d) => (
                    <Badge key={d} variant="outline">
                      {t(`builder.sidebar.distributionChannels.${d}` as never)}
                    </Badge>
                  ))}
                </div>
              </div>
              <button className="w-full h-9 rounded-md gold-gradient text-gold-foreground text-[12.5px] font-medium flex items-center justify-center gap-2">
                <Eye className="h-3.5 w-3.5" /> {t("actions.previewLive")}
              </button>
            </div>
          </div>
        </Panel>

        <Panel title={t("pipeline.title")}>
          <div className="space-y-3">
            {[
              { storyKey: "nocturne" as const, stageKey: "editorialReview" as const, v: "warning" },
              {
                storyKey: "lettersFromVendome" as const,
                stageKey: "copyEditing" as const,
                v: "info",
              },
              {
                storyKey: "atelierPortraitRavel" as const,
                stageKey: "photography" as const,
                v: "info",
              },
              { storyKey: "bridalHeritage" as const, stageKey: "live" as const, v: "success" },
              {
                storyKey: "provenanceBurmeseRubies" as const,
                stageKey: "draft" as const,
                v: "default",
              },
            ].map((s) => (
              <div key={s.storyKey} className="rounded-md border border-border bg-surface p-3">
                <div className="text-[12.5px] font-medium">
                  {t(`pipeline.stories.${s.storyKey}`)}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <Badge variant={s.v as BadgeVariant}>{t(`pipeline.stages.${s.stageKey}`)}</Badge>
                  <span className="text-[10.5px] text-muted-foreground">
                    {t("pipeline.editor")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title={t("media.title")}
        subtitle={t("media.subtitle")}
        action={<button className="text-[11px] text-gold">{t("actions.upload")}</button>}
      >
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="group relative aspect-[3/4] rounded-md bg-gradient-to-br from-surface-raised via-muted to-surface-sunken border border-border overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center text-gold/30">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-background/90 to-transparent">
                <div className="text-[10px] text-mono text-muted-foreground">IMG-{2400 + i}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </Page>
  );
}
