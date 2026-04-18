import {cacheMarketData} from '@/data/shared';
import {toIsoDate} from '@/lib/utils';

interface CoinGeckoMarketCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h_in_currency: number | null;
  price_change_percentage_7d_in_currency: number | null;
}

interface CoinGeckoCategory {
  id: string;
  name: string;
  market_cap: number;
  market_cap_change_24h: number | null;
  content?: string;
  top_3_coins?: string[];
}

interface CoinGeckoMarketChartResponse {
  prices: [number, number][];
}

export interface MarketCoinSnapshot {
  id: string;
  ticker: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  totalVolume: number;
  change24h: number;
  change7d: number;
  volumeToMarketCapRatio: number;
}

export interface MarketCategorySnapshot {
  id: string;
  name: string;
  marketCap: number;
  change24h: number;
  topCoins: string[];
}

async function fetchTopCoinsMarketDataRaw() {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d',
    {
      next: {revalidate: 60 * 30},
    },
  );

  if (!response.ok) {
    throw new Error('CoinGecko top market request failed.');
  }

  const payload = (await response.json()) as CoinGeckoMarketCoin[];

  return payload.map((coin) => ({
    id: coin.id,
    ticker: coin.symbol.toUpperCase(),
    name: coin.name,
    currentPrice: coin.current_price,
    marketCap: coin.market_cap,
    totalVolume: coin.total_volume,
    change24h: coin.price_change_percentage_24h_in_currency ?? 0,
    change7d: coin.price_change_percentage_7d_in_currency ?? 0,
    volumeToMarketCapRatio: coin.market_cap > 0 ? coin.total_volume / coin.market_cap : 0,
  })) satisfies MarketCoinSnapshot[];
}

async function fetchCategorySnapshotsRaw() {
  const response = await fetch('https://api.coingecko.com/api/v3/coins/categories', {
    next: {revalidate: 60 * 30},
  });

  if (!response.ok) {
    throw new Error('CoinGecko categories request failed.');
  }

  const payload = (await response.json()) as CoinGeckoCategory[];

  return payload
    .map((category) => ({
      id: category.id,
      name: category.name,
      marketCap: category.market_cap,
      change24h: category.market_cap_change_24h ?? 0,
      topCoins: category.top_3_coins ?? [],
    }))
    .filter((category) => category.marketCap > 0) satisfies MarketCategorySnapshot[];
}

async function fetchCoinMarketChartRaw(coinId: string, days: 90) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
    {
      next: {revalidate: 60 * 30},
    },
  );

  if (!response.ok) {
    throw new Error(`CoinGecko historical pattern request failed for ${coinId}.`);
  }

  const payload = (await response.json()) as CoinGeckoMarketChartResponse;

  return payload.prices.map(([timestamp, price]) => ({
    date: toIsoDate(timestamp),
    timestamp,
    price,
  }));
}

export const fetchTopCoinsMarketData = cacheMarketData('coingecko-top-50-market', fetchTopCoinsMarketDataRaw);
export const fetchCategorySnapshots = cacheMarketData('coingecko-category-snapshots', fetchCategorySnapshotsRaw);
export const fetchCoinMarketChart = cacheMarketData('coingecko-market-chart', fetchCoinMarketChartRaw);
