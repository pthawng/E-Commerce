import { createFileRoute } from "@tanstack/react-router";
import { VipCareTasksPage } from "@/features/vip-care";

export const Route = createFileRoute("/vip-care/tasks")({
  head: () => ({ meta: [{ title: "Concierge Tasks - Ray Paradis" }] }),
  component: VipCareTasksPage,
});
