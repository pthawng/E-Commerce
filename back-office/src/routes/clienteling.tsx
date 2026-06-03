import { createFileRoute } from "@tanstack/react-router";
import { VipCareCommandCenterPage } from "@/features/vip-care";

export const Route = createFileRoute("/clienteling")({
  head: () => ({ meta: [{ title: "VIP Care - Ray Paradis" }] }),
  component: VipCareCommandCenterPage,
});
