import { GripVertical, MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceStore, type PanelInstance, type PanelType } from "@/hooks/useWorkspaceStore";
import { useUIStore } from "@/hooks/useUIStore";
import { getPanelActions, type ActionContext } from "./PanelActions";
import { PanelMenu } from "./PanelMenu";

interface PanelWrapperProps {
  panel: PanelInstance;
  children: ReactNode;
  hideHeader?: boolean;
}

const panelCommandMap: Partial<Record<PanelType, string>> = {
  MARKET_AGGREGATOR_GRAPH: "open-market-aggregator",
  NEWS_FEED: "open-news-feed",
  CHART: "open-chart",
  ORDER_BOOK: "open-order-book",
};

const extractPanelParams = (panel: PanelInstance): Record<string, string> => {
  switch (panel.type) {
    case "MARKET_AGGREGATOR_GRAPH":
    case "CHART":
    case "ORDER_BOOK":
      return {
        marketId: String(panel.data.marketId ?? ""),
      };
    case "NEWS_FEED":
      return {
        query: String(panel.data.query ?? ""),
      };
    default:
      return {};
  }
};

export function PanelWrapper({ panel, children, hideHeader = false }: PanelWrapperProps) {
  const { closePanel, openPanel, updatePanel } = useWorkspaceStore();
  const { openCommandPalette } = useUIStore();

  // Build action context for panel actions
  const actionContext: ActionContext = {
    openPanel,
    closePanel,
    updatePanel,
    openCommandPalette,
  };

  // Get panel-specific actions from registry
  const panelActions = getPanelActions(panel);

  const handleDelete = () => {
    closePanel(panel.id);
  };

  const handleEdit = () => {
    const commandId = panelCommandMap[panel.type];
    const params = extractPanelParams(panel);

    closePanel(panel.id);
    if (commandId) {
      openCommandPalette(commandId, params);
    }
  };

  const handleAction = async (action: typeof panelActions[number]) => {
    try {
      await action.handler(panel, actionContext);
    } catch (error) {
      console.error(`Error executing action ${action.id}:`, error);
    }
  };

  return (
    <Card className="flex h-full flex-col">
      {!hideHeader && (
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{String(panel.data.title ?? "Untitled Panel")}</CardTitle>
          <PanelMenu panel={panel} />
        </CardHeader>
      )}
      <CardContent className="min-h-0 flex-1 overflow-hidden">
        {children}
      </CardContent>
    </Card>
  );
}
