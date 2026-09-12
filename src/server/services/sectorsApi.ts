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
};

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

  const mock = MOCK_FUNDAMENTAL_DATA[upperSymbol] || MOCK_FUNDAMENTAL_DATA['BBCA']!;

  return {
    ...mock,
    symbol: upperSymbol,
    companyName: mock.companyName || `PT ${upperSymbol} Tbk.`,
    sector: mock.sector || 'Financials',
    subSector: mock.subSector || 'General',
    marketCap: mock.marketCap || 150000000000000,
    marketCapFormatted: mock.marketCapFormatted || 'Rp 150.0 T',
    peRatio: mock.peRatio || 15.0,
    pbvRatio: mock.pbvRatio || 1.5,
    dividendYield: mock.dividendYield || 3.5,
    revenueGrowthYoY: mock.revenueGrowthYoY || 8.0,
    netProfitMargin: mock.netProfitMargin || 20.0,
    isLive: false,
  } as CompanyFundamentalReport;
}
