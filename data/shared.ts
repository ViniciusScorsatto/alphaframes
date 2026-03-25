import {unstable_cache} from 'next/cache';
import type {AssetType, HistoricalPricePoint, NormalizedAssetData} from '@/types';
import {toIsoDate} from '@/lib/utils';

export function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase();
}

export function createHistoricalPoint(date: string | number, price: number): HistoricalPricePoint {
  const parsedDate = new Date(date);
  return {
    date: toIsoDate(parsedDate),
    timestamp: parsedDate.getTime(),
    price,
  };
}

export function buildAssetData(input: {
  ticker: string;
  displayName?: string;
  assetType: AssetType;
  currentPrice: number;
  currency?: string;
  historical: HistoricalPricePoint[];
}): NormalizedAssetData {
  return {
    ticker: normalizeTicker(input.ticker),
    displayName: input.displayName ?? normalizeTicker(input.ticker),
    assetType: input.assetType,
    currency: input.currency ?? 'USD',
    currentPrice: input.currentPrice,
    historical: input.historical.sort((a, b) => a.timestamp - b.timestamp),
  };
}

export const cacheMarketData = <TArgs extends unknown[], TResult>(
  cacheKey: string,
  fn: (...args: TArgs) => Promise<TResult>,
) =>
  unstable_cache(
    async (...args: TArgs) => fn(...args),
    [cacheKey],
    {
      revalidate: 60 * 30,
      tags: ['market-data'],
    },
  );
