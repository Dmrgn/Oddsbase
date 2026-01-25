/**
 * Mock Backend Interface for Testing
 */

import { vi } from 'vitest';
import type {
    Market,
    OrderBook,
    MarketDataResponse,
    MarketPoint
} from '@/backendInterface';

export const mockMarket: Market = {
    market_id: 'test-market-123',
    title: 'Will Test Pass?',
    description: 'A test market for unit testing',
    category: 'Testing',
    ticker: 'TEST',
    source: 'polymarket',
    source_id: 'test-123',
    outcomes: [
        { outcome_id: 'yes-123', name: 'Yes', price: 0.65 },
        { outcome_id: 'no-123', name: 'No', price: 0.35 },
    ],
    status: 'active',
    image_url: null,
    volume_24h: 10000,
    liquidity: 50000,
};

export const mockOrderBook: OrderBook = {
    market_id: 'test-market-123',
    outcome_id: 'yes-123',
    ts: Date.now() / 1000,
    bids: [
        { p: 0.64, s: 100 },
        { p: 0.63, s: 200 },
        { p: 0.62, s: 150 },
    ],
    asks: [
        { p: 0.66, s: 100 },
        { p: 0.67, s: 200 },
        { p: 0.68, s: 150 },
    ],
};

export const mockMarketPoints: MarketPoint[] = [
    { timestamp: '2024-01-15T10:00:00Z', price: 0.60, bid: 0.59, ask: 0.61, volume: 100 },
    { timestamp: '2024-01-15T11:00:00Z', price: 0.62, bid: 0.61, ask: 0.63, volume: 150 },
    { timestamp: '2024-01-15T12:00:00Z', price: 0.65, bid: 0.64, ask: 0.66, volume: 200 },
];

export const mockMarketData: MarketDataResponse = {
    marketId: 'test-market-123',
    outcomeId: 'yes-123',
    points: mockMarketPoints,
};

export const createMockBackendInterface = () => ({
    fetchMarkets: vi.fn().mockResolvedValue({ markets: [mockMarket], facets: {}, total: 1 }),
    searchMarkets: vi.fn().mockResolvedValue({ markets: [mockMarket], facets: {}, total: 1 }),
    searchEvents: vi.fn().mockResolvedValue({ events: [], markets: [mockMarket], total: 1 }),
    fetchSentiment: vi.fn().mockResolvedValue({ score: 0.7, signal: 'bullish', summary: 'Positive sentiment' }),
    fetchMarket: vi.fn().mockResolvedValue(mockMarket),
    fetchRelatedMarket: vi.fn().mockResolvedValue(mockMarket),
    fetchCrossMarketComparison: vi.fn().mockResolvedValue({ source_market: mockMarket, similar_market: null, similarity_score: 0, method: 'text' }),
    fetchOrderbook: vi.fn().mockResolvedValue(mockOrderBook),
    fetchMarketData: vi.fn().mockResolvedValue(mockMarketData),
    fetchMarketDataWithRange: vi.fn().mockResolvedValue(mockMarketData),
    fetchAllOutcomesHistory: vi.fn().mockResolvedValue({ market: mockMarket, outcomes: {}, history: {} }),
    fetchNews: vi.fn().mockResolvedValue([]),
    streamNews: vi.fn().mockReturnValue(() => undefined),
    socket: {
        subscribeToMarket: vi.fn().mockReturnValue(() => undefined),
        subscribeToOrderBook: vi.fn().mockReturnValue(() => undefined),
        unsubscribeFromMarket: vi.fn(),
        createAgentSocket: vi.fn(),
        startAgent: vi.fn().mockReturnValue(() => undefined),
        sendObservation: vi.fn(),
    },
});

export const mockBackendInterface = createMockBackendInterface();
