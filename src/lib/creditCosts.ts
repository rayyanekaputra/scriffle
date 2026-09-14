/**
 * Sectors API v2 Credit Cost & Token Pricing Registry
 * 
 * Reference Rates:
 * - GET /v2/companies/top-changes/     => 10 credits / poll
 * - GET /v2/company/report/{symbol}/   => 8 credits / symbol
 * - GET /v2/companies/?q=...           => 3 credits / query
 * - GET /v2/daily/{symbol}/            => 1 credit / tick
 * - Local Canvas Mutations (notes/etc) => 0 credits
 */

export interface CreditCostInfo {
  credits: number;
  unit: string;
  badgeText: string;
  endpoint?: string;
  isExpensive?: boolean;
  burstWarning?: string;
}

export function getNodeCreditCost(type: string, config: any = {}): CreditCostInfo {
  switch (type) {
    case 'watcher': {
      const isRadar =
        config.mode === 'top_gainers' ||
        config.mode === 'top_losers' ||
        config.symbol === 'Top Gainers' ||
        config.symbol === 'Top Losers' ||
        config.symbol === 'TOP_GAINERS' ||
        config.symbol === 'TOP_LOSERS';

      if (isRadar) {
        return {
          credits: 10,
          unit: 'poll',
          badgeText: '10 credits / poll',
          endpoint: '/v2/companies/top-changes/',
          isExpensive: true,
          burstWarning: 'Consumes 10 API credits on each leaderboard poll interval.',
        };
      }

      return {
        credits: 1,
        unit: 'tick',
        badgeText: '1 credit / tick',
        endpoint: '/v2/daily/{symbol}/',
        isExpensive: false,
      };
    }

    case 'screener': {
      return {
        credits: 3,
        unit: 'screen',
        badgeText: '3 AI credits / query',
        endpoint: '/v2/companies/?q=...',
        isExpensive: false,
        burstWarning: 'Consumes 3 AI token credits per natural language query execution.',
      };
    }

    case 'action': {
      if (config.action === 'fundamental_report') {
        return {
          credits: 8,
          unit: 'symbol',
          badgeText: '8 credits / symbol',
          endpoint: '/v2/company/report/{symbol}/',
          isExpensive: true,
          burstWarning: 'Consumes 8 credits per symbol (~40 credits for a 5-stock leaderboard burst).',
        };
      }

      return {
        credits: 0,
        unit: 'mutation',
        badgeText: '0 credits (local)',
        isExpensive: false,
      };
    }

    default:
      return {
        credits: 0,
        unit: 'local',
        badgeText: '0 credits',
        isExpensive: false,
      };
  }
}
