import {buildAssetData, createHistoricalPoint, normalizeTicker} from '@/data/shared';
import type {NormalizedAssetData} from '@/types';

interface CoinGeckoSearchResponse {
  coins: Array<{
    id: string;
    symbol: string;
    name: string;
  }>;
}

interface CoinGeckoMarketChartResponse {
  prices: [number, number][];
}

async function findCoinId(ticker: string) {
  const normalized = normalizeTicker(ticker).toLowerCase();
  const search = await fetch(`https://api.coingecko.com/api/v3/search?query=${normalized}`, {
    next: {revalidate: 60 * 60},
  });

  if (!search.ok) {
    throw new Error(`CoinGecko search failed for ${ticker}`);
  }

  const data = (await search.json()) as CoinGeckoSearchResponse;
  const match =
    data.coins.find((coin) => coin.symbol.toLowerCase() === normalized) ??
    data.coins.find((coin) => coin.name.toLowerCase() === normalized) ??
    data.coins[0];

  if (!match) {
    throw new Error(`No CoinGecko asset found for ${ticker}`);
  }

  return match;
}

export async function fetchCryptoAsset(ticker: string): Promise<NormalizedAssetData> {
  const coin = await findCoinId(ticker);
  const chartResponse = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=365&interval=daily`,
    {
      next: {revalidate: 60 * 30},
    },
  );

  if (!chartResponse.ok) {
    throw new Error(`CoinGecko historical lookup failed for ${ticker}`);
  }

  const chart = (await chartResponse.json()) as CoinGeckoMarketChartResponse;
  const historical = chart.prices.map(([timestamp, price]) => createHistoricalPoint(timestamp, price));
  const currentPrice = historical[historical.length - 1]?.price;

  if (!currentPrice) {
    throw new Error(`CoinGecko returned no price history for ${ticker}`);
  }

  return buildAssetData({
    ticker: coin.symbol,
    displayName: coin.name,
    assetType: 'crypto',
    currentPrice,
    historical,
  });
}
