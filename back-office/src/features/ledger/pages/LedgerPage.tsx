import { Page, Panel, Stat, Badge, DataTable } from "@/components/ui-kit";
import type { BadgeVariant } from "@/components/ui-kit";
import { Receipt, Download, FileCheck2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

const journal = [
  {
    date: "28 May",
    ref: "JE-118842",
    descKey: "saleARMaison",
    debit: "€312,500",
    credit: "—",
    acct: "1100 · AR Maison",
    statusKey: "posted",
    v: "success",
  },
  {
    date: "28 May",
    ref: "JE-118841",
    descKey: "vatCollected",
    debit: "—",
    credit: "€62,500",
    acct: "2310 · VAT Output",
    statusKey: "posted",
    v: "success",
  },
  {
    date: "28 May",
    ref: "JE-118840",
    descKey: "refundPartial",
    debit: "€18,400",
    credit: "—",
    acct: "4900 · Refunds",
    statusKey: "pendingReview",
    v: "warning",
  },
  {
    date: "28 May",
    ref: "JE-118839",
    descKey: "atelierLabour",
    debit: "€84,200",
    credit: "—",
    acct: "6100 · Labour",
    statusKey: "posted",
    v: "success",
  },
  {
    date: "27 May",
    ref: "JE-118838",
    descKey: "inventoryWriteDown",
    debit: "€2,400",
    credit: "—",
    acct: "1400 · Inventory",
    statusKey: "posted",
    v: "success",
  },
  {
    date: "27 May",
    ref: "JE-118837",
    descKey: "wireReceived",
    debit: "—",
    credit: "€93,200",
    acct: "1010 · Cash · BNP",
    statusKey: "reconciled",
    v: "info",
  },
];

export function LedgerPage() {
  const { t } = useTranslation("ledger");
  const { t: tc } = useTranslation("common");

  return (
    <Page>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-display text-3xl flex items-center gap-3">
            <Receipt className="h-6 w-6 text-gold" /> {t("page.title")}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            {t("page.subtitle", { period: "May 2026", days: 3 })}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="h-9 px-3 rounded-md border border-border bg-surface text-[12.5px] flex items-center gap-2">
            <Download className="h-3.5 w-3.5" /> {t("actions.exportTrialBalance")}
          </button>
          <button className="h-9 px-3 rounded-md gold-gradient text-gold-foreground text-[12.5px] font-medium flex items-center gap-2">
            <FileCheck2 className="h-3.5 w-3.5" /> {t("actions.beginPeriodClose")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Stat accent label={t("kpis.revenueMTD")} value="€4.82M" delta="+18.4%" trend="up" />
        <Stat label={t("kpis.cogsMTD")} value="€1.41M" delta="+11.2%" trend="up" />
        <Stat label={t("kpis.grossMargin")} value="70.7%" delta="+1.8pt" trend="up" />
        <Stat label={t("kpis.openAR")} value="€684K" hint={t("kpis.openARHint", { n: 14 })} />
        <Stat
          label={t("kpis.reconciliation")}
          value="99.2%"
          delta="2 deltas"
          trend="down"
          hint={t("kpis.reconciliationHint")}
        />
      </div>

      <Panel
        title={t("journal.title")}
        subtitle={t("journal.subtitle")}
        action={
          <div className="flex gap-2">
            <Badge variant="outline">{t("journal.filters.allAccounts")}</Badge>
            <Badge variant="outline">
              {t("journal.filters.period", { month: "5", year: "2026" })}
            </Badge>
          </div>
        }
        padded={false}
      >
        <DataTable
          columns={[
            {
              key: "date",
              header: t("journal.columns.date"),
              className: "text-mono tabular text-[11.5px] text-muted-foreground",
              width: "80px",
            },
            {
              key: "ref",
              header: t("journal.columns.ref"),
              className: "text-mono text-[11.5px] text-muted-foreground",
            },
            {
              key: "desc",
              header: t("journal.columns.description"),
              render: (r) => (
                <span className="font-medium">
                  {t(`journal.descriptions.${r.descKey}` as never)}
                </span>
              ),
            },
            {
              key: "acct",
              header: t("journal.columns.account"),
              className: "text-mono text-[11px] text-muted-foreground",
            },
            {
              key: "debit",
              header: t("journal.columns.debit"),
              className: "text-mono tabular text-right",
            },
            {
              key: "credit",
              header: t("journal.columns.credit"),
              className: "text-mono tabular text-right text-success",
            },
            {
              key: "st",
              header: t("journal.columns.status"),
              render: (r) => (
                <Badge variant={r.v as BadgeVariant}>
                  {t(`journal.status.${r.statusKey}` as never)}
                </Badge>
              ),
            },
          ]}
          rows={journal}
        />
        <div className="flex items-center justify-between px-5 py-3 border-t border-border text-[11.5px]">
          <div className="text-muted-foreground">
            {t("journal.totals.showing", { shown: 6, total: 1284 })}
          </div>
          <div className="flex gap-6 text-mono tabular">
            <span>
              {t("journal.totals.totalDebits")} · <b>€417,500</b>
            </span>
            <span className="text-success">
              {t("journal.totals.totalCredits")} · <b>€155,700</b>
            </span>
            <span className="text-warning">{t("journal.totals.variance")} · €0.00</span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4">
        <Panel title={t("bankRecon.title")} subtitle={t("bankRecon.subtitle")}>
          <div className="space-y-3">
            {[
              { d: "28 May", a: "+€312,500", t: "Wire · Mr. R. Patel", matched: true },
              { d: "28 May", a: "−€18,400", t: "Refund · ORD-9914", matched: false },
              { d: "27 May", a: "+€93,200", t: "Deposit · BSP-441", matched: true },
              { d: "27 May", a: "−€84,200", t: "Payroll · atelier", matched: true },
              { d: "27 May", a: "−€2,840", t: "Customs · Riyadh shipment", matched: false },
            ].map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-border bg-surface p-3"
              >
                <div>
                  <div className="text-[12.5px] font-medium">{b.t}</div>
                  <div className="text-[10.5px] text-muted-foreground text-mono tabular">{b.d}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-mono tabular text-[13px] ${b.a.startsWith("+") ? "text-success" : "text-destructive"}`}
                  >
                    {b.a}
                  </span>
                  <Badge variant={b.matched ? "success" : "warning"}>
                    {b.matched ? t("bankRecon.status.matched") : t("bankRecon.status.unmatched")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t("refundWorkflow.title")}>
          <div className="rounded-md border border-warning/30 bg-warning/5 p-4 mb-3 flex gap-3">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div className="text-[12px]">
              <div className="font-medium">
                {t("refundWorkflow.alert.title", { amount: "€18,400", order: "ORD-9914" })}
              </div>
              <div className="text-muted-foreground mt-0.5">
                {t("refundWorkflow.alert.subtitle", { duration: "2h" })}
              </div>
            </div>
          </div>
          <ol className="space-y-3">
            {[
              { stageKey: "request" as const, whoKey: "boutiqueParis" as const, done: true },
              { stageKey: "conciergeValidation" as const, who: "S. Chen", done: true },
              { stageKey: "financeReview" as const, who: "M. Albert", done: true },
              {
                stageKey: "cfoApproval" as const,
                whoKey: "pending" as const,
                done: false,
                current: true,
              },
              { stageKey: "paymentDispatch" as const, who: "—", done: false },
              { stageKey: "journalPosted" as const, who: "—", done: false },
            ].map((s, i) => (
              <li key={i} className="flex items-center gap-3 text-[12px]">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center text-[10px] ${
                    s.done
                      ? "bg-gold/20 border-gold text-gold"
                      : s.current
                        ? "border-gold text-gold animate-pulse"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{t(`refundWorkflow.stages.${s.stageKey}`)}</div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {s.whoKey ? t(`refundWorkflow.requestors.${s.whoKey}` as never) : s.who}
                  </div>
                </div>
                {s.current && (
                  <button className="text-[11px] text-gold hover:underline">
                    {t("refundWorkflow.notifyCFO")}
                  </button>
                )}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </Page>
  );
}
