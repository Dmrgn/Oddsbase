/**
 * Layer 1: Backend Interface
 * The source of truth for all external data.
 * Abstracts both REST and Real-time communication.
 */

const MOCK_MARKETS = ["demo-market", "election-2026", "crypto-btc", "sports-finals"];

type MarketPoint = {
  timestamp: string;
  price: number;
  volume: number;
};

type MarketDataResponse = {
  marketId: string;
  points: MarketPoint[];
};

type NewsItem = {
  id: string;
  title: string;
  source: string;
  sentiment: "positive" | "neutral" | "negative";
  publishedAt: string;
  url: string;
};

type NewsResponse = {
  query: string;
  items: NewsItem[];
};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const buildMockPoints = (marketId: string): MarketPoint[] => {
  const base = randomBetween(0.25, 0.85);
  const now = Date.now();
  return Array.from({ length: 24 }, (_, index) => {
    const jitter = randomBetween(-0.05, 0.05);
    return {
      timestamp: new Date(now - (24 - index) * 60 * 60 * 1000).toISOString(),
      price: Math.min(0.95, Math.max(0.05, base + jitter)),
      volume: Math.floor(randomBetween(1200, 8400)),
    };
  });
};

const buildMockNews = (query: string): NewsItem[] => {
  const sentiments: NewsItem["sentiment"][] = ["positive", "neutral", "negative"];
  return Array.from({ length: 6 }, (_, index) => {
    const sources = ["Polymarket", "Kalshi", "Forecast Desk"];
    return {
      id: `${query}-${index}`,
      title: `Insight ${index + 1}: ${query} market update`,
      source: sources[index % sources.length],
      sentiment: sentiments[index % sentiments.length],
      publishedAt: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
      url: "https://example.com/market-news",
    };
  });
};

class MarketSocketManager {
  private subscriptions = new Map<string, Set<(data: MarketPoint) => void>>();
  private intervals = new Map<string, number>();
  private latestPoints = new Map<string, MarketPoint>();

  subscribeToMarket(marketId: string, handler: (data: MarketPoint) => void) {
    const handlers = this.subscriptions.get(marketId) ?? new Set();
    handlers.add(handler);
    this.subscriptions.set(marketId, handlers);

    if (!this.intervals.has(marketId)) {
      const intervalId = window.setInterval(() => {
        const last = this.latestPoints.get(marketId) ?? buildMockPoints(marketId).at(-1);
        if (!last) return;
        const next: MarketPoint = {
          timestamp: new Date().toISOString(),
          price: Math.min(0.95, Math.max(0.05, last.price + randomBetween(-0.02, 0.02))),
          volume: Math.max(100, Math.floor(last.volume + randomBetween(-300, 600))),
        };
        this.latestPoints.set(marketId, next);
        this.subscriptions.get(marketId)?.forEach((listener) => listener(next));
      }, 2000);
      this.intervals.set(marketId, intervalId);
    }

    return () => {
      const current = this.subscriptions.get(marketId);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.subscriptions.delete(marketId);
        const intervalId = this.intervals.get(marketId);
        if (intervalId) {
          window.clearInterval(intervalId);
          this.intervals.delete(marketId);
        }
      }
    };
  }

  unsubscribeFromMarket(marketId: string) {
    this.subscriptions.delete(marketId);
    const intervalId = this.intervals.get(marketId);
    if (intervalId) {
      window.clearInterval(intervalId);
      this.intervals.delete(marketId);
    }
  }
}

const marketSocketManager = new MarketSocketManager();

export const backendInterface = {
  // REST Interface
  fetchMarketData: async (id: string): Promise<MarketDataResponse> => {
    const marketId = id || MOCK_MARKETS[Math.floor(Math.random() * MOCK_MARKETS.length)] || "demo-market";
    return {
      marketId,
      points: buildMockPoints(marketId),
    };
  },

  fetchNews: async (query: string): Promise<NewsResponse> => {
    const safeQuery = query || "prediction markets";
    return {
      query: safeQuery,
      items: buildMockNews(safeQuery),
    };
  },

  // WebSocket Interface
  socket: {
    subscribeToMarket: (id: string, handler: (data: MarketPoint) => void) =>
      marketSocketManager.subscribeToMarket(id, handler),
    unsubscribeFromMarket: (id: string) => marketSocketManager.unsubscribeFromMarket(id),
  },
};

export type { MarketDataResponse, NewsItem, NewsResponse, MarketPoint };
