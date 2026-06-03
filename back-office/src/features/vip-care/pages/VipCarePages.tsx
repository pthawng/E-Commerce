import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  CheckCircle2,
  Crown,
  Gem,
  Gift,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import { Badge, DataTable, Page, Panel, Stat } from "@/components/ui-kit";
import type { BadgeVariant } from "@/components/ui-kit";
import {
  OpenClientLink,
  RiskBadge,
  SectionNav,
  WorkflowState,
} from "../components/VipCarePrimitives";
import { cn } from "@/lib/utils";
import { useVipCareClient, useVipCareClients, useVipCareCommandCenter } from "../hooks/useVipCare";
import type {
  VipCareAftercareRequest,
  VipCareCommandCenter,
  VipCareGesture,
  VipCareOpportunity,
  VipCareTask,
  VipCareTimelineEvent,
  VipClient,
} from "../api/vipCare.api";

type WorkflowRow = Record<string, React.ReactNode> & {
  active?: string;
  state?: string;
};

const vipCareNav = [
  { labelKey: "nav.commandCenter", to: "/vip-care" },
  { labelKey: "nav.clients", to: "/vip-care/clients" },
  { labelKey: "nav.tasks", to: "/vip-care/tasks" },
  { labelKey: "nav.relationships", to: "/vip-care/relationships" },
  { labelKey: "nav.lookbooks", to: "/vip-care/lookbooks" },
  { labelKey: "nav.gifts", to: "/vip-care/gifts" },
  { labelKey: "nav.events", to: "/vip-care/events" },
  { labelKey: "nav.aftercare", to: "/vip-care/aftercare" },
  { labelKey: "nav.performance", to: "/vip-care/performance" },
  { labelKey: "nav.insights", to: "/vip-care/insights" },
];

type StringTuple = [string, string, string];

function useVipCareArray<T>(key: string): T[] {
  const { t } = useTranslation("vipCare");
  return t(key, { returnObjects: true }) as T[];
}

const emptyCommandCenter: VipCareCommandCenter = {
  summary: {
    todayTouches: 0,
    overdueFollowUps: 0,
    atRiskValue: "VND 0",
    bespokePipeline: "VND 0",
    vipRevenue: "VND 0",
    ltvGrowth: "+0%",
    foundersCoverage: "0%",
  },
  clients: [],
  tasks: [],
  timelineEvents: [],
  opportunities: [],
  gestures: [],
  aftercareRequests: [],
  privateEvents: [],
  conciergePerformance: [],
};

