import { createFileRoute } from "@tanstack/react-router";
import { CmsPage } from "@/features/cms";

export const Route = createFileRoute("/cms")({
  head: () => ({ meta: [{ title: "Storytelling · Ray Paradis" }] }),
  component: CmsPage,
});
