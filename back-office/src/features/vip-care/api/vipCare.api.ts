import type { VipClient } from "../data/vipCare.data";
export type { VipClient } from "../data/vipCare.data";

export type VipCareTask = {
  clientId: string;
  client: string;
  matter: string;
  due: string;
  owner: string;
  priority: string;
};

export type VipCareTimelineEvent = {
  type: string;
  when: string;
  title: string;
  body: string;
  tone: string;
};

export type VipCareOpportunity = {
  clientId: string;
  client?: string;
  title: string;
  stage: string;
  value: string;
  valueNumber?: number;
  close: string;
  next: string;
};

export type VipCareGesture = {
  clientId: string;
  client: string;
  type: string;
  state: string;
  value: string;
  reason: string;
};

export type VipCareAftercareRequest = {
  clientId: string | null;
  client: string;
  item: string;
  state: string;
  sla: string;
  owner: string;
};

export type VipCarePrivateEvent = {
  title: string;
  city: string;
  date: string;
  invited: number;
  rsvp: number;
  followUps: number;
  value: string;
};

export type VipCareConciergePerformance = {
  name: string;
  region: string;
  clients: number;
  overdue: number;
  sla: string;
  response: string;
  pipeline: string;
};

export type VipCareCommandCenter = {
  summary: {
    todayTouches: number;
    overdueFollowUps: number;
    atRiskValue: string;
    bespokePipeline: string;
    vipRevenue: string;
    ltvGrowth: string;
    foundersCoverage: string;
  };
  clients: VipClient[];
  tasks: VipCareTask[];
  timelineEvents: VipCareTimelineEvent[];
  opportunities: VipCareOpportunity[];
  gestures: VipCareGesture[];
  aftercareRequests: VipCareAftercareRequest[];
  privateEvents: VipCarePrivateEvent[];
  conciergePerformance: VipCareConciergePerformance[];
};

export type VipCareClientDetail = {
  client: VipClient;
  timelineEvents: VipCareTimelineEvent[];
  opportunities: VipCareOpportunity[];
  gestures: VipCareGesture[];
  aftercareRequests: VipCareAftercareRequest[];
  orders: Array<{
    id: string;
    code: string;
    status: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    items: Array<{ id: string; productName: string; sku: string; quantity: number; price: number }>;
  }>;
};

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.message ?? body?.error ?? "VIP Care API request failed");
  }
  return body.data as T;
}

export const vipCareApi = {
  commandCenter() {
    return request<VipCareCommandCenter>("/api/back-office/vip-care/command-center");
  },
  clients(status?: string) {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<VipClient[]>(`/api/back-office/vip-care/clients${qs}`);
  },
  client(id: string) {
    return request<VipCareClientDetail>(`/api/back-office/vip-care/clients/${id}`);
  },
};
