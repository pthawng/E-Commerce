import { createFileRoute } from "@tanstack/react-router";
import { VipCareGiftsPage } from "@/features/vip-care";

export const Route = createFileRoute("/vip-care/gifts")({
  head: () => ({ meta: [{ title: "Gifts & Gestures - Ray Paradis" }] }),
  component: VipCareGiftsPage,
});
