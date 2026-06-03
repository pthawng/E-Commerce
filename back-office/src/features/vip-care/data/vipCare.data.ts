export type VipClient = {
  id: string;
  initials: string;
  name: string;
  formOfAddress: string;
  city: string;
  language: string;
  tier: "Founders Circle" | "Atelier Prive" | "Maison";
  status: "Active" | "At risk" | "High potential" | "Bespoke";
  concierge: string;
  ltv: string;
  spend12m: string;
  openValue: string;
  risk: number;
  lastTouch: string;
  nextTouch: string;
  contactPreference: string;
  entourage: string;
  sizes: string[];
  preferences: string[];
  sensitiveNotes: number;
  activeServices: number;
  openApprovals: number;
};

export const vipClients: VipClient[] = [
  {
    id: "kenji-tanaka",
    initials: "KT",
    name: "Mr. Kenji Tanaka",
    formOfAddress: "Mr. Tanaka",
    city: "Tokyo",
    language: "Japanese / English",
    tier: "Founders Circle",
    status: "Bespoke",
    concierge: "S. Chen",
    ltv: "EUR 4.82M",
    spend12m: "EUR 920K",
    openValue: "EUR 1.25M",
    risk: 18,
    lastTouch: "Today, WhatsApp",
    nextTouch: "Tomorrow, wax approval",
    contactPreference: "WhatsApp before 18:00 JST",
    entourage: "Spouse: Emi Tanaka; PA: H. Mori",
    sizes: ["Ring 17.5mm", "Bracelet 16.5cm", "Necklace preferred"],
    preferences: ["Burmese ruby", "Cushion cut", "Platinum", "Engraving", "Lacquer box"],
    sensitiveNotes: 2,
    activeServices: 1,
    openApprovals: 1,
  },
  {
    id: "lin-wei",
    initials: "LW",
    name: "Ms. Lin Wei",
    formOfAddress: "Ms. Wei",
    city: "Shanghai",
    language: "Mandarin / English",
    tier: "Atelier Prive",
    status: "High potential",
    concierge: "S. Chen",
    ltv: "EUR 1.94M",
    spend12m: "EUR 610K",
    openValue: "EUR 420K",
    risk: 24,
    lastTouch: "Yesterday, boutique visit",
    nextTouch: "3 Jun, emerald preview",
    contactPreference: "WeChat, weekday mornings",
    entourage: "Stylist: Mei Zhou",
    sizes: ["Ring 15.8mm", "Bracelet 15.5cm"],
    preferences: ["Emerald", "Art Deco", "High collar styling", "White gold"],
    sensitiveNotes: 1,
    activeServices: 0,
    openApprovals: 0,
  },
  {
    id: "adriana-ferreira",
    initials: "AF",
    name: "Mme. Adriana Ferreira",
    formOfAddress: "Mme. Ferreira",
    city: "Sao Paulo",
    language: "Portuguese / French",
    tier: "Atelier Prive",
    status: "At risk",
    concierge: "J. Dubois",
    ltv: "EUR 1.41M",
    spend12m: "EUR 180K",
    openValue: "EUR 90K",
    risk: 72,
    lastTouch: "19 May, email",
    nextTouch: "Overdue, anniversary gift",
    contactPreference: "Email with French note",
    entourage: "Spouse: Rafael Ferreira",
    sizes: ["Ring 16.2mm", "Bracelet 16cm"],
    preferences: ["Yellow diamond", "Pearl", "Warm gold", "Handwritten notes"],
    sensitiveNotes: 3,
    activeServices: 1,
    openApprovals: 2,
  },
  {
    id: "andrei-volkov",
    initials: "AV",
    name: "Mr. Andrei Volkov",
    formOfAddress: "Mr. Volkov",
    city: "Geneva",
    language: "Russian / English",
    tier: "Maison",
    status: "Active",
    concierge: "L. Muller",
    ltv: "EUR 680K",
    spend12m: "EUR 220K",
    openValue: "EUR 160K",
    risk: 38,
    lastTouch: "Today, phone",
    nextTouch: "5 Jun, cufflink viewing",
    contactPreference: "Phone after 15:00 CET",
    entourage: "Driver receives boutique parcels",
    sizes: ["Ring 19mm", "Cufflink collector"],
    preferences: ["Onyx", "Platinum", "Architectural motifs"],
    sensitiveNotes: 0,
    activeServices: 0,
    openApprovals: 0,
  },
];

export const commandTasks = [
  {
    clientId: "adriana-ferreira",
    client: "Mme. Ferreira",
    matter: "Anniversary gesture overdue",
    due: "Overdue",
    owner: "J. Dubois",
    priority: "Critical",
  },
  {
    clientId: "kenji-tanaka",
    client: "Mr. Tanaka",
    matter: "Confirm center stone approval",
    due: "Tomorrow",
    owner: "S. Chen",
    priority: "High",
  },
  {
    clientId: "lin-wei",
    client: "Ms. Wei",
    matter: "Prepare emerald private preview",
    due: "3 Jun",
    owner: "S. Chen",
    priority: "High",
  },
  {
    clientId: "andrei-volkov",
    client: "Mr. Volkov",
    matter: "Send cufflink viewing agenda",
    due: "5 Jun",
    owner: "L. Muller",
    priority: "Medium",
  },
];

