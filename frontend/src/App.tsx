import { useEffect, useState } from "react";
import "./index.css";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { AgentStatus } from "@/components/dashboard/AgentStatus";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore, type PanelInstance } from "@/hooks/useWorkspaceStore";

export function App() {
  const panels = useWorkspaceStore((state: { panels: PanelInstance[] }) => state.panels);
  const openPanel = useWorkspaceStore(
    (state: { openPanel: (type: PanelInstance["type"], data?: Record<string, unknown>) => string }) =>
      state.openPanel
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [agentEvents] = useState<string[]>([]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (panels.length === 0) {
      openPanel("MARKET_AGGREGATOR_GRAPH", { marketId: "demo-market" });
      openPanel("NEWS_FEED", { query: "prediction markets" });
    }
  }, [openPanel, panels.length]);


  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div>
          <div className="text-sm text-muted-foreground">Prediction Market Dashboard</div>
          <div className="text-xl font-semibold">Workspace</div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setPaletteOpen(true)}>
            Open Command Palette
          </Button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <section className="flex-1 overflow-y-auto p-4">
          <DashboardGrid />
        </section>
        <aside className="w-80 border-l border-border bg-card p-4">
          <AgentStatus messages={agentEvents} />
        </aside>
      </main>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export default App;
