import axios from 'axios';
import { MarketEvent } from '@/types/canvas';
import { prisma } from '@/lib/prisma';

const SECTORS_BASE_URL = 'https://api.sectors.app/v1';

// Mock IDX market dataset for demo / offline mode
const MOCK_MARKET_DATA: Record<string, Partial<MarketEvent>> = {
  BBCA: { price: 10450, prevPrice: 10000, price_change: 4.5, volume: 14500000, avg_volume: 10000000, rank: 1 },
  BBRI: { price: 5200, prevPrice: 5100, price_change: 1.96, volume: 22000000, avg_volume: 18000000, rank: 2 },
  BMRI: { price: 6800, prevPrice: 6500, price_change: 4.62, volume: 18000000, avg_volume: 12000000, rank: 3 },
  TLKM: { price: 3100, prevPrice: 3150, price_change: -1.58, volume: 8500000, avg_volume: 9500000, rank: 4 },
  ASII: { price: 5050, prevPrice: 4950, price_change: 2.02, volume: 6200000, avg_volume: 5800000, rank: 5 },
};

/**
 * Fetches market data for a symbol (Live Sectors API or Mock fallback)
 */
export async function getMarketDataForSymbol(symbol: string): Promise<MarketEvent> {
  const apiKey = process.env.SECTORS_API_KEY;
  const upperSymbol = symbol.toUpperCase();

  if (apiKey) {
    try {
      const res = await axios.get(`${SECTORS_BASE_URL}/company/report/${upperSymbol}/`, {
        headers: { 'X-API-KEY': apiKey },
        timeout: 5000,
      });

      const data = res.data;
      const price = data.price || data.close || 10000;
      const prevPrice = data.prev_price || price;
      const priceChange = prevPrice !== 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;

      return {
        symbol: upperSymbol,
        price,
        prevPrice,
        price_change: parseFloat(priceChange.toFixed(2)),
        volume: data.volume || 1000000,
        avg_volume: data.avg_volume || 1000000,
        rank: data.rank || 1,
        timestamp: new Date().toLocaleTimeString(),
      };
    } catch (err) {
      console.warn(`Sectors API fetch failed for ${upperSymbol}, falling back to mock data:`, err);
    }
  }

  // Fallback to mock data with a small randomized jitter
  const base = MOCK_MARKET_DATA[upperSymbol] || {
    price: 5000,
    prevPrice: 4900,
    price_change: 2.04,
    volume: 5000000,
    avg_volume: 5000000,
    rank: 10,
  };

  const jitter = (Math.random() - 0.5) * 0.4;
  const currentPriceChange = parseFloat(((base.price_change || 0) + jitter).toFixed(2));

  return {
    symbol: upperSymbol,
    price: base.price || 5000,
    prevPrice: base.prevPrice || 4900,
    price_change: currentPriceChange,
    volume: base.volume || 5000000,
    avg_volume: base.avg_volume || 5000000,
    rank: base.rank || 1,
    timestamp: new Date().toLocaleTimeString(),
  };
}

/**
 * Updates snapshot in DB and returns MarketEvent deltas
 */
export async function syncMarketSnapshots(symbols: string[]): Promise<MarketEvent[]> {
  const events: MarketEvent[] = [];

  for (const sym of symbols) {
    const event = await getMarketDataForSymbol(sym);
    await prisma.marketSnapshot.upsert({
      where: { symbol: event.symbol },
      create: {
        symbol: event.symbol,
        price: event.price,
        prevPrice: event.prevPrice,
        priceChange: event.price_change,
        volume: event.volume,
        avgVolume: event.avg_volume,
        rank: event.rank,
      },
      update: {
        price: event.price,
        prevPrice: event.prevPrice,
        priceChange: event.price_change,
        volume: event.volume,
        avgVolume: event.avg_volume,
        rank: event.rank,
      },
    });
    events.push(event);
  }

  return events;
}
