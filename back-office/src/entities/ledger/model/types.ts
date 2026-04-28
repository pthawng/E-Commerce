export type MaterialType = "gold" | "silver" | "platinum" | "palladium";
export type Purity = "10k" | "14k" | "18k" | "24k" | "925" | "950";
export type GemstoneType =
  | "diamond"
  | "ruby"
  | "sapphire"
  | "emerald"
  | "pearl";

export interface LedgerEntry {
  id: string;
  type: "CREDIT" | "DEBIT" | "TRANSFER" | "ADJUSTMENT";
  materialType: MaterialType | GemstoneType;
  quantity: number; // For metals: grams, For stones: carats or units
  unit: "g" | "ct" | "unit";
  purity?: Purity;
  source: string; // e.g., 'Vendor: GoldenRefinery', 'Vault: Main'
  destination: string; // e.g., 'Atelier: Workbench-1', 'Order: ORD-772'
  referenceId: string; // Linking to Order ID, Vendor ID, or Adjustment ID
  description: string;
  userId: string; // Auditor/Goldsmith ID
  metadata: Record<string, any>;
  createdAt: string;
}

export interface MaterialBalance {
  material: MaterialType | GemstoneType;
  purity?: Purity;
  totalIn: number;
  totalOut: number;
  currentBalance: number;
  unit: "g" | "ct" | "unit";
  valuation: number; // Current market value
}

export interface ReconciliationRecord {
  id: string;
  periodStart: string;
  periodEnd: string;
  expectedBalance: number;
  actualBalance: number;
  discrepancy: number;
  reason?: string;
  status: "MATCHED" | "DISCREPANCY" | "RESOLVED";
  resolvedById?: string;
  createdAt: string;
}
