import { createFileRoute } from "@tanstack/react-router";
import { AssistantPage } from "@/features/ai-assistant";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant · Ray Paradis" }] }),
  component: AssistantPage,
});
