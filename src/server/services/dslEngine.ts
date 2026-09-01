import { Parser } from 'expr-eval';
import { MarketEvent } from '@/types/canvas';

/**
 * Safely evaluates a boolean Condition rule string against a MarketEvent payload.
 * Supported operators: >, <, >=, <=, ==, !=, AND, OR, +, -, *, /
 * E.g. "price_change > 5 AND volume > 2 * avg_volume"
 */
export function evaluateCondition(ruleStr: string, event: MarketEvent): boolean {
  if (!ruleStr || typeof ruleStr !== 'string') {
    return false;
  }

  try {
    // Normalize case-insensitive logical operators for expr-eval
    const normalized = ruleStr
      .replace(/\bAND\b/gi, 'and')
      .replace(/\bOR\b/gi, 'or')
      .trim();

    const parser = new Parser();
    const expr = parser.parse(normalized);

    // Provide sanitized context mapping with defined fallback values
    const context: Record<string, any> = {
      symbol: event.symbol,
      price: event.price || 0,
      prevPrice: event.prevPrice || 0,
      price_change: event.price_change || 0,
      priceChange: event.price_change || 0,
      volume: event.volume || 0,
      avg_volume: event.avg_volume || 0,
      avgVolume: event.avg_volume || 0,
      rank: event.rank || 0,
      rank_change: event.rank_change || 0,
      rankChange: event.rank_change || 0,
      timestamp: event.timestamp || '',
    };

    const result = expr.evaluate(context);
    return Boolean(result);
  } catch (error) {
    console.error(`DSL evaluation error for rule "${ruleStr}":`, error);
    return false;
  }
}
