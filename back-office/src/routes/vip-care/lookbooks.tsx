import { createFileRoute } from "@tanstack/react-router";
import { VipCareLookbooksPage } from "@/features/vip-care";

export const Route = createFileRoute("/vip-care/lookbooks")({
  head: () => ({ meta: [{ title: "Lookbooks - Ray Paradis" }] }),
  component: VipCareLookbooksPage,
});
