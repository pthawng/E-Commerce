import { Page, Panel, Badge } from "@/components/ui-kit";
import { Sparkles, Send, Command, TrendingUp, Lightbulb, FileText, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AssistantPage() {
  const { t } = useTranslation("assistant");

  return (
    <Page>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-display text-3xl flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-gold" /> {t("page.title")}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">{t("page.subtitle")}</p>
        </div>
        <Badge variant="gold">{t("badge.privateModel")}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel
          className="col-span-2"
          title={t("conversation.title")}
          subtitle={t("conversation.subtitle")}
        >
          <div className="space-y-4 max-h-[520px] overflow-y-auto scrollbar-thin pr-2">
            <Message who="user" t="14:21">
              {t("sampleMessages.user1")}
            </Message>
            <Message who="ai" t="14:21">
              <div>{t("sampleMessages.ai1Intro", { count: 7 })}</div>
              <div className="mt-3 rounded-md border border-border bg-surface-sunken divide-y divide-border">
                {[
                  {
                    n: "Mr. H. Park · Seoul",
                    l: t("sampleMessages.clients.park", { n: 42, ltv: "€3.1M" }),
                  },
                  {
                    n: "Ms. Y. Nakamura · Tokyo",
                    l: t("sampleMessages.clients.nakamura", { n: 38, days: 9 }),
                  },
                  { n: "Mr. C. Wong · Hong Kong", l: t("sampleMessages.clients.wong", { n: 35 }) },
                ].map((c, i) => (
                  <div key={i} className="p-3 text-[12.5px]">
                    <div className="font-medium">{c.n}</div>
                    <div className="text-[11px] text-muted-foreground">{c.l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[12px]">{t("sampleMessages.ai1Suggestion")}</div>
              <div className="flex gap-2 mt-3">
                <button className="text-[11.5px] px-3 py-1.5 rounded border border-gold/40 text-gold hover:bg-gold/10">
                  {t("conversation.actions.draftMessages")}
                </button>
                <button className="text-[11.5px] px-3 py-1.5 rounded border border-border text-muted-foreground hover:bg-accent">
                  {t("conversation.actions.openFullList")}
                </button>
              </div>
            </Message>

            <Message who="user" t="14:24">
              {t("sampleMessages.user2")}
            </Message>
            <Message who="ai" t="14:24">
              <div>{t("sampleMessages.ai2Intro", { current: 2, threshold: 6 })}</div>
              <ul className="mt-2 space-y-1.5 text-[12px] list-disc list-inside text-muted-foreground">
                <li>
                  {t("sampleMessages.ai2Bullets.consumed", { n: 4 })} (BSP-441, BSP-432, BSP-419,
                  BSP-405)
                </li>
                <li>
                  {t("sampleMessages.ai2Bullets.lastProcurement", { date: "12 Feb", count: 6 })}
                </li>
                <li>{t("sampleMessages.ai2Bullets.projectedStockout", { days: 14 })}</li>
              </ul>
              <div className="mt-3 text-[12px]">
                {t("sampleMessages.ai2Recommendation", { count: 8 })}
              </div>
            </Message>
          </div>

          <div className="mt-4 rounded-md border border-border-strong bg-surface focus-within:border-gold/50 transition">
            <textarea
              placeholder={t("conversation.placeholder")}
              className="w-full bg-transparent p-3 text-[13px] resize-none outline-none placeholder:text-muted-foreground/70"
              rows={2}
            />
            <div className="flex items-center justify-between px-3 py-2 border-t border-border">
              <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
                <kbd className="border border-border rounded px-1.5 py-0.5 text-mono flex items-center gap-0.5">
                  <Command className="h-2.5 w-2.5" />↵
                </kbd>{" "}
                {t("conversation.sendHint")}
                <span>·</span>
                <span>{t("conversation.groundedIn", { n: 14 })}</span>
              </div>
              <button className="h-8 px-3 rounded-md gold-gradient text-gold-foreground text-[12px] font-medium flex items-center gap-1.5">
                <Send className="h-3 w-3" /> {t("conversation.send")}
              </button>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title={t("insights.title")}>
            <div className="space-y-3">
              {[
                { i: TrendingUp, tKey: "tokyoGrowth" as const, v: "success" },
                { i: Lightbulb, tKey: "reorderThreshold" as const, v: "warning" },
                { i: Sparkles, tKey: "crossSellSignal" as const, v: "gold" },
              ].map((ins, i) => (
                <div key={i} className="rounded-md border border-border bg-surface p-3">
                  <div className="flex items-center gap-2 text-[12px] font-medium">
                    <ins.i
                      className={`h-3.5 w-3.5 ${ins.v === "success" ? "text-success" : ins.v === "warning" ? "text-warning" : "text-gold"}`}
                    />
                    {t(`insights.items.${ins.tKey}` as never)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {t(`insights.items.${ins.tKey}Detail` as never)}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={t("search.title")}>
            <div className="rounded-md border border-border bg-surface flex items-center gap-2 px-3 h-9">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder={t("search.placeholder")}
                className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="mt-3 text-[10.5px] text-muted-foreground space-y-1.5">
              <div>{t("search.suggestions.label")}</div>
              <div className="space-y-1">
                {["anniversaries", "vaultIdle", "slaRisk"].map((s) => (
                  <button
                    key={s}
                    className="block text-left text-[11.5px] text-foreground/80 hover:text-gold transition"
                  >
                    → {t(`search.suggestions.${s}` as never)}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title={t("drafting.title")}>
            <div className="space-y-2">
              {[
                {
                  i: FileText,
                  tKey: "conciergeFollowup" as const,
                  cKey: "conciergeFollowupCtx" as const,
                },
                { i: FileText, tKey: "pressNote" as const, cKey: "pressNoteCtx" as const },
                { i: FileText, tKey: "internalMemo" as const, cKey: "internalMemoCtx" as const },
              ].map((d, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left"
                >
                  <d.i className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-[12px] font-medium">
                      {t(`drafting.templates.${d.tKey}`)}
                    </div>
                    <div className="text-[10.5px] text-muted-foreground">
                      {t(`drafting.templates.${d.cKey}`)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Page>
  );
}

function Message({
  who,
  t,
  children,
}: {
  who: "user" | "ai";
  t: string;
  children: React.ReactNode;
}) {
  const isAi = who === "ai";
  return (
    <div className={`flex gap-3 ${isAi ? "" : "flex-row-reverse"}`}>
      <div
        className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
          isAi ? "gold-gradient text-background" : "bg-muted border border-border-strong"
        }`}
      >
        {isAi ? <Sparkles className="h-3 w-3" /> : "AM"}
      </div>
      <div className={`flex-1 max-w-[85%] ${isAi ? "" : "flex flex-col items-end"}`}>
        <div className="text-[10.5px] text-muted-foreground tabular mb-1">{t}</div>
        <div
          className={`rounded-lg px-4 py-3 text-[13px] leading-relaxed ${
            isAi ? "bg-surface border border-border" : "bg-accent border border-border-strong"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
