import { createFileRoute } from "@tanstack/react-router";
import { VipCareInsightsPage } from "@/features/vip-care";

export const Route = createFileRoute("/vip-care/insights")({
  head: () => ({ meta: [{ title: "VIP Insights - Ray Paradis" }] }),
  component: VipCareInsightsPage,
});
