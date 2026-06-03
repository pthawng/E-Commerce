import { createFileRoute } from "@tanstack/react-router";
import { VipCareAftercarePage } from "@/features/vip-care";

export const Route = createFileRoute("/vip-care/aftercare")({
  head: () => ({ meta: [{ title: "Aftercare - Ray Paradis" }] }),
  component: VipCareAftercarePage,
});
