/**
 * Panel Action Registrations
 * 
 * This file registers all panel-specific context menu actions.
 * Import this file once in the app to activate all registrations.
 */

import { registerPanelActions } from "./PanelActions";
import {
    Newspaper,
    BarChart2,
    FileText,
    Sparkles,
    LineChart,
    ExternalLink,
    Copy,
    RefreshCw
} from "lucide-react";
import { backendInterface } from "@/backendInterface";

// ============================================
// CHART Panel Actions
// ============================================
registerPanelActions("CHART", [
    {
        id: "open-news",
        label: "View Related News",
        icon: Newspaper,
        handler: async (panel, ctx) => {
            // Extract keywords from market title for news search
            let marketTitle = String(panel.data.title || "market");

            // If title is generic and we have a marketId, fetch the real title
            if ((!marketTitle || marketTitle === "Chart" || marketTitle === "Super Chart") && panel.data.marketId && panel.data.marketId !== "demo-market") {
                try {
                    const market = await backendInterface.fetchMarket(String(panel.data.marketId));
                    marketTitle = market.title;
                    // Optionally update the panel title so we don't need to fetch next time
                    ctx.updatePanel(panel.id, { title: market.title });
                } catch (e) {
                    console.error("Failed to fetch market for news context", e);
                }
            }

            const keywords = marketTitle.split(/\s+/).slice(0, 4).join(" ");

            ctx.openPanel("NEWS_FEED", {
                query: keywords,
                title: `News: ${marketTitle.slice(0, 30)}...`
            });
        },
    },
    {
        id: "open-orderbook",
        label: "Open Order Book",
        icon: BarChart2,
        handler: (panel, ctx) => {
            ctx.openPanel("ORDER_BOOK", {
                marketId: panel.data.marketId,
                title: `Order Book`,
            });
        },
        // Only show if we have a valid market ID
        isVisible: (panel) => !!panel.data.marketId && panel.data.marketId !== "demo-market",
    },
    {
        id: "view-rules",
        label: "Market Details",
        icon: FileText,
        handler: (panel, ctx) => {
            // TODO: Open a modal or details panel
            // For now, could use command palette or alert
            const marketId = String(panel.data.marketId || "");
            console.log("View market details for:", marketId);

            // Could open a URL in new tab for Polymarket
            if (marketId.startsWith("0x")) {
                window.open(`https://polymarket.com/event/${marketId}`, "_blank");
            }
        },
        isVisible: (panel) => !!panel.data.marketId && panel.data.marketId !== "demo-market",
    },
    {
        id: "copy-market-id",
        label: "Copy Market ID",
        icon: Copy,
        handler: (panel) => {
            const marketId = String(panel.data.marketId || "");
            navigator.clipboard.writeText(marketId).catch(console.error);
        },
        isVisible: (panel) => !!panel.data.marketId && panel.data.marketId !== "demo-market",
    },
]);

// ============================================
// ORDER_BOOK Panel Actions
// ============================================
registerPanelActions("ORDER_BOOK", [
    {
        id: "open-chart",
        label: "Open Chart",
        icon: LineChart,
        handler: (panel, ctx) => {
            ctx.openPanel("CHART", {
                marketId: panel.data.marketId,
                title: `Chart`,
            });
        },
        isVisible: (panel) => !!panel.data.marketId && panel.data.marketId !== "demo-market",
    },
    {
        id: "open-news",
        label: "View Related News",
        icon: Newspaper,
        handler: async (panel, ctx) => {
            let marketTitle = String(panel.data.title || "market");

            // If title is generic and we have a marketId, fetch the real title
            if ((!marketTitle || marketTitle === "Order Book") && panel.data.marketId && panel.data.marketId !== "demo-market") {
                try {
                    const market = await backendInterface.fetchMarket(String(panel.data.marketId));
                    marketTitle = market.title;
                    ctx.updatePanel(panel.id, { title: marketTitle });
                } catch (e) {
                    console.error("Failed to fetch market for news context", e);
                }
            }

            const keywords = marketTitle.split(/\s+/).slice(0, 4).join(" ");

            ctx.openPanel("NEWS_FEED", {
                query: keywords,
                title: `News: ${marketTitle.slice(0, 30)}...`
            });
        },
    },
    {
        id: "copy-market-id",
        label: "Copy Market ID",
        icon: Copy,
        handler: (panel, ctx) => {
            const marketId = String(panel.data.marketId || "");
            navigator.clipboard.writeText(marketId).catch(console.error);
        },
        isVisible: (panel) => !!panel.data.marketId,
    },
]);

// ============================================
// NEWS_FEED Panel Actions  
// ============================================
registerPanelActions("NEWS_FEED", [
    {
        id: "refine-search",
        label: "Refine Search",
        icon: RefreshCw,
        handler: (panel, ctx) => {
            const currentQuery = String(panel.data.query || "");
            ctx.openCommandPalette("open-news-feed", { query: currentQuery });
            ctx.closePanel(panel.id);
        },
    },
    {
        id: "open-in-browser",
        label: "Search on Google News",
        icon: ExternalLink,
        handler: (panelInstance) => {
            const query = encodeURIComponent(String(panelInstance.data.query || ""));
            window.open(`https://news.google.com/search?q=${query}`, "_blank");
        },
        isVisible: (panel) => !!panel.data.query,
    },
]);

// ============================================
// MARKET_AGGREGATOR_GRAPH Panel Actions (legacy)
// ============================================
registerPanelActions("MARKET_AGGREGATOR_GRAPH", [
    {
        id: "open-news",
        label: "View Related News",
        icon: Newspaper,
        handler: async (panel, ctx) => {
            let marketTitle = String(panel.data.title || "market");

            // Fetch real title if generic
            if ((!marketTitle || marketTitle === "Market Graph") && panel.data.marketId) {
                try {
                    const market = await backendInterface.fetchMarket(String(panel.data.marketId));
                    marketTitle = market.title;
                    ctx.updatePanel(panel.id, { title: marketTitle });
                } catch (e) {
                    console.error("Failed to fetch market for news context", e);
                }
            }

            const keywords = marketTitle.split(/\s+/).slice(0, 4).join(" ");

            ctx.openPanel("NEWS_FEED", {
                query: keywords,
                title: `News: ${marketTitle.slice(0, 30)}...`
            });
        },
    },
]);

// Export a no-op to ensure this file is imported
export const panelActionsRegistered = true;
