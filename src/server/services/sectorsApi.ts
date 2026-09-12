import axios from 'axios';
import { MarketEvent, ScreenerCompanyResult } from '@/types/canvas';
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

export interface TopMoversResult {
  gainers: MarketEvent[];
  losers: MarketEvent[];
  isLive: boolean;
}

const MOCK_TOP_GAINERS: MarketEvent[] = [
  {
    symbol: 'JECX',
    name: 'PT Nitrasanata Dharma Tbk',
    price: 1950,
    prevPrice: 1560,
    price_change: 25.0,
    volume: 38500000,
    avg_volume: 12000000,
    rank: 1,
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    symbol: 'AGII',
    name: 'PT Samator Indo Gas Tbk',
    price: 3080,
    prevPrice: 2500,
    price_change: 23.2,
    volume: 48000000,
    avg_volume: 20000000,
    rank: 2,
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    symbol: 'MPRO',
    name: 'PT Maha Properti Indonesia Tbk',
    price: 9800,
    prevPrice: 8000,
    price_change: 22.5,
    volume: 29000000,
    avg_volume: 15000000,
    rank: 3,
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    symbol: 'BREN',
    name: 'PT Barito Renewables Tbk',
    price: 9800,
    prevPrice: 8950,
    price_change: 9.5,
    volume: 52000000,
    avg_volume: 25000000,
    rank: 4,
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    symbol: 'CUAN',
    name: 'PT Petrindo Jaya Kreasi Tbk',
    price: 8450,
    prevPrice: 7850,
    price_change: 7.64,
    volume: 34500000,
    avg_volume: 18000000,
    rank: 5,
    timestamp: new Date().toLocaleTimeString(),
  },
];

const MOCK_TOP_LOSERS: MarketEvent[] = [
  {
    symbol: 'BKSL',
    name: 'Sentul City Tbk',
    price: 61,
    prevPrice: 67,
    price_change: -8.96,
    volume: 310000000,
    avg_volume: 180000000,
    rank: 1,
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    symbol: 'ELPI',
    name: 'PT Pelayaran Nasional Ekalya Tbk',
    price: 1040,
    prevPrice: 1245,
    price_change: -16.47,
    volume: 45000000,
    avg_volume: 22000000,
    rank: 2,
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    symbol: 'EMAS',
    name: 'PT Merdeka Gold Resources Tbk',
    price: 5550,
    prevPrice: 6825,
    price_change: -18.68,
    volume: 28000000,
    avg_volume: 14000000,
    rank: 3,
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    symbol: 'PSAB',
    name: 'J Resources Asia Pasifik Tbk',
    price: 404,
    prevPrice: 540,
    price_change: -25.19,
    volume: 85000000,
    avg_volume: 40000000,
    rank: 4,
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    symbol: 'GOTO',
    name: 'PT GoTo Gojek Tokopedia Tbk',
    price: 52,
    prevPrice: 56,
    price_change: -7.14,
    volume: 420000000,
    avg_volume: 300000000,
    rank: 5,
    timestamp: new Date().toLocaleTimeString(),
  },
];

/**
 * Fetches top market movers / gainers / losers from Sectors API v2 (/v2/companies/top-changes/)
 */
export async function getTopMarketMovers(
  sessionApiKey?: string,
  options?: {
    classifications?: string;
    periods?: string;
    nStock?: number;
    minMcapBillion?: number;
  }
): Promise<TopMoversResult> {
  const apiKey = sessionApiKey || process.env.SECTORS_API_KEY;
  const targetPeriod = options?.periods || '1d';
  const targetStockCount = options?.nStock || 5;

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const params: Record<string, any> = {
        periods: targetPeriod,
        n_stock: targetStockCount,
        classifications: options?.classifications || 'all',
      };

      if (options?.minMcapBillion !== undefined && options.minMcapBillion > 0) {
        params.min_mcap_billion = options.minMcapBillion;
      }

      const res = await axios.get(`${SECTORS_V2_BASE_URL}/companies/top-changes/`, {
        headers: {
          Authorization: apiKey.trim(),
        },
        params,
        timeout: 7000,
      });

      const data = res.data;
      if (data) {
        // Helper to extract an array of stock items from various Sectors API response formats
        const extractList = (raw: any, period: string): any[] => {
          if (!raw) return [];
          if (Array.isArray(raw)) return raw;
          if (typeof raw === 'object') {
            // If requested a specific period and it's present as a key (e.g. raw['1d'])
            if (raw[period] && Array.isArray(raw[period])) {
              return raw[period];
            }
            // If periods=all, check standard periods in priority order or flatten
            if (period === 'all') {
              const flattened: any[] = [];
              const seen = new Set<string>();
              for (const pKey of ['1d', '7d', '14d', '30d', '365d']) {
                if (Array.isArray(raw[pKey])) {
                  for (const item of raw[pKey]) {
                    const sym = (item.symbol || item.ticker || '').toUpperCase();
                    if (sym && !seen.has(sym)) {
                      seen.add(sym);
                      flattened.push({ ...item, period: pKey });
                    }
                  }
                }
              }
              if (flattened.length > 0) return flattened;
            }
            // Fallback: search for first non-empty array inside object
            for (const [key, val] of Object.entries(raw)) {
              if (Array.isArray(val) && val.length > 0) {
                return (val as any[]).map((v) => ({ ...v, period: key }));
              }
            }
          }
          return [];
        };

        const rawGainers = extractList(data.top_gainers || data.gainers, targetPeriod);
        const rawLosers = extractList(data.top_losers || data.losers, targetPeriod);

        const mapMover = (item: any, rankIdx: number): MarketEvent => {
          const sym = (item.symbol || item.ticker || 'BBCA').toUpperCase().replace('.JK', '');
          const name = item.name || item.company_name || sym;
          const price = item.last_close_price || item.price || item.close || item.last_price || 1000;
          let rawChange = item.price_change !== undefined ? Number(item.price_change) : item.change || 0;

          // Convert fractional ratio (e.g. 0.25 -> 25.0%, -0.0895 -> -8.96%)
          if (Math.abs(rawChange) < 1.0 && rawChange !== 0) {
            rawChange = rawChange * 100;
          }

          const change = parseFloat(rawChange.toFixed(2));
          const prevPrice = item.prev_price || (change !== 0 ? price / (1 + change / 100) : price);

          return {
            symbol: sym,
            name: name,
            price: Math.round(price),
            prevPrice: Math.round(prevPrice),
            price_change: change,
            volume: item.volume || 15000000,
            avg_volume: item.avg_volume || 10000000,
            rank: typeof item.rank === 'number' ? item.rank : rankIdx + 1,
            period: item.period || targetPeriod,
            timestamp: new Date().toLocaleTimeString(),
          };
        };

        const gainers = rawGainers.slice(0, targetStockCount).map((g: any, i: number) => mapMover(g, i));
        const losers = rawLosers.slice(0, targetStockCount).map((l: any, i: number) => mapMover(l, i));

        if (gainers.length > 0 || losers.length > 0) {
          return {
            gainers: gainers.length > 0 ? gainers : MOCK_TOP_GAINERS.slice(0, targetStockCount),
            losers: losers.length > 0 ? losers : MOCK_TOP_LOSERS.slice(0, targetStockCount),
            isLive: true,
          };
        }
      }
    } catch (err: any) {
      console.warn(
        `Sectors API v2 /companies/top-changes/ failed (${err.response?.status || err.message}), fallback to mock:`
      );
    }
  }

  return {
    gainers: MOCK_TOP_GAINERS.slice(0, targetStockCount),
    losers: MOCK_TOP_LOSERS.slice(0, targetStockCount),
    isLive: false,
  };
}

export interface CompanyFundamentalReport {
  symbol: string;
  companyName: string;
  sector: string;
  subSector: string;
  industry?: string;
  subIndustry?: string;
  listingBoard?: string;
  listingDate?: string;
  marketCap: number; // in IDR
  marketCapFormatted: string;
  marketCapRank?: number;
  employeeNum?: number;
  lastClosePrice?: number;
  dailyCloseChange?: number;
  esgScore?: number;
  tags?: string[];
  indices?: string[];
  affiliates?: string[];
  allTimePrice?: {
    ytdLow?: number;
    ytdHigh?: number;
    week52Low?: number;
    week52High?: number;
    allTimeLow?: number;
    allTimeHigh?: number;
  };
  valuation?: {
    peRatio: number;
    pbvRatio: number;
    forwardPe?: number;
    intrinsicValue?: number;
    historicalValuation?: any[];
  };
  futureForecasts?: {
    analystRating?: {
      buy: number;
      hold: number;
      sell: number;
      strongBuy: number;
      strongSell: number;
      totalAnalysts: number;
    };
    epsEstimate?: number;
    epsGrowth?: number;
    revenueEstimate?: number;
    revenueGrowth?: number;
  };
  financialsSummary?: {
    eps: number;
    roa?: number;
    roe?: number;
    netProfitMargin?: number;
    operatingProfitMargin?: number;
    debtToEquity?: number;
    totalAssets?: number;
    totalEquity?: number;
    totalRevenue?: number;
  };
  dividendSummary?: {
    yieldTtm: number;
    dividendTtm?: number;
    payoutRatio?: number;
    lastExDividendDate?: string;
  };
  management?: {
    keyExecutives?: Array<{ name: string; position: string }>;
  };
  ownership?: {
    majorShareholders?: Array<{ name: string; sharePercentage: string | number; shareValue?: number }>;
    whaleInvestors?: string[];
    conglomeratesGroup?: string[];
  };
  peers?: any[];
  peRatio: number;
  pbvRatio: number;
  dividendYield: number;
  revenueGrowthYoY?: number;
  netProfitMargin?: number;
  isLive: boolean;
  rawData?: any;
}

