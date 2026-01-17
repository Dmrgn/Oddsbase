import { useEffect, useMemo, useState } from "react";
import { backendInterface, type MarketPoint } from "@/backendInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber, formatCurrency, formatTimestamp } from "@/lib/utils";
import type { PanelInstance } from "@/hooks/useWorkspaceStore";

interface MarketAggregatorPanelProps {
  panel: PanelInstance;
}

export function MarketAggregatorPanel({ panel }: MarketAggregatorPanelProps) {
  const marketId = String(panel.data.marketId ?? "");
  const [points, setPoints] = useState<MarketPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    backendInterface
      .fetchMarketData(marketId)
      .then((data) => {
        if (!isMounted) return;
        setPoints(data.points ?? []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message ?? "Unable to load market data");
      });

    unsubscribe = backendInterface.socket.subscribeToMarket(marketId, (point) => {
      setPoints((prev) => [...prev.slice(-49), point]);
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [marketId]);

  const latestPoint = points.length ? points[points.length - 1] : null;
  const delta = useMemo(() => {
    if (points.length < 2) return null;
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    if (!last || !prev) return null;
    return last.price - prev.price;
  }, [points]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="shrink-0">
        <CardTitle>{String(panel.data.title ?? "Market Aggregator")}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <div className="text-sm text-muted-foreground">Market ID: {marketId}</div>
        {error && <div className="text-sm text-destructive">{error}</div>}
        {!error && points.length === 0 && (
          <div className="text-sm text-muted-foreground">Loading market data…</div>
        )}
        {latestPoint && (
          <div className="grid gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Latest Price</span>
              <span className="font-medium">{formatCurrency(latestPoint.price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price Change</span>
              <span className={delta !== null && delta >= 0 ? "text-emerald-500" : "text-rose-500"}>
                {delta !== null ? formatCurrency(delta) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Volume</span>
              <span className="font-medium">{formatCompactNumber(latestPoint.volume)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Update</span>
              <span className="font-medium">{formatTimestamp(latestPoint.timestamp)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
