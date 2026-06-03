import { createFileRoute } from "@tanstack/react-router";
import { VipCareEventsPage } from "@/features/vip-care";

export const Route = createFileRoute("/vip-care/events")({
  head: () => ({ meta: [{ title: "Private Events - Ray Paradis" }] }),
  component: VipCareEventsPage,
});
