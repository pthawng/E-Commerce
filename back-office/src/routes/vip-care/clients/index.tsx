import { createFileRoute } from "@tanstack/react-router";
import { VipCareClientsPage } from "@/features/vip-care";

export const Route = createFileRoute("/vip-care/clients/")({
  head: () => ({ meta: [{ title: "VIP Clients - Ray Paradis" }] }),
  component: VipCareClientsPage,
});
