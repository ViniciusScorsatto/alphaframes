import {buildAssetData, createHistoricalPoint, normalizeTicker} from '@/data/shared';
import type {AssetType, NormalizedAssetData} from '@/types';

interface YahooChartResponse {
  chart: {
    result?: Array<{
      meta: {
        symbol: string;
        longName?: string;
        shortName?: string;
        currency?: string;
        regularMarketPrice?: number;
      };
      timestamp?: number[];
      indicators: {
        quote: Array<{
          close: Array<number | null>;
        }>;
      };
    }>;
    error?: {
      description?: string;
    };
  };
}

export async function fetchYahooAsset(ticker: string, assetType: AssetType): Promise<NormalizedAssetData> {
  const normalized = normalizeTicker(ticker);
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${normalized}?range=1y&interval=1d&includePrePost=false`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: {revalidate: 60 * 30},
    },
  );

  if (!response.ok) {
    throw new Error(`Yahoo Finance lookup failed for ${ticker}`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart.result?.[0];

  if (!result || !result.timestamp?.length) {
    throw new Error(payload.chart.error?.description ?? `No Yahoo Finance data found for ${ticker}`);
  }

  const closes = result.indicators.quote[0]?.close ?? [];
  const historical = result.timestamp
    .map((timestamp, index) => {
      const price = closes[index];
      if (price == null) {
        return null;
      }

      return createHistoricalPoint(timestamp * 1000, price);
    })
    .filter((point): point is NonNullable<typeof point> => Boolean(point));

  const currentPrice = result.meta.regularMarketPrice ?? historical[historical.length - 1]?.price;

  if (!currentPrice) {
    throw new Error(`Yahoo Finance returned no current price for ${ticker}`);
  }

  return buildAssetData({
    ticker: result.meta.symbol,
    displayName: result.meta.longName ?? result.meta.shortName ?? normalized,
    assetType,
    currentPrice,
    currency: result.meta.currency ?? 'USD',
    historical,
  });
}