const MOCK_FUNDAMENTAL_DATA: Record<string, Partial<CompanyFundamentalReport>> = {
  BBCA: {
    symbol: 'BBCA',
    companyName: 'PT Bank Central Asia Tbk.',
    sector: 'Financials',
    subSector: 'Banks',
    industry: 'Banks',
    subIndustry: 'Banks',
    listingBoard: 'Main',
    listingDate: '2000-05-31',
    marketCap: 1245000000000000,
    marketCapFormatted: 'Rp 1,245.0 T',
    marketCapRank: 1,
    employeeNum: 27937,
    lastClosePrice: 10450,
    dailyCloseChange: 0.045,
    esgScore: 21.44,
    tags: ['dividend-yield-ttm-above-5-percent', 'top-90d-transaction-value', 'top-90d-transaction-volume', 'blue-chip'],
    indices: ['LQ45', 'IDX30', 'KOMPAS100', 'SRIKEHATI', 'FTSE'],
    affiliates: ['Djarum Group', 'Hartono Family'],
    allTimePrice: {
      ytdLow: 9100,
      ytdHigh: 10950,
      week52Low: 8850,
      week52High: 10950,
      allTimeLow: 175,
      allTimeHigh: 10950,
    },
    valuation: {
      peRatio: 22.4,
      pbvRatio: 4.65,
      forwardPe: 18.2,
      intrinsicValue: 12500,
    },
    futureForecasts: {
      analystRating: {
        buy: 4,
        hold: 2,
        sell: 0,
        strongBuy: 21,
        strongSell: 0,
        totalAnalysts: 27,
      },
      epsEstimate: 518.5,
      epsGrowth: 0.0998,
      revenueEstimate: 126170000000000,
      revenueGrowth: 0.1265,
    },
    financialsSummary: {
      eps: 471.45,
      roa: 0.0313,
      roe: 0.1704,
      netProfitMargin: 46.8,
      operatingProfitMargin: 51.58,
      debtToEquity: 4.43,
      totalAssets: 1586830000000000,
      totalEquity: 281687555000000,
      totalRevenue: 112006326000000,
    },
    dividendSummary: {
      yieldTtm: 2.85,
      dividendTtm: 356,
      payoutRatio: 0.7486,
      lastExDividendDate: '2026-06-17',
    },
    management: {
      keyExecutives: [
        { name: 'Jahja Setiaatmadja', position: 'President Director' },
        { name: 'Armand Wahyudi Hartono', position: 'Vice President Director' },
        { name: 'Gregory Hendra Lembong', position: 'Director' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'PT Dwimuria Investama Andalan', sharePercentage: '54.94%', shareValue: 684128000000000 },
        { name: 'Public / Free Float', sharePercentage: '45.06%', shareValue: 560872000000000 },
      ],
      whaleInvestors: ['Anthoni Salim', 'Hartono Brothers'],
      conglomeratesGroup: ['Djarum Group'],
    },
    peRatio: 22.4,
    pbvRatio: 4.65,
    dividendYield: 2.85,
    revenueGrowthYoY: 14.2,
    netProfitMargin: 46.8,
  },
  BBRI: {
    symbol: 'BBRI',
    companyName: 'PT Bank Rakyat Indonesia (Persero) Tbk.',
    sector: 'Financials',
    subSector: 'Banks',
    industry: 'Banks',
    subIndustry: 'Banks',
    listingBoard: 'Main',
    listingDate: '2003-11-10',
    marketCap: 785000000000000,
    marketCapFormatted: 'Rp 785.0 T',
    marketCapRank: 2,
    employeeNum: 62000,
    lastClosePrice: 5200,
    dailyCloseChange: 0.0196,
    esgScore: 19.8,
    tags: ['dividend-yield-ttm-above-5-percent', 'soeas-state-owned', 'top-90d-transaction-value'],
    indices: ['LQ45', 'IDX30', 'KOMPAS100', 'IDXHIDIV20'],
    affiliates: ['Ministry of SOE Republic of Indonesia'],
    allTimePrice: {
      ytdLow: 4350,
      ytdHigh: 6350,
      week52Low: 4350,
      week52High: 6350,
      allTimeLow: 120,
      allTimeHigh: 6350,
    },
    valuation: {
      peRatio: 12.8,
      pbvRatio: 2.15,
      forwardPe: 10.9,
      intrinsicValue: 6500,
    },
    futureForecasts: {
      analystRating: {
        buy: 6,
        hold: 3,
        sell: 0,
        strongBuy: 19,
        strongSell: 0,
        totalAnalysts: 28,
      },
      epsEstimate: 450.0,
      epsGrowth: 0.115,
      revenueEstimate: 195000000000000,
      revenueGrowth: 0.112,
    },
    financialsSummary: {
      eps: 401.2,
      roa: 0.0305,
      roe: 0.185,
      netProfitMargin: 38.2,
      operatingProfitMargin: 44.5,
      debtToEquity: 5.2,
      totalAssets: 1965000000000000,
      totalEquity: 312000000000000,
      totalRevenue: 181000000000000,
    },
    dividendSummary: {
      yieldTtm: 6.45,
      dividendTtm: 335,
      payoutRatio: 0.82,
      lastExDividendDate: '2026-03-24',
    },
    management: {
      keyExecutives: [
        { name: 'Sunarso', position: 'President Director' },
        { name: 'Catur Budi Harto', position: 'Vice President Director' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'Government of Republic of Indonesia (SOE)', sharePercentage: '53.19%' },
        { name: 'Public Shareholders', sharePercentage: '46.81%' },
      ],
      whaleInvestors: ['Government Pension Funds', 'Foreign Institutional Assets'],
      conglomeratesGroup: ['State-Owned Enterprise'],
    },
    peRatio: 12.8,
    pbvRatio: 2.15,
    dividendYield: 6.45,
    revenueGrowthYoY: 11.5,
    netProfitMargin: 38.2,
  },
  TLKM: {
    symbol: 'TLKM',
    companyName: 'PT Telkom Indonesia (Persero) Tbk.',
    sector: 'Infrastructure',
    subSector: 'Telecommunication Services',
    industry: 'Telecommunication Services',
    subIndustry: 'Wireless Telecommunication Services',
    listingBoard: 'Main',
    listingDate: '1995-11-14',
    marketCap: 308000000000000,
    marketCapFormatted: 'Rp 308.0 T',
    marketCapRank: 4,
    employeeNum: 25000,
    lastClosePrice: 3100,
    dailyCloseChange: -0.0158,
    esgScore: 24.1,
    tags: ['dividend-yield-ttm-above-5-percent', 'top-90d-transaction-value'],
    indices: ['LQ45', 'IDX30', 'KOMPAS100', 'IDXHIDIV20'],
    affiliates: ['Ministry of SOE Republic of Indonesia'],
    allTimePrice: {
      ytdLow: 2650,
      ytdHigh: 4050,
      week52Low: 2650,
      week52High: 4050,
      allTimeLow: 350,
      allTimeHigh: 4800,
    },
    valuation: {
      peRatio: 14.5,
      pbvRatio: 2.30,
      forwardPe: 12.4,
      intrinsicValue: 3900,
    },
    futureForecasts: {
      analystRating: {
        buy: 8,
        hold: 4,
        sell: 1,
        strongBuy: 14,
        strongSell: 0,
        totalAnalysts: 27,
      },
      epsEstimate: 265.0,
      epsGrowth: 0.052,
      revenueEstimate: 158000000000000,
      revenueGrowth: 0.045,
    },
    financialsSummary: {
      eps: 248.5,
      roa: 0.085,
      roe: 0.165,
      netProfitMargin: 18.2,
      operatingProfitMargin: 26.5,
      debtToEquity: 1.15,
      totalAssets: 287000000000000,
      totalEquity: 149000000000000,
      totalRevenue: 149200000000000,
    },
    dividendSummary: {
      yieldTtm: 5.25,
      dividendTtm: 162,
      payoutRatio: 0.72,
      lastExDividendDate: '2026-05-15',
    },
    management: {
      keyExecutives: [
        { name: 'Ririek Adriansyah', position: 'President Director' },
        { name: 'Heri Supriadi', position: 'Finance & Risk Director' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'Government of Republic of Indonesia', sharePercentage: '52.09%' },
        { name: 'Public Shareholders', sharePercentage: '47.91%' },
      ],
      whaleInvestors: ['BlackRock', 'Vanguard', 'BPJS Ketenagakerjaan'],
      conglomeratesGroup: ['State-Owned Enterprise'],
    },
    peRatio: 14.5,
    pbvRatio: 2.30,
    dividendYield: 5.25,
    revenueGrowthYoY: 3.8,
    netProfitMargin: 18.2,
  },
  MPRO: {
    symbol: 'MPRO',
    companyName: 'PT Maha Properti Indonesia Tbk.',
    sector: 'Real Estate',
    subSector: 'Property Development',
    industry: 'Real Estate Development & Management',
    subIndustry: 'Residential & Commercial Properties',
    listingBoard: 'Development',
    listingDate: '2018-10-09',
    marketCap: 9700000000000,
    marketCapFormatted: 'Rp 9.7 T',
    marketCapRank: 84,
    employeeNum: 310,
    lastClosePrice: 9800,
    dailyCloseChange: 0.225,
    esgScore: 28.5,
    tags: ['top-gainers', 'property-developer', 'high-volatility'],
    indices: ['KOMPAS100', 'IDXPROPERT'],
    affiliates: ['Mayapada Group', 'Tahir Family'],
    allTimePrice: {
      ytdLow: 3800,
      ytdHigh: 9950,
      week52Low: 3500,
      week52High: 9950,
      allTimeLow: 850,
      allTimeHigh: 9950,
    },
    valuation: {
      peRatio: 34.2,
      pbvRatio: 3.15,
      forwardPe: 28.0,
      intrinsicValue: 8200,
    },
    futureForecasts: {
      analystRating: {
        buy: 3,
        hold: 2,
        sell: 0,
        strongBuy: 5,
        strongSell: 0,
        totalAnalysts: 10,
      },
      epsEstimate: 286.5,
      epsGrowth: 0.185,
      revenueEstimate: 1450000000000,
      revenueGrowth: 0.224,
    },
    financialsSummary: {
      eps: 242.0,
      roa: 0.062,
      roe: 0.114,
      netProfitMargin: 18.5,
      operatingProfitMargin: 24.2,
      debtToEquity: 0.85,
      totalAssets: 12500000000000,
      totalEquity: 6800000000000,
      totalRevenue: 1180000000000,
    },
    dividendSummary: {
      yieldTtm: 1.2,
      dividendTtm: 118,
      payoutRatio: 0.35,
      lastExDividendDate: '2026-07-12',
    },
    management: {
      keyExecutives: [
        { name: 'William Tandiono', position: 'President Director' },
        { name: 'Harry Sanusi', position: 'Director' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'PT Mayapada Karunia', sharePercentage: '48.2%' },
        { name: 'Public Shareholders', sharePercentage: '51.8%' },
      ],
      whaleInvestors: ['Mayapada Healthcare Group'],
      conglomeratesGroup: ['Mayapada Group'],
    },
    peRatio: 34.2,
    pbvRatio: 3.15,
    dividendYield: 1.2,
    revenueGrowthYoY: 22.4,
    netProfitMargin: 18.5,
  },
  JECX: {
    symbol: 'JECX',
    companyName: 'PT Nitrasanata Dharma Tbk.',
    sector: 'Healthcare',
    subSector: 'Healthcare Providers',
    industry: 'Eye Hospitals & Clinics',
    subIndustry: 'Specialized Medical Services',
    listingBoard: 'Main',
    listingDate: '2021-04-15',
    marketCap: 3200000000000,
    marketCapFormatted: 'Rp 3.2 T',
    marketCapRank: 142,
    employeeNum: 850,
    lastClosePrice: 1950,
    dailyCloseChange: 0.25,
    esgScore: 21.0,
    tags: ['healthcare', 'top-gainers', 'growth-stock'],
    indices: ['IDXHEALTH', 'KOMPAS100'],
    affiliates: ['JEC Eye Hospitals'],
    allTimePrice: {
      ytdLow: 1200,
      ytdHigh: 2100,
      week52Low: 1150,
      week52High: 2100,
      allTimeLow: 890,
      allTimeHigh: 2100,
    },
    valuation: {
      peRatio: 28.5,
      pbvRatio: 2.90,
      forwardPe: 22.4,
      intrinsicValue: 1800,
    },
    futureForecasts: {
      analystRating: {
        buy: 5,
        hold: 1,
        sell: 0,
        strongBuy: 6,
        strongSell: 0,
        totalAnalysts: 12,
      },
      epsEstimate: 68.4,
      epsGrowth: 0.24,
      revenueEstimate: 780000000000,
      revenueGrowth: 0.26,
    },
    financialsSummary: {
      eps: 55.2,
      roa: 0.082,
      roe: 0.165,
      netProfitMargin: 14.2,
      operatingProfitMargin: 18.5,
      debtToEquity: 0.45,
      totalAssets: 4100000000000,
      totalEquity: 2800000000000,
      totalRevenue: 620000000000,
    },
    dividendSummary: {
      yieldTtm: 1.85,
      dividendTtm: 36,
      payoutRatio: 0.40,
      lastExDividendDate: '2026-05-28',
    },
    management: {
      keyExecutives: [
        { name: 'Dr. Johan Hutauruk', position: 'President Director' },
        { name: 'Dr. Tjahjono D. Gondhowiardjo', position: 'Vice President Director' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'PT JEC Medik Internasional', sharePercentage: '62.4%' },
        { name: 'Public Shareholders', sharePercentage: '37.6%' },
      ],
      whaleInvestors: ['Healthcare Venture Partners'],
      conglomeratesGroup: ['JEC Eye Hospitals Network'],
    },
    peRatio: 28.5,
    pbvRatio: 2.90,
    dividendYield: 1.85,
    revenueGrowthYoY: 26.0,
    netProfitMargin: 14.2,
  },
  AGII: {
    symbol: 'AGII',
    companyName: 'PT Samator Indo Gas Tbk.',
    sector: 'Basic Materials',
    subSector: 'Chemicals',
    industry: 'Industrial & Medical Gases',
    subIndustry: 'Gas Manufacturing & Distribution',
    listingBoard: 'Main',
    listingDate: '2016-09-28',
    marketCap: 9450000000000,
    marketCapFormatted: 'Rp 9.45 T',
    marketCapRank: 88,
    employeeNum: 2400,
    lastClosePrice: 3080,
    dailyCloseChange: 0.232,
    esgScore: 23.4,
    tags: ['industrial-gases', 'medical-oxygen', 'top-gainers'],
    indices: ['KOMPAS100', 'IDXBASIC'],
    affiliates: ['Samator Group', 'CVC Capital'],
    allTimePrice: {
      ytdLow: 1800,
      ytdHigh: 3200,
      week52Low: 1650,
      week52High: 3200,
      allTimeLow: 450,
      allTimeHigh: 3200,
    },
    valuation: {
      peRatio: 24.8,
      pbvRatio: 1.85,
      forwardPe: 19.5,
      intrinsicValue: 2750,
    },
    futureForecasts: {
      analystRating: {
        buy: 4,
        hold: 3,
        sell: 0,
        strongBuy: 7,
        strongSell: 0,
        totalAnalysts: 14,
      },
      epsEstimate: 124.0,
      epsGrowth: 0.16,
      revenueEstimate: 3600000000000,
      revenueGrowth: 0.18,
    },
    financialsSummary: {
      eps: 104.5,
      roa: 0.054,
      roe: 0.098,
      netProfitMargin: 8.7,
      operatingProfitMargin: 14.6,
      debtToEquity: 1.12,
      totalAssets: 11800000000000,
      totalEquity: 5100000000000,
      totalRevenue: 3050000000000,
    },
    dividendSummary: {
      yieldTtm: 1.45,
      dividendTtm: 44.6,
      payoutRatio: 0.30,
      lastExDividendDate: '2026-06-10',
    },
    management: {
      keyExecutives: [
        { name: 'Rachmat Harsono', position: 'President Director' },
        { name: 'Imelda M. Harsono', position: 'Director' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'PT Samator', sharePercentage: '40.54%' },
        { name: 'Matrix Company Ltd (CVC)', sharePercentage: '31.00%' },
        { name: 'Public Shareholders', sharePercentage: '28.46%' },
      ],
      whaleInvestors: ['CVC Capital Partners'],
      conglomeratesGroup: ['Samator Group'],
    },
    peRatio: 24.8,
    pbvRatio: 1.85,
    dividendYield: 1.45,
    revenueGrowthYoY: 18.0,
    netProfitMargin: 8.7,
  },
  BREN: {
    symbol: 'BREN',
    companyName: 'PT Barito Renewables Tbk.',
    sector: 'Utilities',
    subSector: 'Electric Utilities',
    industry: 'Renewable Energy & Geothermal',
    subIndustry: 'Clean Power Generation',
    listingBoard: 'Main',
    listingDate: '2023-10-09',
    marketCap: 1310000000000000,
    marketCapFormatted: 'Rp 1,310.0 T',
    marketCapRank: 1,
    employeeNum: 1450,
    lastClosePrice: 9800,
    dailyCloseChange: 0.095,
    esgScore: 16.5,
    tags: ['renewable-energy', 'geothermal', 'mega-cap', 'top-gainers'],
    indices: ['LQ45', 'IDX30', 'KOMPAS100', 'FTSE'],
    affiliates: ['Barito Pacific Group', 'Prajogo Pangestu'],
    allTimePrice: {
      ytdLow: 5200,
      ytdHigh: 11000,
      week52Low: 4900,
      week52High: 11000,
      allTimeLow: 975,
      allTimeHigh: 11000,
    },
    valuation: {
      peRatio: 142.5,
      pbvRatio: 88.2,
      forwardPe: 110.0,
      intrinsicValue: 6500,
    },
    futureForecasts: {
      analystRating: {
        buy: 6,
        hold: 4,
        sell: 1,
        strongBuy: 12,
        strongSell: 0,
        totalAnalysts: 23,
      },
      epsEstimate: 68.8,
      epsGrowth: 0.32,
      revenueEstimate: 12500000000000,
      revenueGrowth: 0.28,
    },
    financialsSummary: {
      eps: 48.5,
      roa: 0.084,
      roe: 0.245,
      netProfitMargin: 32.4,
      operatingProfitMargin: 48.6,
      debtToEquity: 1.85,
      totalAssets: 58000000000000,
      totalEquity: 14800000000000,
      totalRevenue: 9800000000000,
    },
    dividendSummary: {
      yieldTtm: 0.25,
      dividendTtm: 24.5,
      payoutRatio: 0.45,
      lastExDividendDate: '2026-06-05',
    },
    management: {
      keyExecutives: [
        { name: 'Hendra Soetjipto Tan', position: 'President Director' },
        { name: 'Merly', position: 'Director & Corporate Secretary' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'PT Barito Pacific Tbk', sharePercentage: '64.67%' },
        { name: 'Green Era Energy Pte Ltd', sharePercentage: '23.60%' },
        { name: 'Public Shareholders', sharePercentage: '11.73%' },
      ],
      whaleInvestors: ['Prajogo Pangestu', 'Green Era Energy'],
      conglomeratesGroup: ['Barito Pacific Group'],
    },
    peRatio: 142.5,
    pbvRatio: 88.2,
    dividendYield: 0.25,
    revenueGrowthYoY: 28.0,
    netProfitMargin: 32.4,
  },
  CUAN: {
    symbol: 'CUAN',
    companyName: 'PT Petrindo Jaya Kreasi Tbk.',
    sector: 'Energy',
    subSector: 'Oil, Gas & Coal',
    industry: 'Thermal & Metallurgical Coal',
    subIndustry: 'Mineral Resources Mining',
    listingBoard: 'Main',
    listingDate: '2023-03-08',
    marketCap: 95000000000000,
    marketCapFormatted: 'Rp 95.0 T',
    marketCapRank: 16,
    employeeNum: 1800,
    lastClosePrice: 8450,
    dailyCloseChange: 0.0764,
    esgScore: 31.2,
    tags: ['energy-resources', 'coal-mining', 'top-gainers'],
    indices: ['KOMPAS100', 'IDXENERGY', 'MSCI'],
    affiliates: ['Prajogo Pangestu Group'],
    allTimePrice: {
      ytdLow: 5100,
      ytdHigh: 9200,
      week52Low: 4800,
      week52High: 9200,
      allTimeLow: 220,
      allTimeHigh: 9200,
    },
    valuation: {
      peRatio: 58.4,
      pbvRatio: 16.8,
      forwardPe: 45.0,
      intrinsicValue: 5800,
    },
    futureForecasts: {
      analystRating: {
        buy: 5,
        hold: 3,
        sell: 1,
        strongBuy: 8,
        strongSell: 0,
        totalAnalysts: 17,
      },
      epsEstimate: 144.6,
      epsGrowth: 0.25,
      revenueEstimate: 8200000000000,
      revenueGrowth: 0.29,
    },
    financialsSummary: {
      eps: 115.8,
      roa: 0.124,
      roe: 0.288,
      netProfitMargin: 24.6,
      operatingProfitMargin: 34.2,
      debtToEquity: 0.78,
      totalAssets: 26000000000000,
      totalEquity: 5650000000000,
      totalRevenue: 6400000000000,
    },
    dividendSummary: {
      yieldTtm: 0.0,
      dividendTtm: 0,
      payoutRatio: 0,
    },
    management: {
      keyExecutives: [
        { name: 'Michael', position: 'President Director' },
        { name: 'Kartika Hadi', position: 'Director' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'Prajogo Pangestu', sharePercentage: '85.07%' },
        { name: 'Public Shareholders', sharePercentage: '14.93%' },
      ],
      whaleInvestors: ['Prajogo Pangestu'],
      conglomeratesGroup: ['Barito Group Network'],
    },
    peRatio: 58.4,
    pbvRatio: 16.8,
    dividendYield: 0.0,
    revenueGrowthYoY: 29.0,
    netProfitMargin: 24.6,
  },
  BKSL: {
    symbol: 'BKSL',
    companyName: 'PT Sentul City Tbk.',
    sector: 'Real Estate',
    subSector: 'Property Development',
    industry: 'Township & Urban Development',
    subIndustry: 'Residential & Commercial Projects',
    listingBoard: 'Main',
    listingDate: '1997-07-28',
    marketCap: 10200000000000,
    marketCapFormatted: 'Rp 10.2 T',
    marketCapRank: 82,
    employeeNum: 1100,
    lastClosePrice: 61,
    dailyCloseChange: -0.0896,
    esgScore: 26.8,
    tags: ['top-losers', 'property-township', 'sentul-highlands'],
    indices: ['IDXPROPERT', 'KOMPAS100'],
    affiliates: ['Sentul City Group'],
    allTimePrice: {
      ytdLow: 50,
      ytdHigh: 95,
      week52Low: 50,
      week52High: 95,
      allTimeLow: 50,
      allTimeHigh: 450,
    },
    valuation: {
      peRatio: 18.2,
      pbvRatio: 0.85,
      forwardPe: 15.0,
      intrinsicValue: 85,
    },
    futureForecasts: {
      analystRating: {
        buy: 2,
        hold: 4,
        sell: 1,
        strongBuy: 2,
        strongSell: 0,
        totalAnalysts: 9,
      },
      epsEstimate: 3.35,
      epsGrowth: 0.08,
      revenueEstimate: 1200000000000,
      revenueGrowth: 0.10,
    },
    financialsSummary: {
      eps: 2.8,
      roa: 0.032,
      roe: 0.048,
      netProfitMargin: 11.3,
      operatingProfitMargin: 18.2,
      debtToEquity: 0.65,
      totalAssets: 17500000000000,
      totalEquity: 12000000000000,
      totalRevenue: 1050000000000,
    },
    dividendSummary: {
      yieldTtm: 0.0,
      dividendTtm: 0,
      payoutRatio: 0,
    },
    management: {
      keyExecutives: [
        { name: 'Tjetje Muljanto', position: 'President Director' },
        { name: 'Basaria Panjaitan', position: 'President Commissioner' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'PT Sakti Generasi Perdana', sharePercentage: '52.68%' },
        { name: 'Public Shareholders', sharePercentage: '47.32%' },
      ],
      whaleInvestors: ['Sakti Generasi Perdana'],
      conglomeratesGroup: ['Sentul Group'],
    },
    peRatio: 18.2,
    pbvRatio: 0.85,
    dividendYield: 0.0,
    revenueGrowthYoY: 10.0,
    netProfitMargin: 11.3,
  },
  ELPI: {
    symbol: 'ELPI',
    companyName: 'PT Pelayaran Nasional Ekalya Purnamasari Tbk.',
    sector: 'Industrials',
    subSector: 'Logistics & Transportation',
    industry: 'Offshore Marine Services',
    subIndustry: 'Vessel Charter & Offshore Support',
    listingBoard: 'Main',
    listingDate: '2022-08-08',
    marketCap: 7600000000000,
    marketCapFormatted: 'Rp 7.6 T',
    marketCapRank: 105,
    employeeNum: 920,
    lastClosePrice: 1040,
    dailyCloseChange: -0.1647,
    esgScore: 24.1,
    tags: ['marine-logistics', 'offshore-vessel', 'top-losers'],
    indices: ['IDXTRANS', 'KOMPAS100'],
    affiliates: ['Ekalya Maritime Group'],
    allTimePrice: {
      ytdLow: 850,
      ytdHigh: 1450,
      week52Low: 820,
      week52High: 1450,
      allTimeLow: 190,
      allTimeHigh: 1450,
    },
    valuation: {
      peRatio: 12.8,
      pbvRatio: 1.45,
      forwardPe: 10.5,
      intrinsicValue: 1250,
    },
    futureForecasts: {
      analystRating: {
        buy: 4,
        hold: 2,
        sell: 0,
        strongBuy: 5,
        strongSell: 0,
        totalAnalysts: 11,
      },
      epsEstimate: 81.2,
      epsGrowth: 0.15,
      revenueEstimate: 1650000000000,
      revenueGrowth: 0.18,
    },
    financialsSummary: {
      eps: 68.5,
      roa: 0.074,
      roe: 0.125,
      netProfitMargin: 16.8,
      operatingProfitMargin: 22.4,
      debtToEquity: 0.92,
      totalAssets: 6800000000000,
      totalEquity: 3950000000000,
      totalRevenue: 1380000000000,
    },
    dividendSummary: {
      yieldTtm: 2.1,
      dividendTtm: 21.8,
      payoutRatio: 0.32,
      lastExDividendDate: '2026-06-18',
    },
    management: {
      keyExecutives: [
        { name: 'Eka Taniputra', position: 'President Director' },
        { name: 'Dave V. Manik', position: 'Director' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'PT Kreasi Cipta Bersama', sharePercentage: '68.50%' },
        { name: 'Public Shareholders', sharePercentage: '31.50%' },
      ],
      whaleInvestors: ['Kreasi Cipta Bersama'],
      conglomeratesGroup: ['Ekalya Group'],
    },
    peRatio: 12.8,
    pbvRatio: 1.45,
    dividendYield: 2.1,
    revenueGrowthYoY: 18.0,
    netProfitMargin: 16.8,
  },
  EMAS: {
    symbol: 'EMAS',
    companyName: 'PT Merdeka Gold Resources Tbk.',
    sector: 'Basic Materials',
    subSector: 'Metals & Mining',
    industry: 'Gold & Copper Mining',
    subIndustry: 'Precious Metals Exploration',
    listingBoard: 'Main',
    listingDate: '2015-06-19',
    marketCap: 134000000000000,
    marketCapFormatted: 'Rp 134.0 T',
    marketCapRank: 12,
    employeeNum: 3800,
    lastClosePrice: 5550,
    dailyCloseChange: -0.1868,
    esgScore: 29.5,
    tags: ['gold-mining', 'copper-resources', 'saratoga-group', 'top-losers'],
    indices: ['LQ45', 'IDX30', 'KOMPAS100', 'IDXBASIC'],
    affiliates: ['Saratoga Investama Sedaya', 'Thohir Family'],
    allTimePrice: {
      ytdLow: 4200,
      ytdHigh: 7200,
      week52Low: 3900,
      week52High: 7200,
      allTimeLow: 1100,
      allTimeHigh: 7200,
    },
    valuation: {
      peRatio: 42.0,
      pbvRatio: 3.80,
      forwardPe: 32.0,
      intrinsicValue: 6200,
    },
    futureForecasts: {
      analystRating: {
        buy: 8,
        hold: 4,
        sell: 1,
        strongBuy: 14,
        strongSell: 0,
        totalAnalysts: 27,
      },
      epsEstimate: 132.0,
      epsGrowth: 0.28,
      revenueEstimate: 24500000000000,
      revenueGrowth: 0.22,
    },
    financialsSummary: {
      eps: 98.4,
      roa: 0.068,
      roe: 0.118,
      netProfitMargin: 19.5,
      operatingProfitMargin: 28.6,
      debtToEquity: 1.15,
      totalAssets: 48000000000000,
      totalEquity: 21500000000000,
      totalRevenue: 19800000000000,
    },
    dividendSummary: {
      yieldTtm: 0.0,
      dividendTtm: 0,
      payoutRatio: 0,
    },
    management: {
      keyExecutives: [
        { name: 'Albert Saputro', position: 'President Director' },
        { name: 'David Thomas Fowler', position: 'Director' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'PT Saratoga Investama Sedaya Tbk', sharePercentage: '18.34%' },
        { name: 'PT Mitra Daya Mustika', sharePercentage: '12.05%' },
        { name: 'Garibaldi Thohir', sharePercentage: '7.35%' },
        { name: 'Public Shareholders', sharePercentage: '62.26%' },
      ],
      whaleInvestors: ['Saratoga', 'Boy Thohir'],
      conglomeratesGroup: ['Saratoga Group'],
    },
    peRatio: 42.0,
    pbvRatio: 3.80,
    dividendYield: 0.0,
    revenueGrowthYoY: 22.0,
    netProfitMargin: 19.5,
  },
  PSAB: {
    symbol: 'PSAB',
    companyName: 'PT J Resources Asia Pasifik Tbk.',
    sector: 'Basic Materials',
    subSector: 'Metals & Mining',
    industry: 'Gold Mining & Mineral Exploration',
    subIndustry: 'Precious Metals',
    listingBoard: 'Main',
    listingDate: '2003-02-14',
    marketCap: 10600000000000,
    marketCapFormatted: 'Rp 10.6 T',
    marketCapRank: 79,
    employeeNum: 1650,
    lastClosePrice: 404,
    dailyCloseChange: -0.2519,
    esgScore: 32.0,
    tags: ['gold-producer', 'mining-exploration', 'top-losers'],
    indices: ['IDXBASIC', 'KOMPAS100'],
    affiliates: ['J Resources Gold Network'],
    allTimePrice: {
      ytdLow: 180,
      ytdHigh: 560,
      week52Low: 160,
      week52High: 560,
      allTimeLow: 80,
      allTimeHigh: 850,
    },
    valuation: {
      peRatio: 15.6,
      pbvRatio: 1.10,
      forwardPe: 12.0,
      intrinsicValue: 480,
    },
    futureForecasts: {
      analystRating: {
        buy: 3,
        hold: 3,
        sell: 1,
        strongBuy: 4,
        strongSell: 0,
        totalAnalysts: 11,
      },
      epsEstimate: 25.8,
      epsGrowth: 0.14,
      revenueEstimate: 4800000000000,
      revenueGrowth: 0.16,
    },
    financialsSummary: {
      eps: 20.5,
      roa: 0.045,
      roe: 0.078,
      netProfitMargin: 12.4,
      operatingProfitMargin: 19.5,
      debtToEquity: 1.45,
      totalAssets: 14200000000000,
      totalEquity: 5800000000000,
      totalRevenue: 3950000000000,
    },
    dividendSummary: {
      yieldTtm: 0.0,
      dividendTtm: 0,
      payoutRatio: 0,
    },
    management: {
      keyExecutives: [
        { name: 'Edi Permadi', position: 'President Director' },
        { name: 'Sanjiv Saraf', position: 'Director' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'Jimmy Budiarto', sharePercentage: '61.20%' },
        { name: 'Public Shareholders', sharePercentage: '38.80%' },
      ],
      whaleInvestors: ['Jimmy Budiarto'],
      conglomeratesGroup: ['J Resources Group'],
    },
    peRatio: 15.6,
    pbvRatio: 1.10,
    dividendYield: 0.0,
    revenueGrowthYoY: 16.0,
    netProfitMargin: 12.4,
  },
  GOTO: {
    symbol: 'GOTO',
    companyName: 'PT GoTo Gojek Tokopedia Tbk.',
    sector: 'Technology',
    subSector: 'Software & IT Services',
    industry: 'Digital Ecosystem & On-Demand Services',
    subIndustry: 'E-Commerce & Digital Financial Services',
    listingBoard: 'Main',
    listingDate: '2022-04-11',
    marketCap: 62500000000000,
    marketCapFormatted: 'Rp 62.5 T',
    marketCapRank: 24,
    employeeNum: 3700,
    lastClosePrice: 52,
    dailyCloseChange: -0.0714,
    esgScore: 18.2,
    tags: ['tech-leader', 'on-demand-services', 'fintech', 'top-losers'],
    indices: ['LQ45', 'IDX30', 'KOMPAS100', 'IDXTECH'],
    affiliates: ['SoftBank', 'Alibaba Group', 'Telkomsel'],
    allTimePrice: {
      ytdLow: 50,
      ytdHigh: 88,
      week52Low: 50,
      week52High: 88,
      allTimeLow: 50,
      allTimeHigh: 404,
    },
    valuation: {
      peRatio: -18.5,
      pbvRatio: 1.95,
      forwardPe: 35.0,
      intrinsicValue: 75,
    },
    futureForecasts: {
      analystRating: {
        buy: 9,
        hold: 7,
        sell: 2,
        strongBuy: 14,
        strongSell: 0,
        totalAnalysts: 32,
      },
      epsEstimate: 1.5,
      epsGrowth: 0.85,
      revenueEstimate: 16200000000000,
      revenueGrowth: 0.18,
    },
    financialsSummary: {
      eps: -2.8,
      roa: -0.035,
      roe: -0.062,
      netProfitMargin: -8.4,
      operatingProfitMargin: -5.2,
      debtToEquity: 0.28,
      totalAssets: 44000000000000,
      totalEquity: 34500000000000,
      totalRevenue: 14100000000000,
    },
    dividendSummary: {
      yieldTtm: 0.0,
      dividendTtm: 0,
      payoutRatio: 0,
    },
    management: {
      keyExecutives: [
        { name: 'Patrick Sugito Walujo', position: 'President Director & Group CEO' },
        { name: 'Thomas Kristian Husted', position: 'Vice President Director' },
        { name: 'Simon Ho', position: 'Chief Financial Officer' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'SVF GT Subco (SoftBank)', sharePercentage: '7.62%' },
        { name: 'Taobao China Holding (Alibaba)', sharePercentage: '7.49%' },
        { name: 'Public Shareholders', sharePercentage: '84.89%' },
      ],
      whaleInvestors: ['SoftBank Vision Fund', 'Alibaba Group', 'GIC Singapore'],
      conglomeratesGroup: ['GoTo Digital Ecosystem'],
    },
    peRatio: -18.5,
    pbvRatio: 1.95,
    dividendYield: 0.0,
    revenueGrowthYoY: 18.0,
    netProfitMargin: -8.4,
  },
};

