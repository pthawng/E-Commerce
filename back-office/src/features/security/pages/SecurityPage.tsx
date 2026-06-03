import { Page, Panel, Stat, Badge, DataTable } from "@/components/ui-kit";
import type { BadgeVariant } from "@/components/ui-kit";
import { ResourceTable } from "@/components/patterns";
import { ShieldCheck, Key, AlertTriangle, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const logs = [
  {
    t: "16:48:02",
    who: "S. Chen",
    roleKey: "concierge" as const,
    actionKey: "viewedVIPProfile" as const,
    ip: "203.0.113.42",
    loc: "Tokyo",
    v: "default",
  },
  {
    t: "16:42:17",
    who: "S. Chen",
    roleKey: "concierge" as const,
    actionKey: "approvedRefund" as const,
    ip: "203.0.113.42",
    loc: "Tokyo",
    v: "warning",
  },
  {
    t: "15:08:34",
    who: "L. Bernard",
    roleKey: "vaultKeeper" as const,
    actionKey: "sealedVaultTransfer" as const,
    actionParams: { count: 4 },
    ip: "10.1.4.22",
    loc: "Geneva",
    v: "info",
  },
  {
    t: "14:51:11",
    who: "System",
    roleKey: null,
    actionKey: "failedLoginMultiple" as const,
    actionParams: { count: 3, account: "m.albert" },
    ip: "185.211.7.4",
    loc: "Unknown",
    v: "destructive",
  },
  {
    t: "13:55:00",
    who: "System",
    roleKey: null,
    actionKey: "dailyReconCompleted" as const,
    ip: "internal",
    loc: "Paris",
    v: "success",
  },
  {
    t: "11:20:42",
    who: "A. Marchand",
    roleKey: "operationsDirector" as const,
    actionKey: "publishedEditorial" as const,
    ip: "10.1.1.7",
    loc: "Paris",
    v: "info",
  },
];

const roles = [
  {
    roleKey: "executive" as const,
    mods: {
      dashboard: true,
      commerce: true,
      vault: true,
      atelier: true,
      crm: true,
      ledger: true,
      cms: true,
      security: true,
    },
  },
  {
    roleKey: "operationsDirector" as const,
    mods: {
      dashboard: true,
      commerce: true,
      vault: true,
      atelier: true,
      crm: true,
      ledger: true,
      cms: true,
      security: true,
    },
  },
  {
    roleKey: "concierge" as const,
    mods: {
      dashboard: true,
      commerce: true,
      vault: false,
      atelier: false,
      crm: true,
      ledger: false,
      cms: false,
      security: false,
    },
  },
  {
    roleKey: "vaultKeeper" as const,
    mods: {
      dashboard: true,
      commerce: false,
      vault: true,
      atelier: false,
      crm: false,
      ledger: false,
      cms: false,
      security: false,
    },
  },
  {
    roleKey: "artisan" as const,
    mods: {
      dashboard: false,
      commerce: false,
      vault: false,
      atelier: true,
      crm: false,
      ledger: false,
      cms: false,
      security: false,
    },
  },
  {
    roleKey: "finance" as const,
    mods: {
      dashboard: true,
      commerce: false,
      vault: false,
      atelier: false,
      crm: false,
      ledger: true,
      cms: false,
      security: false,
    },
  },
  {
    roleKey: "editor" as const,
    mods: {
      dashboard: true,
      commerce: true,
      vault: false,
      atelier: false,
      crm: false,
      ledger: false,
      cms: true,
      security: false,
    },
  },
];

export function SecurityPage() {
  const { t } = useTranslation("security");
  const modules = Object.keys(roles[0].mods) as Array<keyof (typeof roles)[0]["mods"]>;

  return (
    <Page>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-display text-3xl flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-gold" /> {t("page.title")}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            {t("page.subtitle", { date: "12 Apr 2026" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">
            <Check className="h-2.5 w-2.5" /> {t("badges.ssoActive")}
          </Badge>
          <Badge variant="gold">
            <Key className="h-2.5 w-2.5" /> {t("badges.mfaEnforced")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat
          label={t("kpis.activeSessions")}
          value="42"
          hint={t("kpis.activeSessionsHint", { n: 11 })}
        />
        <Stat
          label={t("kpis.privilegedUsers")}
          value="6"
          hint={t("kpis.privilegedUsersHint", { total: 184 })}
        />
        <Stat
          label={t("kpis.failedLogins")}
          value="3"
          delta="−12"
          trend="up"
          hint={t("kpis.failedLoginsHint")}
        />
        <Stat accent label={t("kpis.riskScore")} value="A" hint={t("kpis.riskScoreHint")} />
      </div>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1">
          <div className="text-[13px] font-medium">
            {t("suspiciousAlert.title", { account: "m.albert" })}
          </div>
          <div className="text-[11.5px] text-muted-foreground">
            {t("suspiciousAlert.detail", { attempts: 3, ip: "185.211.7.4" })}
          </div>
        </div>
        <button className="text-[12px] px-3 py-1.5 rounded border border-destructive/40 text-destructive hover:bg-destructive/10">
          {t("suspiciousAlert.action")}
        </button>
      </div>

      <Panel title={t("auditLog.title")} subtitle={t("auditLog.subtitle")} padded={false}>
        <DataTable
          columns={[
            {
              key: "t",
              header: t("auditLog.columns.timestamp"),
              className: "text-mono tabular text-[11.5px] text-muted-foreground",
              width: "110px",
            },
            {
              key: "who",
              header: t("auditLog.columns.actor"),
              render: (r) => (
                <div>
                  <div className="font-medium">{r.who}</div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {r.roleKey ? t(`roleMatrix.roles.${r.roleKey}` as never) : "—"}
                  </div>
                </div>
              ),
            },
            {
              key: "action",
              header: t("auditLog.columns.action"),
              render: (r) =>
                t(`auditLog.actions.${r.actionKey}` as never, r.actionParams) as string,
            },
            {
              key: "ip",
              header: t("auditLog.columns.ip"),
              className: "text-mono text-[11px] text-muted-foreground",
            },
            {
              key: "loc",
              header: t("auditLog.columns.location"),
              className: "text-[11.5px] text-muted-foreground",
            },
            {
              key: "v",
              header: t("auditLog.columns.risk"),
              render: (r) => (
                <Badge variant={r.v as BadgeVariant}>
                  {r.v === "destructive"
                    ? t("auditLog.risk.high")
                    : r.v === "warning"
                      ? t("auditLog.risk.medium")
                      : t("auditLog.risk.normal")}
                </Badge>
              ),
            },
          ]}
          rows={logs}
        />
      </Panel>

      <Panel
        title={t("roleMatrix.title")}
        subtitle={t("roleMatrix.subtitle", { users: 184, roles: 7, modules: 8 })}
        padded={false}
      >
        <ResourceTable
          rows={roles}
          getRowKey={(role) => role.roleKey}
          columns={[
            {
              key: "roleKey",
              header: t("roleMatrix.columns.role"),
              className: "font-medium",
              render: (role) => t(`roleMatrix.roles.${role.roleKey}` as never),
            },
            ...modules.map((moduleKey) => ({
              key: moduleKey,
              header: t(`roleMatrix.modules.${moduleKey}` as never),
              className: "text-center",
              headerClassName: "text-center",
              render: (role: (typeof roles)[number]) =>
                role.mods[moduleKey] ? (
                  <Check className="mx-auto h-3.5 w-3.5 text-success" />
                ) : (
                  <X className="mx-auto h-3.5 w-3.5 text-muted-foreground/40" />
                ),
            })),
          ]}
        />
      </Panel>
    </Page>
  );
}
