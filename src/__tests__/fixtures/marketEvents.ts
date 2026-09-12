import type { MarketEvent } from '@/types/canvas';

export const BBCA_SURGE: MarketEvent = {
  symbol: 'BBCA',
  price: 10850,
  prevPrice: 10200,
  price_change: 6.37,
  volume: 25_000_000,
  avg_volume: 10_000_000,
  rank: 1,
  timestamp: '16:30:00',
};

export const BBRI_NEUTRAL: MarketEvent = {
  symbol: 'BBRI',
  price: 5200,
  prevPrice: 5100,
  price_change: 1.96,
  volume: 18_000_000,
  avg_volume: 18_000_000,
  rank: 2,
  timestamp: '16:30:00',
};

export const TLKM_DROP: MarketEvent = {
  symbol: 'TLKM',
  price: 3100,
  prevPrice: 3150,
  price_change: -1.58,
  volume: 8_500_000,
  avg_volume: 9_500_000,
  rank: 4,
  timestamp: '16:30:00',
};

export const BMRI_VOLUME_SPIKE: MarketEvent = {
  symbol: 'BMRI',
  price: 6800,
  prevPrice: 6500,
  price_change: 4.62,
  volume: 50_000_000, // 5x avg_volume
  avg_volume: 10_000_000,
  rank: 3,
  timestamp: '16:30:00',
};

export const MOCK_GAINERS: MarketEvent[] = [
  {
    symbol: 'JECX',
    name: 'PT Nitrasanata Dharma Tbk',
    price: 1950,
    prevPrice: 1560,
    price_change: 25.0,
    volume: 38_500_000,
    avg_volume: 12_000_000,
    rank: 1,
    timestamp: '16:30:00',
  },
  {
    symbol: 'AGII',
    name: 'PT Samator Indo Gas Tbk',
    price: 3080,
    prevPrice: 2500,
    price_change: 23.2,
    volume: 48_000_000,
    avg_volume: 20_000_000,
    rank: 2,
    timestamp: '16:30:00',
  },
  {
    symbol: 'MPRO',
    name: 'PT Maha Properti Indonesia Tbk',
    price: 9800,
    prevPrice: 8000,
    price_change: 22.5,
    volume: 29_000_000,
    avg_volume: 15_000_000,
    rank: 3,
    timestamp: '16:30:00',
  },
];

export const MOCK_LOSERS: MarketEvent[] = [
  {
    symbol: 'BKSL',
    name: 'Sentul City Tbk',
    price: 61,
    prevPrice: 67,
    price_change: -8.96,
    volume: 310_000_000,
    avg_volume: 180_000_000,
    rank: 1,
    timestamp: '16:30:00',
  },
  {
    symbol: 'ELPI',
    name: 'PT Pelayaran Nasional Ekalya Tbk',
    price: 1040,
    prevPrice: 1245,
    price_change: -16.47,
    volume: 45_000_000,
    avg_volume: 22_000_000,
    rank: 2,
    timestamp: '16:30:00',
  },
  {
    symbol: 'PSAB',
    name: 'J Resources Asia Pasifik Tbk',
    price: 404,
    prevPrice: 540,
    price_change: -25.19,
    volume: 85_000_000,
    avg_volume: 40_000_000,
    rank: 3,
    timestamp: '16:30:00',
  },
];