/**
 * Builds a realistic synthetic fundamental report for tickers not explicitly in the mock database
 */
function buildDynamicCompanyReport(upperSymbol: string): CompanyFundamentalReport {
  const knownMover = [...MOCK_TOP_GAINERS, ...MOCK_TOP_LOSERS].find(
    (m) => m.symbol.toUpperCase() === upperSymbol
  );
  const companyName = knownMover?.name || `PT ${upperSymbol} Indonesia Tbk.`;
  const price = knownMover?.price || 2500;
  const priceChange = knownMover ? (knownMover.price_change || 0) / 100 : 0.02;

  return {
    symbol: upperSymbol,
    companyName,
    sector: 'Industrials / Diversified',
    subSector: 'Diversified Operations',
    industry: 'Commercial Operations & Logistics',
    subIndustry: 'General Trading & Services',
    listingBoard: 'Main',
    listingDate: '2019-05-20',
    marketCap: 12500000000000,
    marketCapFormatted: 'Rp 12.5 T',
    marketCapRank: 65,
    employeeNum: 1200,
    lastClosePrice: price,
    dailyCloseChange: priceChange,
    esgScore: 23.8,
    tags: ['idx-listed', 'active-market-mover', 'high-liquidity'],
    indices: ['KOMPAS100', 'IDX80'],
    affiliates: ['Institutional Investment Group'],
    allTimePrice: {
      ytdLow: Math.round(price * 0.75),
      ytdHigh: Math.round(price * 1.35),
      week52Low: Math.round(price * 0.7),
      week52High: Math.round(price * 1.4),
      allTimeLow: Math.round(price * 0.4),
      allTimeHigh: Math.round(price * 1.6),
    },
    valuation: {
      peRatio: 16.5,
      pbvRatio: 1.75,
      forwardPe: 14.2,
      intrinsicValue: Math.round(price * 1.1),
    },
    futureForecasts: {
      analystRating: {
        buy: 4,
        hold: 2,
        sell: 0,
        strongBuy: 6,
        strongSell: 0,
        totalAnalysts: 12,
      },
      epsEstimate: 165.0,
      epsGrowth: 0.12,
      revenueEstimate: 4500000000000,
      revenueGrowth: 0.14,
    },
    financialsSummary: {
      eps: 145.0,
      roa: 0.058,
      roe: 0.142,
      netProfitMargin: 15.4,
      operatingProfitMargin: 19.8,
      debtToEquity: 1.05,
      totalAssets: 22000000000000,
      totalEquity: 11000000000000,
      totalRevenue: 3800000000000,
    },
    dividendSummary: {
      yieldTtm: 2.5,
      dividendTtm: 62.5,
      payoutRatio: 0.42,
      lastExDividendDate: '2026-06-20',
    },
    management: {
      keyExecutives: [
        { name: 'Board of Executive Directors', position: 'Executive Committee' },
      ],
    },
    ownership: {
      majorShareholders: [
        { name: 'Major Core Shareholders', sharePercentage: '55.0%' },
        { name: 'Public Free Float', sharePercentage: '45.0%' },
      ],
      whaleInvestors: ['Domestic Institutional Investors'],
      conglomeratesGroup: ['Listed Group'],
    },
    peRatio: 16.5,
    pbvRatio: 1.75,
    dividendYield: 2.5,
    revenueGrowthYoY: 14.0,
    netProfitMargin: 15.4,
    isLive: false,
  };
}