export const timelineEvents = [
  {
    type: "WhatsApp",
    when: "Today 16:22",
    title: "Wax photographs sent",
    body: "Updated wax model shared for approval before stone setting.",
    tone: "info",
  },
  {
    type: "Task",
    when: "Today 09:30",
    title: "Next action created",
    body: "Follow up on ruby certificate and engraving text.",
    tone: "warning",
  },
  {
    type: "Atelier",
    when: "27 May",
    title: "Private Vendome viewing",
    body: "90-minute appointment. Client requested softer profile on ring shoulder.",
    tone: "gold",
  },
  {
    type: "Gift",
    when: "22 May",
    title: "Maison candle dispatched",
    body: "Sent for spouse birthday with handwritten note.",
    tone: "success",
  },
  {
    type: "Order",
    when: "14 May",
    title: "Bespoke commission BSP-441 moved to wax",
    body: "Ruby cocktail ring advanced from CAD to wax review.",
    tone: "default",
  },
];

export const opportunities = [
  {
    clientId: "kenji-tanaka",
    title: "Bespoke ruby cocktail ring",
    stage: "Wax approval",
    value: "EUR 1.25M",
    close: "Jul 2026",
    next: "Confirm stone certificate",
  },
  {
    clientId: "lin-wei",
    title: "Emerald high jewelry suite",
    stage: "Private preview",
    value: "EUR 420K",
    close: "Jun 2026",
    next: "Prepare Shanghai viewing",
  },
  {
    clientId: "andrei-volkov",
    title: "Architectural cufflink capsule",
    stage: "Interest",
    value: "EUR 160K",
    close: "Aug 2026",
    next: "Geneva boutique appointment",
  },
];

export const gestures = [
  {
    clientId: "adriana-ferreira",
    client: "Mme. Ferreira",
    type: "Anniversary gift",
    state: "Pending approval",
    value: "EUR 850",
    reason: "Relationship recovery and spouse milestone",
  },
  {
    clientId: "kenji-tanaka",
    client: "Mr. Tanaka",
    type: "Atelier welcome",
    state: "Fulfillment requested",
    value: "EUR 420",
    reason: "Paris visit before final approval",
  },
  {
    clientId: "lin-wei",
    client: "Ms. Wei",
    type: "Collection preview",
    state: "Suggested",
    value: "EUR 0",
    reason: "Emerald preference and high engagement",
  },
];

export const aftercareRequests = [
  {
    clientId: "adriana-ferreira",
    client: "Mme. Ferreira",
    item: "Pearl strand clasp",
    state: "Assessment",
    sla: "1d",
    owner: "Service Atelier",
  },
  {
    clientId: "kenji-tanaka",
    client: "Mr. Tanaka",
    item: "Ruby ring certificate",
    state: "Estimate pending",
    sla: "2d",
    owner: "Gem Desk",
  },
  {
    clientId: "lin-wei",
    client: "Ms. Wei",
    item: "Bracelet resizing",
    state: "Ready for return",
    sla: "On track",
    owner: "Shanghai Boutique",
  },
];

export const privateEvents = [
  {
    title: "Nocturne Ruby Salon",
    city: "Paris",
    date: "11 Jun",
    invited: 18,
    rsvp: 12,
    followUps: 5,
    value: "EUR 2.8M",
  },
  {
    title: "Emerald Cabinet Preview",
    city: "Shanghai",
    date: "18 Jun",
    invited: 12,
    rsvp: 7,
    followUps: 3,
    value: "EUR 1.1M",
  },
  {
    title: "Founders Circle Dinner",
    city: "Geneva",
    date: "27 Jun",
    invited: 24,
    rsvp: 19,
    followUps: 9,
    value: "EUR 4.4M",
  },
];

export const conciergePerformance = [
  {
    name: "S. Chen",
    region: "APAC",
    clients: 22,
    overdue: 1,
    sla: "94%",
    response: "1.2h",
    pipeline: "EUR 1.67M",
  },
  {
    name: "J. Dubois",
    region: "LATAM / EU",
    clients: 18,
    overdue: 4,
    sla: "82%",
    response: "2.8h",
    pipeline: "EUR 420K",
  },
  {
    name: "L. Muller",
    region: "DACH",
    clients: 14,
    overdue: 0,
    sla: "97%",
    response: "1.5h",
    pipeline: "EUR 310K",
  },
  {
    name: "P. Holt",
    region: "UK",
    clients: 12,
    overdue: 2,
    sla: "89%",
    response: "2.1h",
    pipeline: "EUR 220K",
  },
];
