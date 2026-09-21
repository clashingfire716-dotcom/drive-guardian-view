import { createFileRoute } from "@tanstack/react-router";
import { StorageExplorer } from "@/components/storage-explorer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scope — macOS Storage Explorer" },
      { name: "description", content: "Visualize, inspect, and safely reclaim storage across your Mac." },
      { property: "og:title", content: "Scope — macOS Storage Explorer" },
      { property: "og:description", content: "Visualize, inspect, and safely reclaim storage across your Mac." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorageExplorer,
});