/**
 * Fetches company report / fundamentals from Sectors API v2 (/v2/company/report/{symbol}/)
 */
export async function getCompanyFundamentalReport(
  symbol: string,
  sessionApiKey?: string
): Promise<CompanyFundamentalReport> {
  const apiKey = sessionApiKey || process.env.SECTORS_API_KEY;
  const upperSymbol = symbol.toUpperCase().replace('.JK', '');

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const res = await axios.get(`${SECTORS_V2_BASE_URL}/company/report/${upperSymbol}/`, {
        headers: {
          Authorization: apiKey.trim(),
        },
        timeout: 7000,
      });

      const data = res.data;
      if (data) {
        const ov = data.overview || {};
        const val = data.valuation || {};
        const fut = data.future || {};
        const fin = data.financials || {};
        const div = data.dividend || {};
        const mgmt = data.management || {};
        const own = data.ownership || {};

        const mc = ov.market_cap || data.market_cap || 100000000000000;
        const mcFormatted = mc >= 1e12
          ? `Rp ${(mc / 1e12).toFixed(1)} T`
          : mc >= 1e9
          ? `Rp ${(mc / 1e9).toFixed(1)} B`
          : `Rp ${mc.toLocaleString()}`;

        const pe = val.pe || val.historical_valuation?.[0]?.pe || 15.0;
        const pbv = val.pb || val.historical_valuation?.[0]?.pb || 1.8;
        const divYield = (div.yield_ttm ? div.yield_ttm * 100 : (div.dividend_yield_avg?.avg_yield ? div.dividend_yield_avg.avg_yield * 100 : 3.5));

        const analyst = fut.analyst_rating_breakdown || {};
        const totalAnalysts = analyst.n_analyst || ((analyst.buy || 0) + (analyst.hold || 0) + (analyst.sell || 0) + (analyst.strong_buy || 0) + (analyst.strong_sell || 0)) || 0;

        const histRatio = fin.historical_financial_ratio?.[0] || {};

        return {
          symbol: upperSymbol,
          companyName: data.company_name || data.name || `PT ${upperSymbol} Tbk.`,
          sector: ov.sector || data.sector || 'Financials',
          subSector: ov.sub_sector || data.sub_sector || 'General',
          industry: ov.industry || data.industry,
          subIndustry: ov.sub_industry || data.sub_industry,
          listingBoard: ov.listing_board,
          listingDate: ov.listing_date,
          marketCap: mc,
          marketCapFormatted: mcFormatted,
          marketCapRank: ov.market_cap_rank,
          employeeNum: ov.employee_num,
          lastClosePrice: ov.last_close_price || val.last_close_price,
          dailyCloseChange: ov.daily_close_change || val.daily_close_change,
          esgScore: ov.esg_score,
          tags: ov.tags || [],
          indices: ov.indices || [],
          affiliates: ov.affiliates || [],
          allTimePrice: {
            ytdLow: ov.all_time_price?.ytd_low ? Object.values(ov.all_time_price.ytd_low)[0] as number : undefined,
            ytdHigh: ov.all_time_price?.ytd_high ? Object.values(ov.all_time_price.ytd_high)[0] as number : undefined,
            week52Low: ov.all_time_price?.['52_w_low'] ? Object.values(ov.all_time_price['52_w_low'])[0] as number : undefined,
            week52High: ov.all_time_price?.['52_w_high'] ? Object.values(ov.all_time_price['52_w_high'])[0] as number : undefined,
            allTimeLow: ov.all_time_price?.all_time_low ? Object.values(ov.all_time_price.all_time_low)[0] as number : undefined,
            allTimeHigh: ov.all_time_price?.all_time_high ? Object.values(ov.all_time_price.all_time_high)[0] as number : undefined,
          },
          valuation: {
            peRatio: parseFloat(Number(pe).toFixed(2)),
            pbvRatio: parseFloat(Number(pbv).toFixed(2)),
            forwardPe: val.forward_pe ? parseFloat(Number(val.forward_pe).toFixed(2)) : undefined,
            intrinsicValue: val.intrinsic_value,
            historicalValuation: val.historical_valuation,
          },
          futureForecasts: {
            analystRating: totalAnalysts > 0 ? {
              buy: analyst.buy || 0,
              hold: analyst.hold || 0,
              sell: analyst.sell || 0,
              strongBuy: analyst.strong_buy || 0,
              strongSell: analyst.strong_sell || 0,
              totalAnalysts,
            } : undefined,
            epsEstimate: fut.company_value_forecasts?.[0]?.eps_estimate,
            epsGrowth: fut.company_growth_forecasts?.[0]?.eps_growth,
            revenueEstimate: fut.company_value_forecasts?.[0]?.revenue_estimate,
            revenueGrowth: fut.company_growth_forecasts?.[0]?.revenue_growth,
          },
          financialsSummary: {
            eps: fin.eps || 0,
            roa: histRatio.profitability?.roa,
            roe: histRatio.profitability?.roe,
            netProfitMargin: histRatio.profitability?.net_profit_margin ? histRatio.profitability.net_profit_margin * 100 : 22.0,
            operatingProfitMargin: histRatio.profitability?.operating_profit_margin ? histRatio.profitability.operating_profit_margin * 100 : 30.0,
            debtToEquity: histRatio.leverage?.debt_to_equity_ratio,
            totalAssets: fin.historical_financials?.[0]?.total_assets,
            totalEquity: fin.historical_financials?.[0]?.total_equity,
            totalRevenue: fin.historical_financials?.[0]?.revenue,
          },
          dividendSummary: {
            yieldTtm: parseFloat(Number(divYield).toFixed(2)),
            dividendTtm: div.dividend_ttm,
            payoutRatio: div.payout_ratio,
            lastExDividendDate: div.last_ex_dividend_date,
          },
          management: {
            keyExecutives: mgmt.key_executives || [],
          },
          ownership: {
            majorShareholders: own.major_shareholders || [],
            whaleInvestors: own.whale_investors || [],
            conglomeratesGroup: own.conglomerates_group || [],
          },
          peers: data.peers || [],
          peRatio: parseFloat(Number(pe).toFixed(2)),
          pbvRatio: parseFloat(Number(pbv).toFixed(2)),
          dividendYield: parseFloat(Number(divYield).toFixed(2)),
          revenueGrowthYoY: fut.company_growth_forecasts?.[0]?.revenue_growth ? fut.company_growth_forecasts[0].revenue_growth * 100 : 8.5,
          netProfitMargin: histRatio.profitability?.net_profit_margin ? parseFloat((histRatio.profitability.net_profit_margin * 100).toFixed(1)) : 22.0,
          isLive: true,
          rawData: data,
        };
      }
    } catch (err: any) {
      console.warn(
        `Sectors API v2 /company/report/${upperSymbol} failed (${err.response?.status || err.message}), fallback to mock:`
      );
    }
  }

  const explicitMock = MOCK_FUNDAMENTAL_DATA[upperSymbol];
  if (explicitMock) {
    return {
      ...explicitMock,
      symbol: upperSymbol,
      companyName: explicitMock.companyName || `PT ${upperSymbol} Tbk.`,
      sector: explicitMock.sector || 'Financials',
      subSector: explicitMock.subSector || 'General',
      marketCap: explicitMock.marketCap || 15000000000000,
      marketCapFormatted: explicitMock.marketCapFormatted || 'Rp 15.0 T',
      peRatio: explicitMock.peRatio || 15.0,
      pbvRatio: explicitMock.pbvRatio || 1.5,
      dividendYield: explicitMock.dividendYield ?? 3.5,
      revenueGrowthYoY: explicitMock.revenueGrowthYoY || 8.0,
      netProfitMargin: explicitMock.netProfitMargin || 20.0,
      isLive: false,
    } as CompanyFundamentalReport;
  }

  return buildDynamicCompanyReport(upperSymbol);
}

