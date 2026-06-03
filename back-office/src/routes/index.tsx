import { createFileRoute } from "@tanstack/react-router";
import { DashboardOverview } from "@/features/dashboard";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Executive · Ray Paradis" }] }),
  component: DashboardOverview,
});
