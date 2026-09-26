import { POPULAR_IDX_COMPANIES, POPULAR_PICKS, IdxCompany } from '@/data/popularIdxCompanies';

export { POPULAR_PICKS };

export function searchCompanies(query: string, limit = 8): IdxCompany[] {
  const cleanQuery = query.trim().toLowerCase();

  // Empty query -> show curated popular picks only
  if (!cleanQuery) {
    return POPULAR_PICKS.slice(0, limit);
  }

  const queryWords = cleanQuery.split(/\s+/).filter(Boolean);

  const matched = POPULAR_IDX_COMPANIES.filter((company) => {
    const symbolLower = company.symbol.toLowerCase();
    const nameLower = company.name.toLowerCase();

    // 1. Symbol starts with or contains query (highest priority)
    if (symbolLower.startsWith(cleanQuery) || symbolLower.includes(cleanQuery)) {
      return true;
    }

    // 2. Every typed word must appear somewhere in the company name or symbol
    return queryWords.every((word) => nameLower.includes(word) || symbolLower.includes(word));
  });

  // Sort: exact symbol match -> symbol prefix match -> symbol substring match -> rest (preserves liquidity order)
  matched.sort((a, b) => {
    const aSym = a.symbol.toLowerCase();
    const bSym = b.symbol.toLowerCase();

    const aExact = aSym === cleanQuery;
    const bExact = bSym === cleanQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aPrefix = aSym.startsWith(cleanQuery);
    const bPrefix = bSym.startsWith(cleanQuery);
    if (aPrefix && !bPrefix) return -1;
    if (!aPrefix && bPrefix) return 1;

    const aContains = aSym.includes(cleanQuery);
    const bContains = bSym.includes(cleanQuery);
    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;

    return 0;
  });

  return matched.slice(0, limit);
}
