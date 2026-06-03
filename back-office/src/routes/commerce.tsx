import { createFileRoute } from "@tanstack/react-router";
import { CommerceOperationsPage } from "@/features/catalog";

export const Route = createFileRoute("/commerce")({
  head: () => ({ meta: [{ title: "Commerce · Ray Paradis" }] }),
  component: CommerceOperationsPage,
});