export interface ScreenerFetchOptions {
  q?: string;
  where?: string;
  orderBy?: string;
  desc?: boolean;
  limit?: number;
  offset?: number;
  includeQueryValues?: boolean;
}

export interface ScreenerFetchResult {
  data: ScreenerCompanyResult[];
  queryValues?: Record<string, any>;
  query?: string;
  isLive: boolean;
}

const MOCK_SCREENER_UNIVERSE: ScreenerCompanyResult[] = [
  // Banks
  { symbol: 'BBCA', company_name: 'PT Bank Central Asia Tbk', sector: 'Financials', sub_sector: 'Banks', market_cap: 1285000000000000, price: 10450, pe: 18.2, pb: 4.2, dividend_yield: 2.8, revenue: 110000000000000, earnings: 48600000000000 },
  { symbol: 'BBRI', company_name: 'PT Bank Rakyat Indonesia Tbk', sector: 'Financials', sub_sector: 'Banks', market_cap: 788000000000000, price: 5200, pe: 12.5, pb: 2.3, dividend_yield: 6.1, revenue: 196000000000000, earnings: 60400000000000 },
  { symbol: 'BMRI', company_name: 'PT Bank Mandiri Tbk', sector: 'Financials', sub_sector: 'Banks', market_cap: 634000000000000, price: 6800, pe: 11.1, pb: 2.1, dividend_yield: 5.4, revenue: 165000000000000, earnings: 55100000000000 },
  { symbol: 'BBNI', company_name: 'PT Bank Negara Indonesia Tbk', sector: 'Financials', sub_sector: 'Banks', market_cap: 205000000000000, price: 5500, pe: 8.9, pb: 1.2, dividend_yield: 5.8, revenue: 76000000000000, earnings: 21100000000000 },
  { symbol: 'BRIS', company_name: 'PT Bank Syariah Indonesia Tbk', sector: 'Financials', sub_sector: 'Banks', market_cap: 122000000000000, price: 2650, pe: 16.5, pb: 2.8, dividend_yield: 1.8, revenue: 25000000000000, earnings: 5700000000000 },
  
  // Tech & Telco
  { symbol: 'TLKM', company_name: 'PT Telkom Indonesia Tbk', sector: 'Infrastructure', sub_sector: 'Telecommunication', market_cap: 307000000000000, price: 3100, pe: 14.8, pb: 2.2, dividend_yield: 5.2, revenue: 149000000000000, earnings: 24500000000000 },
  { symbol: 'GOTO', company_name: 'PT GoTo Gojek Tokopedia Tbk', sector: 'Technology', sub_sector: 'Software & IT Services', market_cap: 65000000000000, price: 54, pe: -15.2, pb: 0.8, dividend_yield: 0.0, revenue: 14800000000000, earnings: -3200000000000 },
  { symbol: 'BUKA', company_name: 'PT Bukalapak.com Tbk', sector: 'Technology', sub_sector: 'Software & IT Services', market_cap: 12000000000000, price: 118, pe: -8.4, pb: 0.5, dividend_yield: 0.0, revenue: 4400000000000, earnings: -1300000000000 },
  { symbol: 'EMTK', company_name: 'PT Elang Mahkota Teknologi Tbk', sector: 'Technology', sub_sector: 'Software & IT Services', market_cap: 28000000000000, price: 460, pe: 19.5, pb: 1.1, dividend_yield: 1.2, revenue: 12000000000000, earnings: 1400000000000 },
  { symbol: 'MTDL', company_name: 'PT Metrodata Electronics Tbk', sector: 'Technology', sub_sector: 'Software & IT Services', market_cap: 8200000000000, price: 670, pe: 11.2, pb: 1.8, dividend_yield: 3.5, revenue: 22000000000000, earnings: 710000000000 },

  // Energy & Mining
  { symbol: 'ADRO', company_name: 'PT Alamtri Resources Indonesia Tbk', sector: 'Energy', sub_sector: 'Coal', market_cap: 115000000000000, price: 3600, pe: 4.5, pb: 0.9, dividend_yield: 14.2, revenue: 98000000000000, earnings: 25500000000000 },
  { symbol: 'PTBA', company_name: 'PT Bukit Asam Tbk', sector: 'Energy', sub_sector: 'Coal', market_cap: 32000000000000, price: 2780, pe: 5.8, pb: 1.4, dividend_yield: 12.8, revenue: 38000000000000, earnings: 6100000000000 },
  { symbol: 'ITMG', company_name: 'PT Indo Tambangraya Megah Tbk', sector: 'Energy', sub_sector: 'Coal', market_cap: 30000000000000, price: 26500, pe: 5.1, pb: 1.1, dividend_yield: 15.5, revenue: 35000000000000, earnings: 5800000000000 },
  { symbol: 'BREN', company_name: 'PT Barito Renewables Energy Tbk', sector: 'Utilities', sub_sector: 'Renewable Energy', market_cap: 950000000000000, price: 7100, pe: 180.0, pb: 65.0, dividend_yield: 0.2, revenue: 9200000000000, earnings: 1800000000000 },
  { symbol: 'CUAN', company_name: 'PT Petrindo Jaya Kreasi Tbk', sector: 'Energy', sub_sector: 'Coal & Mining', market_cap: 85000000000000, price: 7550, pe: 95.0, pb: 28.0, dividend_yield: 0.0, revenue: 4100000000000, earnings: 850000000000 },
  { symbol: 'MEDC', company_name: 'PT Medco Energi Internasional Tbk', sector: 'Energy', sub_sector: 'Oil & Gas', market_cap: 35000000000000, price: 1390, pe: 6.4, pb: 1.0, dividend_yield: 4.1, revenue: 34000000000000, earnings: 5100000000000 },

  // Consumer Goods & Healthcare
  { symbol: 'ICBP', company_name: 'PT Indofood CBP Sukses Makmur Tbk', sector: 'Consumer Non-Cyclicals', sub_sector: 'Processed Food', market_cap: 138000000000000, price: 11800, pe: 15.4, pb: 2.8, dividend_yield: 3.2, revenue: 67000000000000, earnings: 9000000000000 },
  { symbol: 'INDF', company_name: 'PT Indofood Sukses Makmur Tbk', sector: 'Consumer Non-Cyclicals', sub_sector: 'Food Products', market_cap: 58000000000000, price: 6600, pe: 7.1, pb: 1.0, dividend_yield: 4.8, revenue: 111000000000000, earnings: 8100000000000 },
  { symbol: 'UNVR', company_name: 'PT Unilever Indonesia Tbk', sector: 'Consumer Non-Cyclicals', sub_sector: 'Household & Personal Care', market_cap: 72000000000000, price: 1880, pe: 18.9, pb: 14.5, dividend_yield: 5.5, revenue: 38000000000000, earnings: 4800000000000 },
  { symbol: 'MYOR', company_name: 'PT Mayora Indah Tbk', sector: 'Consumer Non-Cyclicals', sub_sector: 'Food Products', market_cap: 55000000000000, price: 2460, pe: 16.2, pb: 3.1, dividend_yield: 2.8, revenue: 31000000000000, earnings: 3200000000000 },
  { symbol: 'KLBF', company_name: 'PT Kalbe Farma Tbk', sector: 'Healthcare', sub_sector: 'Pharmaceuticals', market_cap: 68000000000000, price: 1450, pe: 21.0, pb: 3.4, dividend_yield: 2.5, revenue: 30000000000000, earnings: 3100000000000 },
  { symbol: 'ASII', company_name: 'PT Astra International Tbk', sector: 'Industrials', sub_sector: 'Automotive & Heavy Equipment', market_cap: 204000000000000, price: 5050, pe: 6.2, pb: 1.0, dividend_yield: 8.5, revenue: 316000000000000, earnings: 33800000000000 },
];

