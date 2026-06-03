import { createFileRoute } from "@tanstack/react-router";
import { VipCareRelationshipsPage } from "@/features/vip-care";

export const Route = createFileRoute("/vip-care/relationships")({
  head: () => ({ meta: [{ title: "Relationships - Ray Paradis" }] }),
  component: VipCareRelationshipsPage,
});
