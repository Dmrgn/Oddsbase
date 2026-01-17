import type { PanelInstance } from "@/hooks/useWorkspaceStore";
import { MarketAggregatorPanel } from "@/components/panels/MarketAggregatorPanel";
import { NewsFeedPanel } from "@/components/panels/NewsFeedPanel";
import { PanelWrapper } from "@/components/panels/PanelWrapper";

interface PanelRegistryProps {
  panel: PanelInstance;
}

export function PanelRegistry({ panel }: PanelRegistryProps) {
  switch (panel.type) {
    case "MARKET_AGGREGATOR_GRAPH":
      return (
        <PanelWrapper panel={panel}>
          <MarketAggregatorPanel panel={panel} />
        </PanelWrapper>
      );
    case "NEWS_FEED":
      return (
        <PanelWrapper panel={panel}>
          <NewsFeedPanel panel={panel} />
        </PanelWrapper>
      );
    default:
      return (
        <div className="h-full rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Unknown panel type: {panel.type}
        </div>
      );
  }
}
