import { createFileRoute } from "@tanstack/react-router";
import { VipCareClient360Page } from "@/features/vip-care";

export const Route = createFileRoute("/vip-care/clients/$clientId")({
  head: () => ({ meta: [{ title: "Client 360 - Ray Paradis" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { clientId } = Route.useParams();
  return <VipCareClient360Page clientId={clientId} />;
}
