import { createFileRoute } from "@tanstack/react-router";
import { VipCareCommandCenterPage } from "@/features/vip-care";

export const Route = createFileRoute("/vip-care/")({
  head: () => ({ meta: [{ title: "VIP Care - Ray Paradis" }] }),
  component: VipCareCommandCenterPage,
});
