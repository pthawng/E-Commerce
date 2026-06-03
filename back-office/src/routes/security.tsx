import { createFileRoute } from "@tanstack/react-router";
import { SecurityPage } from "@/features/security";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "Security · Ray Paradis" }] }),
  component: SecurityPage,
});
