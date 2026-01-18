import { GripVertical, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useWorkspaceStore, type PanelInstance, type PanelType } from "@/hooks/useWorkspaceStore";
import { useUIStore } from "@/hooks/useUIStore";
import { getPanelActions, type ActionContext } from "./PanelActions";

interface PanelMenuProps {
    panel: PanelInstance;
    className?: string;
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

export function PanelMenu({ panel, className }: PanelMenuProps) {
    const { closePanel, openPanel, updatePanel } = useWorkspaceStore();
    const { openCommandPalette } = useUIStore();

    const actionContext: ActionContext = {
        openPanel,
        closePanel,
        updatePanel,
        openCommandPalette,
    };

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
        <div className={`flex items-center gap-1 ${className}`}>
            <DropdownMenu>
                <DropdownMenuTrigger className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Panel actions</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {panelActions.map((action) => (
                        <DropdownMenuItem
                            key={action.id}
                            onClick={() => handleAction(action)}
                            disabled={action.isDisabled?.(panel)}
                        >
                            {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                            {action.label}
                            {action.shortcut && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {action.shortcut}
                                </span>
                            )}
                        </DropdownMenuItem>
                    ))}

                    {panelActions.length > 0 && <DropdownMenuSeparator />}

                    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} variant="destructive">
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <button
                type="button"
                className="panel-drag-handle rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Drag panel"
            >
                <GripVertical className="h-4 w-4" />
            </button>
        </div>
    );
}
