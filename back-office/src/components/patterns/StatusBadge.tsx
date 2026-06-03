import { Badge } from "@/components/ui-kit";
import type { BadgeVariant } from "@/components/ui-kit";

type StatusConfig = {
  label: string;
  variant: BadgeVariant;
};

const statusConfig: Record<string, StatusConfig> = {
  ACTIVE: { label: "Active", variant: "success" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
  INVITED: { label: "Invited", variant: "info" },
  MFA_SETUP_REQUIRED: { label: "MFA required", variant: "warning" },
  DRAFT: { label: "Draft", variant: "warning" },
  PENDING_REVIEW: { label: "Pending review", variant: "info" },
  PUBLISHED: { label: "Published", variant: "success" },
  OUT_OF_STOCK: { label: "Out of stock", variant: "destructive" },
  PRE_ORDER: { label: "Pre-order", variant: "gold" },
  WORKSHOP_REVIEW: { label: "Workshop review", variant: "info" },
  ARCHIVED: { label: "Archived", variant: "outline" },
  LOW_STOCK: { label: "Low stock", variant: "warning" },
  IN_STOCK: { label: "In stock", variant: "success" },
  RESERVED: { label: "Reserved", variant: "info" },
  COMMITTED: { label: "Committed", variant: "success" },
  RELEASED: { label: "Released", variant: "outline" },
  FAILED: { label: "Failed", variant: "destructive" },
};

function getStatusConfig(status: string | null | undefined): StatusConfig {
  if (!status) return { label: "Unknown", variant: "outline" };
  return statusConfig[status] ?? { label: status.replaceAll("_", " "), variant: "outline" };
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const config = getStatusConfig(status);
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
