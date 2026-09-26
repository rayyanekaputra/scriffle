import rawCompanies from './popularIdxCompanies.json';

export interface IdxCompany {
  symbol: string;
  name: string;
  popular?: boolean;
}

export const POPULAR_IDX_COMPANIES: IdxCompany[] = rawCompanies as IdxCompany[];

export const POPULAR_PICKS: IdxCompany[] = POPULAR_IDX_COMPANIES.filter((c) => c.popular);
