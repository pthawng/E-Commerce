import { createFileRoute } from "@tanstack/react-router";
import { VipCarePerformancePage } from "@/features/vip-care";

export const Route = createFileRoute("/vip-care/performance")({
  head: () => ({ meta: [{ title: "Concierge Performance - Ray Paradis" }] }),
  component: VipCarePerformancePage,
});
