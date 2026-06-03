import { createFileRoute } from "@tanstack/react-router";
import { VaultPage } from "@/features/inventory";

export const Route = createFileRoute("/vault")({
  head: () => ({ meta: [{ title: "Vault · Ray Paradis" }] }),
  component: VaultPage,
});