/**
 * Fetches companies from Sectors API v2 Screener (/v2/companies/)
 * Supports both Natural Language query (q) and SQL-like structured conditions (where, order_by).
 */
export async function fetchCompaniesScreener(
  options: ScreenerFetchOptions,
  sessionApiKey?: string
): Promise<ScreenerFetchResult> {
  const apiKey = sessionApiKey || process.env.SECTORS_API_KEY;
  const qPrompt = (options.q || '').trim();
  const limit = options.limit || 5;

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const params: Record<string, any> = {};

      if (qPrompt.length > 0) {
        params.q = qPrompt;
        params.include_query_values = true;
      } else if (options.where && options.where.trim().length > 0) {
        params.where = options.where.trim();
        if (options.orderBy) params.order_by = options.orderBy;
        if (options.desc !== undefined) params.desc = options.desc;
        params.limit = limit;
        if (options.offset) params.offset = options.offset;
      } else {
        params.q = 'top 5 companies by market cap';
        params.include_query_values = true;
      }

      const res = await axios.get(`${SECTORS_V2_BASE_URL}/companies/`, {
        headers: {
          Authorization: apiKey.trim(),
        },
        params,
        timeout: 10000,
      });

      const responseData = res.data;
      if (responseData) {
        let rawList: any[] = [];
        let queryValues: Record<string, any> | undefined = undefined;

        if (Array.isArray(responseData)) {
          rawList = responseData;
        } else if (typeof responseData === 'object') {
          queryValues = responseData.query_values || responseData.interpreted_query;
          if (Array.isArray(responseData.data)) {
            rawList = responseData.data;
          } else if (Array.isArray(responseData.companies)) {
            rawList = responseData.companies;
          } else if (Array.isArray(responseData.results)) {
            rawList = responseData.results;
          } else {
            // Find any array property in the payload
            for (const val of Object.values(responseData)) {
              if (Array.isArray(val) && val.length > 0) {
                rawList = val;
                break;
              }
            }
          }
        }

        if (rawList.length > 0) {
          const normalized: ScreenerCompanyResult[] = rawList.slice(0, limit).map((item, idx) => {
            // Merge query_values if nested in item
            const queryVals = item.query_values && typeof item.query_values === 'object' ? item.query_values : {};
            const mergedItem = { ...queryVals, ...item };

            const rawSymbol = (mergedItem.symbol || mergedItem.ticker || `STOCK${idx + 1}`).toUpperCase().replace('.JK', '');
            
            // Helper to find numeric value by key pattern across merged item & query_values
            const findNum = (patterns: RegExp[]): number | undefined => {
              for (const p of patterns) {
                for (const [k, v] of Object.entries(mergedItem)) {
                  if (p.test(k) && v !== null && v !== undefined && v !== '') {
                    const n = Number(v);
                    if (!isNaN(n)) return n;
                  }
                }
              }
              return undefined;
            };

            const mcap = findNum([/^market_?cap/i, /^mcap/i, /market_capitalization/i]);
            const price = findNum([/^last_close_price$/i, /^price$/i, /^close$/i, /^last_price$/i, /^closing_price$/i]);
            const pe = findNum([/^pe_ttm$/i, /^pe$/i, /^forward_pe$/i, /^pe_ratio$/i, /^per$/i, /^pe\[/i, /price_to_earnings/i]);
            const pb = findNum([/^pb_mrq$/i, /^pb$/i, /^pb_ratio$/i, /^pbv$/i, /^pb\[/i, /price_to_book/i]);
            const divYield = findNum([/^yield_ttm$/i, /^dividend_yield$/i, /^total_yield/i, /^dividend_yield_avg$/i, /^dividendYield$/i, /^div_yield$/i, /^yield$/i]);
            const revenue = findNum([/^total_revenue_mrq$/i, /^revenue$/i, /^total_revenue$/i, /^revenue\[/i, /^revenue_q\[/i, /^sales$/i]);
            const earnings = findNum([/^earnings_mrq$/i, /^earnings$/i, /^net_profit$/i, /^net_income$/i, /^earnings\[/i, /^earnings_q\[/i]);
            const roe = findNum([/^roe_ttm$/i, /^roe$/i, /^roe\[/i]);
            const roa = findNum([/^roa_ttm$/i, /^roa$/i, /^roa\[/i]);

            return {
              ...mergedItem,
              symbol: rawSymbol,
              company_name: mergedItem.company_name || mergedItem.name || mergedItem.companyName || `PT ${rawSymbol} Tbk`,
              sector: mergedItem.sector || mergedItem.sector_name,
              sub_sector: mergedItem.sub_sector || mergedItem.sub_sector_name || mergedItem.industry,
              market_cap: mcap,
              price: price,
              pe: pe !== undefined ? parseFloat(Number(pe).toFixed(2)) : undefined,
              pb: pb !== undefined ? parseFloat(Number(pb).toFixed(2)) : undefined,
              dividend_yield: divYield !== undefined ? parseFloat(Number(divYield).toFixed(2)) : undefined,
              revenue: revenue,
              earnings: earnings,
              roe: roe !== undefined ? parseFloat(Number(roe).toFixed(2)) : undefined,
              roa: roa !== undefined ? parseFloat(Number(roa).toFixed(2)) : undefined,
            };
          });

          return {
            data: normalized,
            queryValues: queryValues || responseData.llm_translation?.translated_params,
            query: qPrompt,
            isLive: true,
          };
        }
      }
    } catch (err: any) {
      console.warn(
        `Sectors API v2 /companies/ screener failed (${err.response?.status || err.message}), fallback to mock:`
      );
    }
  }

  // --- Offline Mock Fallback Engine ---
  const queryLower = qPrompt.toLowerCase();
  let filtered = [...MOCK_SCREENER_UNIVERSE];

  if (queryLower.includes('bank') || queryLower.includes('financial')) {
    filtered = filtered.filter((c) => c.sector === 'Financials' || c.sub_sector === 'Banks');
  } else if (queryLower.includes('tech') || queryLower.includes('software') || queryLower.includes('digital')) {
    filtered = filtered.filter((c) => c.sector === 'Technology' || c.symbol === 'TLKM');
  } else if (queryLower.includes('coal') || queryLower.includes('energy') || queryLower.includes('mining') || queryLower.includes('oil')) {
    filtered = filtered.filter((c) => c.sector === 'Energy' || c.sector === 'Utilities');
  } else if (queryLower.includes('consumer') || queryLower.includes('food') || queryLower.includes('f&b')) {
    filtered = filtered.filter((c) => c.sector === 'Consumer Non-Cyclicals' || c.sector === 'Healthcare');
  } else if (queryLower.includes('dividend') || queryLower.includes('yield')) {
    filtered = filtered.sort((a, b) => (b.dividend_yield || 0) - (a.dividend_yield || 0));
  } else if (queryLower.includes('pe <') || queryLower.includes('low pe') || queryLower.includes('undervalued')) {
    filtered = filtered.filter((c) => (c.pe || 999) > 0).sort((a, b) => (a.pe || 999) - (b.pe || 999));
  } else if (queryLower.includes('revenue') || queryLower.includes('sales')) {
    filtered = filtered.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
  } else {
    // Default sorting by market cap descending
    filtered = filtered.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
  }

  const results = filtered.slice(0, limit);

  return {
    data: results,
    queryValues: {
      interpreted_query: qPrompt || 'top companies by market cap',
      mock_filter_applied: true,
    },
    query: qPrompt,
    isLive: false,
  };
}
