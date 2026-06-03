import { createFileRoute } from "@tanstack/react-router";
import { AtelierPage } from "@/features/atelier";

export const Route = createFileRoute("/atelier")({
  head: () => ({ meta: [{ title: "Atelier · Ray Paradis" }] }),
  component: AtelierPage,
});