function Header({ active, title, subtitle }: { active: string; title: string; subtitle: string }) {
  const { t } = useTranslation("vipCare");
  const items = vipCareNav.map((item) => ({ label: t(item.labelKey), to: item.to }));

  return (
    <header className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl flex items-center gap-3">
            <Crown className="h-6 w-6 text-gold" />
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-[12.5px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="hidden items-center gap-2 xl:flex">
          <Badge variant="gold">{t("badges.foundersCoverage")}</Badge>
          <Badge variant="success">{t("badges.slaHealthy")}</Badge>
        </div>
      </div>
      <SectionNav items={items} active={active} />
    </header>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface/50 p-6 text-center">
      <div className="text-[13px] font-medium">{title}</div>
      <div className="mt-1 text-[11.5px] text-muted-foreground">{body}</div>
    </div>
  );
}

function TaskRows({ rows }: { rows: VipCareTask[] }) {
  const { t } = useTranslation("vipCare");

  if (!rows.length) {
    return <EmptyState title={t("empty.noActiveTasksTitle")} body={t("empty.noActiveTasksBody")} />;
  }

  return (
    <DataTable
      columns={[
        { key: "client", header: t("columns.client") },
        {
          key: "matter",
          header: t("columns.matter"),
          render: (r) => (
            <div>
              <div className="font-medium">{r.matter}</div>
              <div className="text-[11px] text-muted-foreground">
                {t("columns.owner")}: {r.owner}
              </div>
            </div>
          ),
        },
        {
          key: "due",
          header: t("columns.due"),
          render: (r) => (
            <Badge variant={r.due === "Overdue" ? "destructive" : "warning"}>{r.due}</Badge>
          ),
        },
        { key: "priority", header: t("columns.priority") },
        { key: "open", header: "", render: (r) => <OpenClientLink clientId={r.clientId} /> },
      ]}
      rows={rows}
    />
  );
}

export function VipCareCommandCenterPage() {
  const { t } = useTranslation("vipCare");
  const commandCenterQuery = useVipCareCommandCenter();
  const data = commandCenterQuery.data ?? emptyCommandCenter;
  const nextActions = useVipCareArray<StringTuple>("command.nextActions");

  return (
    <Page>
      <Header active="/vip-care" title={t("command.title")} subtitle={t("command.subtitle")} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          accent
          label={t("command.todayVipTouches")}
          value={data.summary.todayTouches}
          hint={t("command.derivedTasks")}
        />
        <Stat
          label={t("command.overdueFollowUps")}
          value={data.summary.overdueFollowUps}
          trend="down"
          hint={t("command.managerReview")}
        />
        <Stat
          label={t("command.atRiskValue")}
          value={data.summary.atRiskValue}
          hint={t("command.openLtvExposure")}
        />
        <Stat
          label={t("command.bespokePipeline")}
          value={data.summary.bespokePipeline}
          trend="up"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title={t("command.queueTitle")}
          subtitle={t("command.queueSubtitle")}
          padded={false}
        >
          <TaskRows rows={data.tasks} />
        </Panel>
        <Panel title={t("command.nextActionsTitle")}>
          <div className="space-y-3">
            {nextActions.map(([k, v, h]) => (
              <div key={v} className="rounded-md border border-border bg-surface p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {k}
                  </span>
                </div>
                <div className="mt-2 text-[12.5px] font-medium">{v}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{h}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title={t("command.milestonesTitle")}>
          <div className="space-y-3">
            {data.gestures.length ? (
              data.gestures.slice(0, 3).map((gesture) => (
                <div
                  key={`${gesture.client}-${gesture.reason}`}
                  className="flex gap-3 rounded-md border border-border bg-surface p-3"
                >
                  <Calendar className="mt-0.5 h-4 w-4 text-gold" />
                  <div>
                    <div className="text-mono text-[11px] text-muted-foreground">
                      {gesture.state}
                    </div>
                    <div className="text-[12.5px] font-medium">{gesture.client}</div>
                    <div className="text-[11px] text-muted-foreground">{gesture.reason}</div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title={t("command.noMilestonesTitle")}
                body={t("command.noMilestonesBody")}
              />
            )}
          </div>
        </Panel>
        <Panel title={t("command.openServicesTitle")}>
          <div className="space-y-3">
            {data.aftercareRequests.length ? (
              data.aftercareRequests.map((request) => (
                <div key={request.item} className="rounded-md border border-border bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-medium">{request.client}</span>
                    <Badge variant={request.sla === "1d" ? "warning" : "info"}>{request.sla}</Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {request.item} - {request.state}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title={t("empty.noAftercareTitle")} body={t("empty.noAftercareBody")} />
            )}
          </div>
        </Panel>
        <Panel title={t("command.approvalPressureTitle")}>
          <div className="space-y-3">
            {data.gestures.length ? (
              data.gestures.map((gesture) => (
                <div
                  key={gesture.client}
                  className="rounded-md border border-border bg-surface p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-medium">{gesture.type}</span>
                    <Badge variant={gesture.state === "Pending approval" ? "warning" : "outline"}>
                      {gesture.state}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {gesture.client} - {gesture.reason}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title={t("empty.noGestureApprovalsTitle")}
                body={t("empty.noGestureApprovalsBody")}
              />
            )}
          </div>
        </Panel>
      </div>
    </Page>
  );
}

export function VipCareClientsPage() {
  const { t } = useTranslation("vipCare");
  const clientsQuery = useVipCareClients();
  const clients = clientsQuery.data ?? [];
  const atRiskCount = clients.filter((client) => client.risk >= 60).length;
  const highPotentialCount = clients.filter((client) => client.status === "High potential").length;
  const noNextActionCount = clients.filter(
    (client) => client.nextTouch === "No scheduled milestone",
  ).length;

  return (
    <Page>
      <Header
        active="/vip-care/clients"
        title={t("clients.title")}
        subtitle={t("clients.subtitle")}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          accent
          label={t("clients.all")}
          value={clients.length}
          hint={t("clients.activeRelationships")}
        />
        <Stat label={t("clients.atRisk")} value={atRiskCount} trend="down" />
        <Stat label={t("clients.highPotential")} value={highPotentialCount} trend="up" />
        <Stat
          label={t("clients.noNextAction")}
          value={noNextActionCount}
          hint={t("clients.needsCoverage")}
        />
      </div>
      <Panel title={t("clients.bookTitle")} subtitle={t("clients.bookSubtitle")} padded={false}>
        {clients.length ? (
          <DataTable
            columns={[
              {
                key: "name",
                header: t("columns.client"),
                render: (r: VipClient) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-[11px] font-medium">
                      {r.initials}
                    </div>
                    <div>
                      <Link
                        to="/vip-care/clients/$clientId"
                        params={{ clientId: r.id }}
                        className="font-medium hover:text-gold"
                      >
                        {r.name}
                      </Link>
                      <div className="text-[10.5px] text-muted-foreground">
                        {r.city} - {r.language}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "tier",
                header: t("columns.tier"),
                render: (r: VipClient) => (
                  <Badge variant={r.tier === "Founders Circle" ? "gold" : "info"}>{r.tier}</Badge>
                ),
              },
              { key: "status", header: t("columns.status") },
              { key: "concierge", header: t("columns.concierge") },
              { key: "ltv", header: t("columns.ltv"), className: "text-mono text-right tabular" },
              {
                key: "risk",
                header: t("columns.risk"),
                render: (r: VipClient) => <RiskBadge score={r.risk} />,
              },
              {
                key: "nextTouch",
                header: t("columns.nextTouch"),
                className: "text-[11.5px] text-muted-foreground",
              },
            ]}
            rows={clients}
          />
        ) : (
          <EmptyState title={t("empty.noVipClientsTitle")} body={t("empty.noVipClientsBody")} />
        )}
      </Panel>
    </Page>
  );
}

export function VipCareTasksPage() {
  const { t } = useTranslation("vipCare");
  const commandCenterQuery = useVipCareCommandCenter();
  const data = commandCenterQuery.data ?? emptyCommandCenter;
  const overdueCount = data.tasks.filter((task) => task.due === "Overdue").length;

  return (
    <Page>
      <Header active="/vip-care/tasks" title={t("tasks.title")} subtitle={t("tasks.subtitle")} />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          accent
          label={t("tasks.myTasks")}
          value={data.tasks.length}
          hint={t("tasks.derivedQueue")}
        />
        <Stat label={t("tasks.teamQueue")} value={data.tasks.length} />
        <Stat label={t("tasks.overdue")} value={overdueCount} trend="down" />
        <Stat
          label={t("tasks.approvalsNeeded")}
          value={data.gestures.filter((gesture) => gesture.state.includes("approval")).length}
        />
      </div>
      <Panel title={t("tasks.priorityQueue")} padded={false}>
        <TaskRows rows={data.tasks} />
      </Panel>
      <Panel title={t("tasks.automationTitle")}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(t("tasks.automationRules", { returnObjects: true }) as string[]).map((rule) => (
            <div key={rule} className="rounded-md border border-border bg-surface p-3 text-[12px]">
              <CheckCircle2 className="mb-2 h-4 w-4 text-success" />
              {rule}
            </div>
          ))}
        </div>
      </Panel>
    </Page>
  );
}

export function VipCareRelationshipsPage() {
  const { t } = useTranslation("vipCare");
  const commandCenterQuery = useVipCareCommandCenter();
  const data = commandCenterQuery.data ?? emptyCommandCenter;
  const preferenceTotal = data.clients.reduce((sum, client) => sum + client.preferences.length, 0);

  return (
    <Page>
      <Header
        active="/vip-care/relationships"
        title={t("relationships.title")}
        subtitle={t("relationships.subtitle")}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          accent
          label={t("relationships.interactionsLogged")}
          value={data.timelineEvents.length}
          hint={t("relationships.orderTimeline")}
        />
        <Stat
          label={t("relationships.milestonesCovered")}
          value={data.gestures.length}
          trend="up"
        />
        <Stat label={t("relationships.preferenceRecords")} value={preferenceTotal} />
        <Stat label={t("relationships.entourageMapped")} value="0" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title={t("relationships.recentMemory")}>
          <ol className="space-y-3">
            {data.timelineEvents.length ? (
              data.timelineEvents.map((event: VipCareTimelineEvent) => (
                <li key={event.title} className="rounded-md border border-border bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={event.tone as BadgeVariant}>{event.type}</Badge>
                    <span className="text-mono text-[10.5px] text-muted-foreground">
                      {event.when}
                    </span>
                  </div>
                  <div className="mt-1 text-[12.5px] font-medium">{event.title}</div>
                  <div className="text-[11.5px] text-muted-foreground">{event.body}</div>
                </li>
              ))
            ) : (
              <EmptyState title={t("empty.noTimelineTitle")} body={t("empty.noTimelineBody")} />
            )}
          </ol>
        </Panel>
        <Panel title={t("relationships.registers")}>
          <div className="space-y-2">
            {(t("relationships.registerItems", { returnObjects: true }) as string[]).map((item) => (
              <div
                key={item}
                className="rounded-md border border-border bg-surface p-3 text-[12px]"
              >
                <MessageCircle className="mb-2 h-4 w-4 text-gold" />
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </Page>
  );
}

export function VipCareLookbooksPage() {
  const { t } = useTranslation("vipCare");
  const commandCenterQuery = useVipCareCommandCenter();
  const data = commandCenterQuery.data ?? emptyCommandCenter;
  const rows = data.opportunities.map((opportunity) => ({
    client: opportunity.client ?? opportunity.clientId,
    title: opportunity.title,
    state: t("lookbooks.draftCandidate"),
    items: 1,
    value: opportunity.value,
  }));

  return (
    <Page>
      <Header
        active="/vip-care/lookbooks"
        title={t("lookbooks.title")}
        subtitle={t("lookbooks.subtitle")}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat accent label={t("lookbooks.drafts")} value={rows.length} />
        <Stat label={t("lookbooks.sent")} value="0" />
        <Stat label={t("lookbooks.awaitingFeedback")} value="0" />
        <Stat label={t("lookbooks.linkedOpportunityValue")} value={data.summary.bespokePipeline} />
      </div>
      <Panel title={t("lookbooks.pipeline")} padded={false}>
        {rows.length ? (
          <DataTable
            columns={[
              { key: "client", header: t("columns.audience") },
              {
                key: "title",
                header: t("columns.lookbook"),
                render: (r) => (
                  <div>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {t("lookbooks.selectedPieces", { count: r.items })}
                    </div>
                  </div>
                ),
              },
              {
                key: "state",
                header: t("columns.state"),
                render: (r) => <Badge variant="info">{r.state}</Badge>,
              },
              {
                key: "value",
                header: t("columns.linkedValue"),
                className: "text-mono text-right tabular",
              },
            ]}
            rows={rows}
          />
        ) : (
          <EmptyState title={t("empty.noLookbooksTitle")} body={t("empty.noLookbooksBody")} />
        )}
      </Panel>
      <Panel title={t("lookbooks.followUpRuleTitle")}>
        <div className="rounded-md border border-border bg-surface p-4 text-[12.5px] text-muted-foreground">
          {t("lookbooks.followUpRuleBody")}
        </div>
      </Panel>
    </Page>
  );
}

export function VipCareGiftsPage() {
  const { t } = useTranslation("vipCare");
  const commandCenterQuery = useVipCareCommandCenter();
  const data = commandCenterQuery.data ?? emptyCommandCenter;

  return (
    <WorkflowPage
      active="/vip-care/gifts"
      title={t("gifts.title")}
      subtitle={t("gifts.subtitle")}
      icon={Gift}
      states={t("gifts.states", { returnObjects: true }) as string[]}
      rows={data.gestures.map((g: VipCareGesture) => ({
        ...g,
        active:
          g.state === "Fulfillment requested"
            ? "Fulfillment requested"
            : g.state === "Pending approval"
              ? "Pending approval"
              : "Suggested",
      }))}
      columns={["client", "type", "state", "value", "reason"]}
    />
  );
}

export function VipCareEventsPage() {
  const { t } = useTranslation("vipCare");
  const commandCenterQuery = useVipCareCommandCenter();
  const data = commandCenterQuery.data ?? emptyCommandCenter;

  return (
    <Page>
      <Header active="/vip-care/events" title={t("events.title")} subtitle={t("events.subtitle")} />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat accent label={t("events.upcoming")} value={data.privateEvents.length} />
        <Stat
          label={t("events.invitedClients")}
          value={data.privateEvents.reduce((sum, event) => sum + event.invited, 0)}
        />
        <Stat label={t("events.rsvpRate")} value="0%" trend="up" />
        <Stat label={t("events.attributedPipeline")} value="VND 0" />
      </div>
      <Panel title={t("events.program")} padded={false}>
        {data.privateEvents.length ? (
          <DataTable
            columns={[
              {
                key: "title",
                header: t("columns.event"),
                render: (r) => (
                  <div>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.city} - {r.date}
                    </div>
                  </div>
                ),
              },
              { key: "invited", header: t("columns.invited"), className: "text-mono tabular" },
              { key: "rsvp", header: t("columns.rsvp"), className: "text-mono tabular" },
              { key: "followUps", header: t("columns.followUps"), className: "text-mono tabular" },
              {
                key: "value",
                header: t("columns.pipeline"),
                className: "text-mono text-right tabular",
              },
            ]}
            rows={data.privateEvents}
          />
        ) : (
          <EmptyState title={t("empty.noEventsTitle")} body={t("empty.noEventsBody")} />
        )}
      </Panel>
      <Panel title={t("events.workflow")}>
        <WorkflowState
          states={t("events.states", { returnObjects: true }) as string[]}
          active={(t("events.states", { returnObjects: true }) as string[])[3]}
        />
      </Panel>
    </Page>
  );
}

export function VipCareAftercarePage() {
  const { t } = useTranslation("vipCare");
  const commandCenterQuery = useVipCareCommandCenter();
  const data = commandCenterQuery.data ?? emptyCommandCenter;

  return (
    <WorkflowPage
      active="/vip-care/aftercare"
      title={t("aftercare.title")}
      subtitle={t("aftercare.subtitle")}
      icon={Wrench}
      states={t("aftercare.states", { returnObjects: true }) as string[]}
      rows={data.aftercareRequests.map((r: VipCareAftercareRequest) => ({
        client: r.client,
        type: r.item,
        state: r.state,
        value: r.sla,
        reason: r.owner,
        active: r.state,
      }))}
      columns={["client", "type", "state", "value", "reason"]}
    />
  );
}

export function VipCarePerformancePage() {
  const { t } = useTranslation("vipCare");
  const commandCenterQuery = useVipCareCommandCenter();
  const data = commandCenterQuery.data ?? emptyCommandCenter;
  const overdueTotal = data.conciergePerformance.reduce((sum, row) => sum + row.overdue, 0);

  return (
    <Page>
      <Header
        active="/vip-care/performance"
        title={t("performance.title")}
        subtitle={t("performance.subtitle")}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          accent
          label={t("performance.teamSla")}
          value={data.conciergePerformance[0]?.sla ?? "100%"}
          trend="down"
        />
        <Stat label={t("performance.overdueByTeam")} value={overdueTotal} />
        <Stat
          label={t("performance.coverageGaps")}
          value={
            data.clients.filter((client) => client.nextTouch === "No scheduled milestone").length
          }
        />
        <Stat
          label={t("performance.approvalQueue")}
          value={data.gestures.filter((gesture) => gesture.state.includes("approval")).length}
        />
      </div>
      <Panel title={t("performance.team")} padded={false}>
        {data.conciergePerformance.length ? (
          <DataTable
            columns={[
              {
                key: "name",
                header: t("columns.concierge"),
                render: (r) => (
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground">{r.region}</div>
                  </div>
                ),
              },
              { key: "clients", header: t("columns.clients"), className: "text-mono tabular" },
              {
                key: "overdue",
                header: t("columns.overdue"),
                render: (r) => (
                  <Badge
                    variant={r.overdue > 2 ? "destructive" : r.overdue > 0 ? "warning" : "success"}
                  >
                    {r.overdue}
                  </Badge>
                ),
              },
              { key: "sla", header: t("columns.sla") },
              { key: "response", header: t("columns.avgResponse") },
              {
                key: "pipeline",
                header: t("columns.pipeline"),
                className: "text-mono text-right tabular",
              },
            ]}
            rows={data.conciergePerformance}
          />
        ) : (
          <EmptyState title={t("empty.noPerformanceTitle")} body={t("empty.noPerformanceBody")} />
        )}
      </Panel>
    </Page>
  );
}

export function VipCareInsightsPage() {
  const { t } = useTranslation("vipCare");
  const commandCenterQuery = useVipCareCommandCenter();
  const data = commandCenterQuery.data ?? emptyCommandCenter;

  return (
    <Page>
      <Header
        active="/vip-care/insights"
        title={t("insights.title")}
        subtitle={t("insights.subtitle")}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat accent label={t("insights.vipRevenue")} value={data.summary.vipRevenue} trend="up" />
        <Stat label={t("insights.ltvGrowth")} value={data.summary.ltvGrowth} trend="up" />
        <Stat
          label={t("insights.retentionRiskValue")}
          value={data.summary.atRiskValue}
          trend="down"
        />
        <Stat
          label={t("insights.foundersCoverage")}
          value={data.summary.foundersCoverage}
          trend="up"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <InsightPanel
          title={t("insights.relationshipKpis")}
          items={t("insights.relationshipItems", { returnObjects: true }) as string[]}
          icon={HeartHandshake}
        />
        <InsightPanel
          title={t("insights.commercialKpis")}
          items={t("insights.commercialItems", { returnObjects: true }) as string[]}
          icon={Gem}
        />
        <InsightPanel
          title={t("insights.serviceKpis")}
          items={t("insights.serviceItems", { returnObjects: true }) as string[]}
          icon={ShieldCheck}
        />
      </div>
      <Panel title={t("insights.topRisks")} padded={false}>
        <DataTable
          columns={[
            { key: "name", header: t("columns.client") },
            { key: "ltv", header: t("columns.ltv"), className: "text-mono tabular" },
            {
              key: "risk",
              header: t("columns.risk"),
              render: (r) => <RiskBadge score={r.risk} />,
            },
            { key: "nextTouch", header: t("columns.requiredAction") },
          ]}
          rows={data.clients.filter((client) => client.risk >= 35)}
        />
      </Panel>
    </Page>
  );
}

function InsightPanel({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: React.ElementType;
}) {
  return (
    <Panel title={title}>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-md border border-border bg-surface p-3 text-[12px]"
          >
            <Icon className="h-4 w-4 text-gold" />
            {item}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function WorkflowPage({
  active,
  title,
  subtitle,
  icon: Icon,
  states,
  rows,
  columns,
}: {
  active: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  states: string[];
  rows: WorkflowRow[];
  columns: string[];
}) {
  const { t } = useTranslation("vipCare");

  return (
    <Page>
      <Header active={active} title={title} subtitle={subtitle} />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat accent label={t("workflow.active")} value={rows.length} />
        <Stat
          label={t("workflow.pendingApproval")}
          value={rows.filter((r) => String(r.state).toLowerCase().includes("approval")).length}
        />
        <Stat label={t("workflow.slaWatch")} value="2" />
        <Stat label={t("workflow.closedThisMonth")} value="18" delta="+6" trend="up" />
      </div>
      <Panel title={`${title} ${t("workflow.workflowSuffix")}`}>
        <div className="flex items-start gap-3">
          <Icon className="mt-1 h-5 w-5 text-gold" />
          <WorkflowState states={states} active={rows[0]?.active ?? states[0]} />
        </div>
      </Panel>
      <Panel title={t("workflow.operationalQueue")} padded={false}>
        <DataTable
          columns={columns.map((key) => ({
            key,
            header:
              key === "value"
                ? t("columns.valueOrSla")
                : t(`columns.${key}`, { defaultValue: key.charAt(0).toUpperCase() + key.slice(1) }),
            render:
              key === "state"
                ? (r: WorkflowRow) => (
                    <Badge variant={String(r.state).includes("Pending") ? "warning" : "info"}>
                      {r.state}
                    </Badge>
                  )
                : undefined,
            className: key === "value" ? "text-mono tabular" : undefined,
          }))}
          rows={rows}
        />
      </Panel>
    </Page>
  );
}

export function VipCareClient360Page({ clientId }: { clientId: string }) {
  const { t } = useTranslation("vipCare");
  const clientQuery = useVipCareClient(clientId);
  const detail = clientQuery.data;
  const client = detail?.client;
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: t("client360.tabs.overview") },
    { id: "timeline", label: t("client360.tabs.timeline") },
    { id: "opportunities", label: t("client360.tabs.opportunities") },
    { id: "lookbooks", label: t("client360.tabs.lookbooks") },
    { id: "gifts", label: t("client360.tabs.gifts") },
    { id: "events", label: t("client360.tabs.events") },
    { id: "aftercare", label: t("client360.tabs.aftercare") },
    { id: "orders", label: t("client360.tabs.orders") },
    { id: "preferences", label: t("client360.tabs.preferences") },
    { id: "notes", label: t("client360.tabs.notes") },
  ];

  if (!client) {
    return (
      <Page>
        <Link to="/vip-care/clients" className="text-[12px] text-muted-foreground hover:text-gold">
          {t("client360.back")}
        </Link>
        <Panel
          title={
            clientQuery.isLoading ? t("client360.loadingPanel") : t("client360.unavailablePanel")
          }
        >
          <EmptyState
            title={
              clientQuery.isLoading ? t("client360.loadingTitle") : t("client360.missingTitle")
            }
            body={clientQuery.isLoading ? t("client360.loadingBody") : t("client360.missingBody")}
          />
        </Panel>
      </Page>
    );
  }

  const clientOpportunities = detail?.opportunities ?? [];
  const clientTimelineEvents = detail?.timelineEvents ?? [];
  const clientGestures = detail?.gestures ?? [];
  const clientAftercareRequests = detail?.aftercareRequests ?? [];
  const clientOrders = detail?.orders ?? [];

  return (
    <Page>
      <div className="space-y-5">
        <Link to="/vip-care/clients" className="text-[12px] text-muted-foreground hover:text-gold">
          {t("client360.back")}
        </Link>
        <section className="rounded-lg border border-gold/30 bg-card/70 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_18px_40px_-24px_rgba(212,175,55,0.45)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-display text-lg text-gold">
                {client.initials}
              </div>
              <div>
                <h1 className="text-display text-3xl">{client.name}</h1>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {client.formOfAddress} - {client.city} - {client.language}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="gold">{client.tier}</Badge>
                  <Badge variant="info">{client.status}</Badge>
                  <Badge variant="outline">
                    {t("client360.concierge", { name: client.concierge })}
                  </Badge>
                  <RiskBadge score={client.risk} />
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
              <MiniMetric label="LTV" value={client.ltv} />
              <MiniMetric label={t("client360.spend12m")} value={client.spend12m} />
              <MiniMetric label={t("client360.openValue")} value={client.openValue} />
            </div>
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-4 xl:grid-cols-8">
            {(t("client360.quickActions", { returnObjects: true }) as string[]).map(
              (action, index) => (
                <button
                  key={action}
                  className={cn(
                    "h-9 rounded-md border px-2 text-[11.5px] transition",
                    index === 0
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-border bg-surface text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {action}
                </button>
              ),
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Panel title={t("client360.relationshipSummary")}>
            <SummaryItem label={t("client360.contact")} value={client.contactPreference} />
            <SummaryItem label={t("client360.entourage")} value={client.entourage} />
            <SummaryItem label={t("client360.lastTouch")} value={client.lastTouch} />
            <SummaryItem label={t("client360.nextTouch")} value={client.nextTouch} />
          </Panel>
          <Panel title={t("client360.sizes")}>
            <div className="space-y-1.5">
              {client.sizes.map((size) => (
                <Badge key={size} variant="outline">
                  {size}
                </Badge>
              ))}
            </div>
          </Panel>
          <Panel title={t("client360.riskAccess")}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniMetric label={t("client360.notes")} value={String(client.sensitiveNotes)} />
              <MiniMetric label={t("client360.services")} value={String(client.activeServices)} />
              <MiniMetric label={t("client360.approvals")} value={String(client.openApprovals)} />
            </div>
          </Panel>
        </aside>

        <section className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-border bg-card/60 p-2">
            <div className="flex min-w-max gap-1">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "h-8 rounded-md px-3 text-[12px]",
                    tab === item.id
                      ? "bg-gold/10 text-gold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {tab === "overview" && (
            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title={t("client360.briefTitle")}>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {t("client360.briefBody", { name: client.formOfAddress, tier: client.tier })}
                </p>
              </Panel>
              <Panel title={t("client360.nextBestActions")}>
                <div className="space-y-2">
                  {(t("client360.nextBestActionItems", { returnObjects: true }) as string[]).map(
                    (action) => (
                      <div
                        key={action}
                        className="flex items-center gap-2 rounded-md border border-border bg-surface p-3 text-[12px]"
                      >
                        <Sparkles className="h-4 w-4 text-gold" />
                        {action}
                      </div>
                    ),
                  )}
                </div>
              </Panel>
              <Panel title={t("client360.activeOpportunities")} padded={false}>
                <DataTable
                  columns={[
                    { key: "title", header: t("columns.opportunity") },
                    { key: "stage", header: t("columns.stage") },
                    { key: "value", header: t("columns.value"), className: "text-mono tabular" },
                    { key: "next", header: t("columns.nextAction") },
                  ]}
                  rows={clientOpportunities}
                />
              </Panel>
              <Panel title={t("client360.upcomingMilestones")}>
                <div className="space-y-2">
                  {[
                    client.nextTouch,
                    ...clientGestures.slice(0, 2).map((gesture) => gesture.reason),
                  ]
                    .filter(Boolean)
                    .map((milestone) => (
                      <div
                        key={milestone}
                        className="rounded-md border border-border bg-surface p-3 text-[12px]"
                      >
                        {milestone}
                      </div>
                    ))}
                </div>
              </Panel>
            </div>
          )}

          {tab === "timeline" && <TimelinePanel events={clientTimelineEvents} />}
          {tab === "opportunities" && <OpportunityPanel rows={clientOpportunities} />}
          {tab === "preferences" && <PreferencePanel client={client} />}
          {tab === "aftercare" && <AftercarePanel rows={clientAftercareRequests} />}
          {tab === "orders" && <OrdersPanel rows={clientOrders} />}
          {tab === "notes" && <NotesPanel />}
          {![
            "overview",
            "timeline",
            "opportunities",
            "aftercare",
            "orders",
            "preferences",
            "notes",
          ].includes(tab) && (
            <Panel title={tabs.find((item) => item.id === tab)?.label ?? tab}>
              <div className="grid gap-3 md:grid-cols-2">
                {(t("client360.genericCards", { returnObjects: true }) as string[]).map((item) => (
                  <div key={item} className="rounded-md border border-border bg-surface p-4">
                    <div className="text-[12.5px] font-medium">{item}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {t("client360.genericContext", {
                        tab: tabs.find((item) => item.id === tab)?.label ?? tab,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </section>
      </div>
    </Page>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-mono text-[13px] tabular">{value}</div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border/60 py-2 last:border-b-0">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[12px]">{value}</div>
    </div>
  );
}

function TimelinePanel({ events }: { events: VipCareTimelineEvent[] }) {
  const { t } = useTranslation("vipCare");

  return (
    <Panel title={t("client360.timelineTitle")}>
      <ol className="relative ml-2 space-y-4 border-l border-border">
        {events.length ? (
          events.map((event) => (
            <li key={event.title} className="ml-5">
              <span className="absolute -left-[5px] h-2 w-2 rounded-full border border-background bg-gold/70" />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={event.tone as BadgeVariant}>{event.type}</Badge>
                <span className="text-mono text-[10.5px] text-muted-foreground">{event.when}</span>
              </div>
              <div className="mt-1 text-[12.5px] font-medium">{event.title}</div>
              <div className="text-[11.5px] text-muted-foreground">{event.body}</div>
            </li>
          ))
        ) : (
          <EmptyState
            title={t("empty.noClientTimelineTitle")}
            body={t("empty.noClientTimelineBody")}
          />
        )}
      </ol>
    </Panel>
  );
}

function OpportunityPanel({ rows }: { rows: VipCareOpportunity[] }) {
  const { t } = useTranslation("vipCare");

  return (
    <Panel title={t("client360.opportunityTitle")} padded={false}>
      {rows.length ? (
        <DataTable
          columns={[
            { key: "title", header: t("columns.opportunity") },
            { key: "stage", header: t("columns.stage") },
            { key: "value", header: t("columns.value"), className: "text-mono tabular" },
            { key: "close", header: t("columns.expectedClose") },
            { key: "next", header: t("columns.nextAction") },
          ]}
          rows={rows}
        />
      ) : (
        <EmptyState title={t("empty.noOpportunitiesTitle")} body={t("empty.noOpportunitiesBody")} />
      )}
    </Panel>
  );
}

function AftercarePanel({ rows }: { rows: VipCareAftercareRequest[] }) {
  const { t } = useTranslation("vipCare");

  return (
    <Panel title={t("client360.aftercareTitle")} padded={false}>
      {rows.length ? (
        <DataTable
          columns={[
            { key: "item", header: t("columns.item") },
            { key: "state", header: t("columns.state") },
            { key: "sla", header: t("columns.sla") },
            { key: "owner", header: t("columns.owner") },
          ]}
          rows={rows}
        />
      ) : (
        <EmptyState
          title={t("empty.noAftercareRequestsTitle")}
          body={t("empty.noAftercareRequestsBody")}
        />
      )}
    </Panel>
  );
}

function OrdersPanel({
  rows,
}: {
  rows: Array<{
    code: string;
    status: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
  }>;
}) {
  const { t } = useTranslation("vipCare");

  return (
    <Panel title={t("client360.ordersTitle")} padded={false}>
      {rows.length ? (
        <DataTable
          columns={[
            { key: "code", header: t("columns.order") },
            { key: "status", header: t("columns.status") },
            {
              key: "totalAmount",
              header: t("columns.value"),
              render: (r) => `${r.currency} ${Math.round(r.totalAmount).toLocaleString("en-US")}`,
              className: "text-mono tabular",
            },
            {
              key: "createdAt",
              header: t("columns.created"),
              render: (r) => new Date(r.createdAt).toLocaleDateString(),
            },
          ]}
          rows={rows}
        />
      ) : (
        <EmptyState title={t("empty.noOrdersTitle")} body={t("empty.noOrdersBody")} />
      )}
    </Panel>
  );
}

function PreferencePanel({ client }: { client: { preferences: string[] } }) {
  const { t } = useTranslation("vipCare");

  return (
    <Panel title={t("client360.preferenceTitle")}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            {t("client360.knownPreferences")}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {client.preferences.map((preference) => (
              <Badge key={preference} variant="outline">
                {preference}
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {(t("client360.preferenceHints", { returnObjects: true }) as string[]).map((item) => (
            <div key={item} className="rounded-md border border-border bg-surface p-3 text-[12px]">
              {item}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function NotesPanel() {
  const { t } = useTranslation("vipCare");

  return (
    <Panel title={t("client360.notesTitle")}>
      <div className="grid gap-3 md:grid-cols-3">
        {(t("client360.noteCards", { returnObjects: true }) as Array<[string, string]>).map(
          ([title, body]) => (
            <div key={title} className="rounded-md border border-border bg-surface p-4">
              <UserRoundCheck className="mb-3 h-4 w-4 text-gold" />
              <div className="text-[12.5px] font-medium">{title}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{body}</div>
            </div>
          ),
        )}
      </div>
    </Panel>
  );
}
