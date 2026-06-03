import { createFileRoute } from "@tanstack/react-router";
import { LedgerPage } from "@/features/ledger";

export const Route = createFileRoute("/ledger")({
  head: () => ({ meta: [{ title: "Ledger · Ray Paradis" }] }),
  component: LedgerPage,
});
