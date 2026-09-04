import axios from 'axios';
import { MarketEvent } from '@/types/canvas';
import { prisma } from '@/lib/prisma';

const SECTORS_V2_BASE_URL = 'https://api.sectors.app/v2';

// Mock IDX market dataset for demo / offline mode
const MOCK_MARKET_DATA: Record<string, Partial<MarketEvent>> = {
  BBCA: { price: 10450, prevPrice: 10000, price_change: 4.5, volume: 14500000, avg_volume: 10000000, rank: 1 },
  BBRI: { price: 5200, prevPrice: 5100, price_change: 1.96, volume: 22000000, avg_volume: 18000000, rank: 2 },
  BMRI: { price: 6800, prevPrice: 6500, price_change: 4.62, volume: 18000000, avg_volume: 12000000, rank: 3 },
  TLKM: { price: 3100, prevPrice: 3150, price_change: -1.58, volume: 8500000, avg_volume: 9500000, rank: 4 },
  ASII: { price: 5050, prevPrice: 4950, price_change: 2.02, volume: 6200000, avg_volume: 5800000, rank: 5 },
  BBNI: { price: 5500, prevPrice: 5400, price_change: 1.85, volume: 9500000, avg_volume: 8500000, rank: 6 },
  UNTR: { price: 27100, prevPrice: 26800, price_change: 1.12, volume: 3200000, avg_volume: 3000000, rank: 7 },
  ICBP: { price: 11800, prevPrice: 11900, price_change: -0.84, volume: 4100000, avg_volume: 4500000, rank: 8 },
};

/**
 * Fetches market data for a symbol (Live Sectors API v2 or Mock fallback)
 */
export async function getMarketDataForSymbol(
  symbol: string,
  sessionApiKey?: string
): Promise<{ event: MarketEvent; isLive: boolean }> {
  const apiKey = sessionApiKey || process.env.SECTORS_API_KEY;
  const upperSymbol = symbol.toUpperCase().replace('.JK', '');

  if (apiKey && apiKey.trim().length > 0) {
    try {
      // 1. Try fetching daily OHLCV from Sectors v2
      const res = await axios.get(`${SECTORS_V2_BASE_URL}/daily/${upperSymbol}/`, {
        headers: {
          Authorization: apiKey.trim(),
        },
        timeout: 6000,
      });

      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        const latest = data[0];
        const prev = data.length > 1 ? data[1] : latest;

        const price = latest.close ?? latest.price ?? 10000;
        const prevPrice = prev.close ?? latest.open ?? price;
        const priceChange =
          prevPrice !== 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;

        return {
          event: {
            symbol: upperSymbol,
            price,
            prevPrice,
            price_change: parseFloat(priceChange.toFixed(2)),
            volume: latest.volume ?? 1000000,
            avg_volume: 10000000,
            rank: 1,
            timestamp: new Date().toLocaleTimeString(),
          },
          isLive: true,
        };
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Direct object payload
        const price = data.close ?? data.price ?? data.last_close_price ?? 10000;
        const prevPrice = data.prev_price ?? data.prevPrice ?? price;
        const priceChange =
          data.price_change ??
          (prevPrice !== 0 ? ((price - prevPrice) / prevPrice) * 100 : 0);

        return {
          event: {
            symbol: upperSymbol,
            price,
            prevPrice,
            price_change: parseFloat(Number(priceChange).toFixed(2)),
            volume: data.volume ?? 1000000,
            avg_volume: data.avg_volume ?? 10000000,
            rank: data.market_cap_rank ?? data.rank ?? 1,
            timestamp: new Date().toLocaleTimeString(),
          },
          isLive: true,
        };
      }
    } catch (err: any) {
      console.warn(
        `Sectors API v2 fetch failed for ${upperSymbol} (${err.response?.status || err.message}), falling back to simulated mock:`
      );
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
  const currentPriceChange = parseFloat(
    ((base.price_change || 0) + jitter).toFixed(2)
  );

  return {
    event: {
      symbol: upperSymbol,
      price: base.price || 5000,
      prevPrice: base.prevPrice || 4900,
      price_change: currentPriceChange,
      volume: base.volume || 5000000,
      avg_volume: base.avg_volume || 5000000,
      rank: base.rank || 1,
      timestamp: new Date().toLocaleTimeString(),
    },
    isLive: false,
  };
}

/**
 * Updates snapshot in DB and returns MarketEvent deltas
 */
export async function syncMarketSnapshots(
  symbols: string[],
  sessionApiKey?: string
): Promise<{ events: MarketEvent[]; isLive: boolean }> {
  const events: MarketEvent[] = [];
  let allLive = true;

  for (const sym of symbols) {
    const { event, isLive } = await getMarketDataForSymbol(sym, sessionApiKey);
    if (!isLive) allLive = false;

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

  return { events, isLive: allLive };
}
