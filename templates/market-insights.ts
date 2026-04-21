import {fetchCategorySnapshots, fetchCoinMarketChart, fetchTopCoinsMarketData} from '@/data/coingecko-market';
import type {MarketCoinSnapshot} from '@/data/coingecko-market';
import {
  generateAnomalyDetectorNarrative,
  generateDivergenceNarrative,
  generateExhaustionMoveNarrative,
  generateMarketSnapshotNarrative,
  generateNarrativeDetectorNarrative,
  generatePatternMatchNarrative,
  generateSilentAccumulationNarrative,
  generateVolatilityRegimeNarrative,
  selectNarrativeContext,
} from '@/lib/market-narrative';
import {clamp, formatPercent, toIsoDate} from '@/lib/utils';
import type {MarketTemplateData, MarketTemplateId} from '@/types';

interface AnomalySignalBase {
  headline: string;
  narrative: string;
  confidence: number;
  risk_label: 'low' | 'medium' | 'high';
  data_points: Record<string, unknown>;
  coin?: {
    ticker: string;
    name: string;
  };
}

interface SilentAccumulationSignal extends AnomalySignalBase {
  type: 'silent_accumulation';
}

interface ExhaustionMoveSignal extends AnomalySignalBase {
  type: 'exhaustion_move';
}

interface DivergenceSignal extends AnomalySignalBase {
  type: 'divergence';
}

type AnomalySignal = SilentAccumulationSignal | ExhaustionMoveSignal | DivergenceSignal;

const STABLECOIN_IDS = new Set([
  'tether',
  'usd-coin',
  'dai',
  'first-digital-usd',
  'ethena-usde',
  'usds',
  'paypal-usd',
  'true-usd',
  'usdd',
  'pax-dollar',
  'binance-usd',
  'gemini-dollar',
  'frax',
  'gho',
  'liquity-usd',
  'ripple-usd',
  'stasis-eurs',
  'euro-coin',
  'mountain-protocol-usdm',
  'world-liberty-financial-usd',
]);

const STABLECOIN_TICKERS = new Set([
  'USDT',
  'USDC',
  'DAI',
  'FDUSD',
  'USDE',
  'USDS',
  'PYUSD',
  'TUSD',
  'USDD',
  'USDP',
  'BUSD',
  'GUSD',
  'FRAX',
  'GHO',
  'LUSD',
  'RLUSD',
  'EURS',
  'EURC',
  'USDM',
  'USD1',
]);

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stddev(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  const avg = average(values);
  const variance = average(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function toRiskLabel(value: number, lowThreshold: number, highThreshold: number): 'low' | 'medium' | 'high' {
  if (value >= highThreshold) {
    return 'high';
  }

  if (value >= lowThreshold) {
    return 'medium';
  }

  return 'low';
}

function isStablecoinLike(coin: MarketCoinSnapshot) {
  const lowerName = coin.name.toLowerCase();
  const closeToFiatPeg = coin.currentPrice >= 0.85 && coin.currentPrice <= 1.15;

  return (
    STABLECOIN_IDS.has(coin.id) ||
    STABLECOIN_TICKERS.has(coin.ticker) ||
    (closeToFiatPeg &&
      (/stablecoin|dollar/.test(lowerName) || /\b(usd|eur|gbp)\b/.test(lowerName)))
  );
}

function formatCoinHeadlineLabel(coin: Pick<MarketCoinSnapshot, 'ticker' | 'name'>) {
  return coin.name.toUpperCase() === coin.ticker ? coin.ticker : `${coin.ticker} (${coin.name})`;
}

function createMarketResult(
  input: Omit<MarketTemplateData, 'kind' | 'currency' | 'generated_at'>,
): MarketTemplateData {
  return {
    kind: 'market',
    currency: 'USD',
    generated_at: toIsoDate(Date.now()),
    ...input,
  };
}

async function getMarketBreadthContext() {
  const coins = await fetchTopCoinsMarketData();
  const marketAverage24h = average(coins.map((coin) => coin.change24h));
  const btc = coins.find((coin) => coin.ticker === 'BTC');
  const alts = coins.filter((coin) => coin.ticker !== 'BTC');
  const altAverage24h = average(alts.map((coin) => coin.change24h));
  const dispersion24h = stddev(coins.map((coin) => coin.change24h));

  return {
    coins,
    marketAverage24h,
    btcChange24h: btc?.change24h ?? 0,
    altAverage24h,
    dispersion24h,
  };
}

async function getMarketCategoryContext() {
  const [breadth, categories] = await Promise.all([getMarketBreadthContext(), fetchCategorySnapshots()]);
  return {
    ...breadth,
    categories,
  };
}

function getTopMover(coins: MarketCoinSnapshot[]) {
  return [...coins].sort((a, b) => b.change24h - a.change24h)[0];
}

function getMostAnomalousCoin(coins: MarketCoinSnapshot[]) {
  return [...coins]
    .map((coin) => ({
      coin,
      score: Math.abs(coin.change24h) * (1 + coin.volumeToMarketCapRatio * 12),
    }))
    .sort((a, b) => b.score - a.score)[0];
}

async function buildMarketSnapshot() {
  const {coins, categories, marketAverage24h, btcChange24h, altAverage24h, dispersion24h} =
    await getMarketCategoryContext();
  const topCategory = [...categories].sort((a, b) => b.change24h - a.change24h)[0];
  const direction = marketAverage24h >= 0 ? 'up' : 'down';
  const breadth =
    coins.filter(
      (coin) => Math.sign(coin.change24h) === Math.sign(marketAverage24h) || coin.change24h === 0,
    ).length / coins.length;

  const narrative_text = await generateMarketSnapshotNarrative({
    marketAverage24h,
    btcChange24h,
    altAverage24h,
    breadthRatio: breadth,
    topCategory: topCategory?.name ?? null,
    topCategoryChange24h: topCategory?.change24h ?? 0,
  });

  return createMarketResult({
    asset: 'CRYPTO_MARKET',
    assetName: 'Crypto Market',
    template: 'MARKET_SNAPSHOT',
    headline: `Crypto market is ${direction} ${formatPercent(Math.abs(marketAverage24h)).replace('+', '')} in the last 24h`,
    supporting_stats: [
      {label: 'Top 50 average', value: formatPercent(average(coins.slice(0, 50).map((coin) => coin.change24h)))},
      {label: 'BTC vs alt proxy', value: `${formatPercent(btcChange24h)} vs ${formatPercent(altAverage24h)}`},
      {label: 'Top category', value: `${topCategory?.name ?? 'N/A'} ${formatPercent(topCategory?.change24h ?? 0)}`},
    ],
    narrative_text,
    confidence: Number(clamp(0.45 + breadth * 0.4, 0, 1).toFixed(2)),
    risk_label: toRiskLabel(dispersion24h, 3, 5.5),
    data_points: {
      market_average_24h: Number(marketAverage24h.toFixed(2)),
      btc_change_24h: Number(btcChange24h.toFixed(2)),
      alt_average_24h: Number(altAverage24h.toFixed(2)),
      breadth_ratio: Number(breadth.toFixed(2)),
      top_category: topCategory?.name ?? null,
      top_category_change_24h: Number((topCategory?.change24h ?? 0).toFixed(2)),
      top_50_count: Math.min(50, coins.length),
      stale_valid_count: coins.length,
    },
  });
}

async function buildNarrativeDetector() {
  const {categories, marketAverage24h, dispersion24h} = await getMarketCategoryContext();
  const ranked = [...categories].sort((a, b) => b.change24h - a.change24h);
  const strongest = ranked[0];
  const relativeStrength = (strongest?.change24h ?? 0) - marketAverage24h;
  const confidence = clamp(0.4 + Math.min(Math.abs(relativeStrength) / 12, 0.45), 0, 1);

  return createMarketResult({
    asset: 'CRYPTO_MARKET',
    assetName: 'Crypto Market',
    template: 'NARRATIVE_DETECTOR',
    headline: `${strongest?.name ?? 'Leading'} category outperforming the crypto market`,
    supporting_stats: [
      {label: 'Category move', value: formatPercent(strongest?.change24h ?? 0)},
      {label: 'Market average', value: formatPercent(marketAverage24h)},
      {label: 'Relative strength', value: formatPercent(relativeStrength)},
    ],
    narrative_text: await generateNarrativeDetectorNarrative({
      strongestCategory: strongest?.name ?? null,
      strongestCategoryChange24h: strongest?.change24h ?? 0,
      marketAverage24h,
      relativeStrength24h: relativeStrength,
      activeNarrative: selectNarrativeContext({
        exhaustion: 'none',
        accumulation: 'volume_without_bias',
        anomaly: Math.abs(relativeStrength) > 15 ? 'extreme_anomaly' : Math.abs(relativeStrength) > 8 ? 'moderate_anomaly' : 'normal',
        divergence: Math.abs(relativeStrength) > 8 ? 'sector_outperformance' : 'no_divergence',
        pattern: (strongest?.change24h ?? 0) > 0 ? 'momentum_expansion' : 'no_clear_pattern',
      }),
    }),
    confidence: Number(confidence.toFixed(2)),
    risk_label: toRiskLabel(Math.abs(relativeStrength) + dispersion24h, 5, 9),
    data_points: {
      strongest_category: strongest?.name ?? null,
      strongest_category_change_24h: Number((strongest?.change24h ?? 0).toFixed(2)),
      market_average_24h: Number(marketAverage24h.toFixed(2)),
      relative_strength_24h: Number(relativeStrength.toFixed(2)),
      strongest_category_market_cap: strongest?.marketCap ?? null,
      ranked_categories_sample: ranked.slice(0, 5).map((category) => ({
        name: category.name,
        change_24h: Number(category.change24h.toFixed(2)),
      })),
    },
  });
}

async function buildAnomalyDetector() {
  const {coins, dispersion24h} = await getMarketBreadthContext();
  const anomaly = getMostAnomalousCoin(coins);
  const topMover = getTopMover(coins);
  const target = anomaly?.coin ?? topMover;
  const score = anomaly?.score ?? 0;
  const confidence = clamp(0.42 + Math.min(score / 35, 0.5), 0, 1);

  return createMarketResult({
    asset: target?.ticker ?? 'CRYPTO_MARKET',
    assetName: target?.name ? `${target.name} / Crypto Market` : 'Crypto Market',
    template: 'ANOMALY_DETECTOR',
    headline: `Unusual crypto market activity detected in ${target?.ticker ?? 'the market leader'}`,
    supporting_stats: [
      {label: '24h move', value: formatPercent(target?.change24h ?? 0)},
      {label: '7d move', value: formatPercent(target?.change7d ?? 0)},
      {
        label: 'Volume / market cap',
        value: `${((target?.volumeToMarketCapRatio ?? 0) * 100).toFixed(2)}%`,
      },
    ],
    narrative_text: await generateAnomalyDetectorNarrative({
      coinName: target?.name ?? null,
      change24h: target?.change24h ?? 0,
      change7d: target?.change7d ?? 0,
      volumeToMarketCapRatio: target?.volumeToMarketCapRatio ?? 0,
    }),
    confidence: Number(confidence.toFixed(2)),
    risk_label: toRiskLabel(
      Math.abs(target?.change24h ?? 0) + (target?.volumeToMarketCapRatio ?? 0) * 100 + dispersion24h,
      12,
      20,
    ),
    data_points: {
      coin: target?.ticker ?? null,
      change_24h: Number((target?.change24h ?? 0).toFixed(2)),
      change_7d: Number((target?.change7d ?? 0).toFixed(2)),
      volume_to_market_cap_ratio: Number((target?.volumeToMarketCapRatio ?? 0).toFixed(4)),
      total_volume: target?.totalVolume ?? null,
      market_cap: target?.marketCap ?? null,
      anomaly_score: Number(score.toFixed(2)),
    },
  });
}

async function buildVolatilityRegime() {
  const {coins, marketAverage24h, dispersion24h} = await getMarketBreadthContext();
  const absoluteAverageMove = average(coins.map((coin) => Math.abs(coin.change24h)));
  const volatilityLabel = toRiskLabel(dispersion24h, 2.5, 5);
  const phase = volatilityLabel === 'high' ? 'high' : volatilityLabel === 'low' ? 'low' : 'medium';
  const confidence = clamp(0.5 + Math.min(Math.abs(dispersion24h - 3.5) / 4, 0.4), 0, 1);

  return createMarketResult({
    asset: 'CRYPTO_MARKET',
    assetName: 'Crypto Market',
    template: 'VOLATILITY_REGIME',
    headline: `Crypto market entering ${phase} volatility phase`,
    supporting_stats: [
      {label: '24h dispersion', value: dispersion24h.toFixed(2)},
      {label: 'Average absolute move', value: formatPercent(absoluteAverageMove)},
      {label: 'Market average', value: formatPercent(marketAverage24h)},
    ],
    narrative_text: await generateVolatilityRegimeNarrative({
      dispersion24h,
      absoluteAverageMove,
      marketAverage24h,
      volatilityLabel,
    }),
    confidence: Number(confidence.toFixed(2)),
    risk_label: volatilityLabel,
    data_points: {
      standard_deviation_24h: Number(dispersion24h.toFixed(2)),
      average_absolute_change_24h: Number(absoluteAverageMove.toFixed(2)),
      market_average_24h: Number(marketAverage24h.toFixed(2)),
      sample_size: coins.length,
    },
  });
}

function findPatternCases(prices: Array<{price: number; date: string}>, thresholdPercent: number) {
  const cases: Array<{date: string; spikePercent: number; forward7dReturn: number}> = [];

  for (let index = 1; index < prices.length - 7; index += 1) {
    const previous = prices[index - 1];
    const current = prices[index];
    const forward = prices[index + 7];
    const spikePercent = ((current.price - previous.price) / previous.price) * 100;

    if (spikePercent >= thresholdPercent) {
      const forward7dReturn = ((forward.price - current.price) / current.price) * 100;
      cases.push({
        date: current.date,
        spikePercent,
        forward7dReturn,
      });
    }
  }

  return cases;
}

async function buildPatternMatch() {
  const coins = await fetchTopCoinsMarketData();
  const candidates = [...coins]
    .filter((coin) => coin.change24h > 0)
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, 2);

  const histories = await Promise.all(candidates.map((coin) => fetchCoinMarketChart(coin.id, 90)));
  const patternResults = candidates.map((coin, index) => {
    const threshold = Math.max(8, Math.min(coin.change24h * 0.8, 18));
    const cases = findPatternCases(histories[index], threshold);
    return {
      coin,
      threshold,
      cases,
      averageForward7d: average(cases.map((item) => item.forward7dReturn)),
    };
  });

  const bestMatch = [...patternResults].sort(
    (a, b) =>
      b.cases.length - a.cases.length ||
      Math.abs(b.averageForward7d) - Math.abs(a.averageForward7d),
  )[0];
  const similarCases = bestMatch?.cases.length ?? 0;
  const averageOutcome = bestMatch?.averageForward7d ?? 0;
  const confidence = clamp(0.35 + Math.min(similarCases / 10, 0.55), 0, 1);
  return createMarketResult({
    asset: bestMatch?.coin.ticker ?? 'CRYPTO_MARKET',
    assetName: bestMatch?.coin.name ? `${bestMatch.coin.name} / Crypto Market` : 'Crypto Market',
    template: 'PATTERN_MATCH',
    headline: 'Current crypto market move resembles past patterns',
    supporting_stats: [
      {label: 'Focus asset', value: bestMatch?.coin.ticker ?? 'N/A'},
      {label: 'Similar cases', value: String(similarCases)},
      {label: 'Avg 7d outcome', value: formatPercent(averageOutcome)},
    ],
    narrative_text: await generatePatternMatchNarrative({
      coinName: bestMatch?.coin.name ?? null,
      currentChange24h: bestMatch?.coin.change24h ?? 0,
      volumeToMarketCapRatio: bestMatch?.coin.volumeToMarketCapRatio ?? 0,
      similarCases,
      averageForward7d: averageOutcome,
    }),
    confidence: Number(confidence.toFixed(2)),
    risk_label: toRiskLabel(Math.abs(bestMatch?.coin.change24h ?? 0) + Math.abs(averageOutcome), 10, 18),
    data_points: {
      focus_coin: bestMatch?.coin.ticker ?? null,
      current_change_24h: Number((bestMatch?.coin.change24h ?? 0).toFixed(2)),
      pattern_threshold_percent: Number((bestMatch?.threshold ?? 0).toFixed(2)),
      similar_cases: similarCases,
      average_forward_7d_return: Number(averageOutcome.toFixed(2)),
      sample_coins: patternResults.map((result) => ({
        coin: result.coin.ticker,
        current_change_24h: Number(result.coin.change24h.toFixed(2)),
        similar_cases: result.cases.length,
        average_forward_7d_return: Number(result.averageForward7d.toFixed(2)),
      })),
    },
  });
}

async function createSilentAccumulationSignals(coins: MarketCoinSnapshot[]): Promise<SilentAccumulationSignal[]> {
  const filtered = coins.filter(
    (coin) =>
      !isStablecoinLike(coin) &&
      coin.totalVolume > 1_000_000 &&
      Math.abs(coin.change24h) <= 2 &&
      coin.marketCap > 0,
  );
  const avgRatio = average(filtered.map((coin) => coin.volumeToMarketCapRatio));
  const candidates = filtered
    .filter((coin) => coin.volumeToMarketCapRatio > avgRatio * 1.5)
    .sort((a, b) => b.volumeToMarketCapRatio - a.volumeToMarketCapRatio)
    .slice(0, 2);

  return Promise.all(
    candidates.map(async (coin) => {
      const signalStrength = coin.volumeToMarketCapRatio / Math.max(avgRatio, 0.000001);
      const confidence = clamp(0.6 + Math.min((signalStrength - 1.5) * 0.08, 0.15), 0.6, 0.75);

      return {
        type: 'silent_accumulation',
        headline: `Unusual accumulation detected in ${formatCoinHeadlineLabel(coin)}`,
        narrative: await generateSilentAccumulationNarrative({
          coinName: coin.name,
          change24h: coin.change24h,
          change7d: coin.change7d,
          volumeRatio: coin.volumeToMarketCapRatio,
          signalThreshold: avgRatio * 1.5,
        }),
        confidence: Number(confidence.toFixed(2)),
        risk_label: 'medium',
        coin: {
          ticker: coin.ticker,
          name: coin.name,
        },
        data_points: {
          coin_id: coin.id,
          coin_ticker: coin.ticker,
          coin_name: coin.name,
          price_change_24h: Number(coin.change24h.toFixed(2)),
          volume_ratio: Number(coin.volumeToMarketCapRatio.toFixed(4)),
          volume_usd: Math.round(coin.totalVolume),
          total_volume: Math.round(coin.totalVolume),
          market_cap: Math.round(coin.marketCap),
          signal_value: Number(coin.volumeToMarketCapRatio.toFixed(4)),
          signal_threshold: Number((avgRatio * 1.5).toFixed(4)),
        },
      } satisfies SilentAccumulationSignal;
    }),
  );
}

async function createExhaustionMoveSignals(coins: MarketCoinSnapshot[]): Promise<ExhaustionMoveSignal[]> {
  const anomalyCoins = coins.filter((coin) => !isStablecoinLike(coin));
  const averageVolume = average(anomalyCoins.map((coin) => coin.totalVolume));
  const candidates = anomalyCoins
    .filter((coin) => coin.change7d >= 20 && Math.abs(coin.change24h) <= 2)
    .map((coin) => {
      const volumePenalty =
        coin.totalVolume > averageVolume * 1.5
          ? Math.min(((coin.totalVolume / Math.max(averageVolume, 1)) - 1.5) * 4, 8)
          : 0;
      return {coin, score: coin.change7d - volumePenalty};
    })
    .sort((a, b) => b.score - a.score || b.coin.change7d - a.coin.change7d)
    .slice(0, 2);

  return Promise.all(
    candidates.map(async ({coin, score}) => {
      const confidence = clamp(0.65 + Math.min((score - 20) / 80, 0.15), 0.65, 0.8);

      return {
        type: 'exhaustion_move',
        headline: `Momentum slowing after strong move in ${formatCoinHeadlineLabel(coin)}`,
        narrative: await generateExhaustionMoveNarrative({
          coinName: coin.name,
          change7d: coin.change7d,
          change24h: coin.change24h,
          volumeToMarketCapRatio: coin.volumeToMarketCapRatio,
        }),
        confidence: Number(confidence.toFixed(2)),
        risk_label: 'high',
        coin: {
          ticker: coin.ticker,
          name: coin.name,
        },
        data_points: {
          coin_id: coin.id,
          coin_ticker: coin.ticker,
          coin_name: coin.name,
          price_change_7d: Number(coin.change7d.toFixed(2)),
          price_change_24h: Number(coin.change24h.toFixed(2)),
          total_volume: Math.round(coin.totalVolume),
          market_cap: Math.round(coin.marketCap),
          signal_value: Number(coin.change7d.toFixed(2)),
          signal_threshold: 20,
        },
      } satisfies ExhaustionMoveSignal;
    }),
  );
}

async function createDivergenceSignals(coins: MarketCoinSnapshot[]): Promise<DivergenceSignal[]> {
  const anomalyCoins = coins.filter((coin) => !isStablecoinLike(coin));
  const btcChange24h = coins.find((coin) => coin.ticker === 'BTC')?.change24h ?? 0;
  const altAverage24h = average(anomalyCoins.filter((coin) => coin.ticker !== 'BTC').map((coin) => coin.change24h));
  const topCategoryChange24h = [...anomalyCoins].sort((a, b) => b.change24h - a.change24h)[0]?.change24h ?? 0;
  const top50 = anomalyCoins.slice(0, 50);
  const top50Sum = top50.reduce((sum, coin) => sum + coin.change24h, 0);
  const candidates = anomalyCoins
    .map((coin) => {
      const isInTop50 = top50.some((entry) => entry.id === coin.id);
      const divisor = isInTop50 ? Math.max(top50.length - 1, 1) : Math.max(top50.length, 1);
      const baseline = isInTop50 ? (top50Sum - coin.change24h) / divisor : top50Sum / divisor;
      const divergence = coin.change24h - baseline;
      return {coin, baseline, divergence};
    })
    .filter((entry) => Math.abs(entry.divergence) >= 8)
    .sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence))
    .slice(0, 2);

  return Promise.all(
    candidates.map(async ({coin, baseline, divergence}) => {
      const confidence = clamp(0.6 + Math.min((Math.abs(divergence) - 8) / 32, 0.15), 0.6, 0.75);

      return {
        type: 'divergence',
        headline: `${formatCoinHeadlineLabel(coin)} diverging from broader market`,
        narrative: await generateDivergenceNarrative({
          coinName: coin.name,
          change24h: coin.change24h,
          marketAvg24h: baseline,
          divergence,
          btcChange24h,
          altAverage24h,
          topCategoryChange24h,
        }),
        confidence: Number(confidence.toFixed(2)),
        risk_label: 'medium',
        coin: {
          ticker: coin.ticker,
          name: coin.name,
        },
        data_points: {
          coin_id: coin.id,
          coin_ticker: coin.ticker,
          coin_name: coin.name,
          coin_change_24h: Number(coin.change24h.toFixed(2)),
          market_avg_24h: Number(baseline.toFixed(2)),
          divergence: Number(divergence.toFixed(2)),
          total_volume: Math.round(coin.totalVolume),
          market_cap: Math.round(coin.marketCap),
          signal_value: Number(Math.abs(divergence).toFixed(2)),
          signal_threshold: 8,
        },
      } satisfies DivergenceSignal;
    }),
  );
}

export async function generateAnomalySignals() {
  const coins = await fetchTopCoinsMarketData();
  const [silent, exhaustion, divergence] = await Promise.all([
    createSilentAccumulationSignals(coins),
    createExhaustionMoveSignals(coins),
    createDivergenceSignals(coins),
  ]);

  return {
    videos: [...silent, ...exhaustion, ...divergence] satisfies AnomalySignal[],
  };
}

function mapSignalToMarketItem(
  template: 'SILENT_ACCUMULATION' | 'EXHAUSTION_MOVE' | 'DIVERGENCE_DETECTOR',
  signal: AnomalySignal,
): MarketTemplateData {
  const supportingStats =
    template === 'SILENT_ACCUMULATION'
      ? [
          {label: '24h change', value: formatPercent(Number(signal.data_points.price_change_24h ?? 0))},
          {label: 'Volume ratio', value: String(signal.data_points.volume_ratio ?? '0')},
          {label: '24h volume', value: `$${Number(signal.data_points.volume_usd ?? 0).toLocaleString('en-US')}`},
        ]
      : template === 'EXHAUSTION_MOVE'
        ? [
            {label: '7d move', value: formatPercent(Number(signal.data_points.price_change_7d ?? 0))},
            {label: '24h move', value: formatPercent(Number(signal.data_points.price_change_24h ?? 0))},
          ]
        : [
            {label: 'Coin move', value: formatPercent(Number(signal.data_points.coin_change_24h ?? 0))},
            {label: 'Market average', value: formatPercent(Number(signal.data_points.market_avg_24h ?? 0))},
            {label: 'Divergence', value: formatPercent(Number(signal.data_points.divergence ?? 0))},
          ];

  return createMarketResult({
    asset: signal.coin?.ticker ?? 'CRYPTO_MARKET',
    assetName: signal.coin?.name ? `${signal.coin.name} / Crypto Market` : 'Crypto Market',
    template,
    headline: signal.headline,
    supporting_stats: supportingStats,
    narrative_text: signal.narrative,
    confidence: signal.confidence,
    risk_label: signal.risk_label,
    data_points: signal.data_points,
    signal_metadata: signal.coin
      ? {
          type: signal.type,
          coinId:
            signal.type === 'silent_accumulation' || signal.type === 'exhaustion_move' || signal.type === 'divergence'
              ? String(signal.data_points.coin_id ?? '')
              : '',
          coinTicker: signal.coin.ticker,
          coinName: signal.coin.name,
        }
      : undefined,
  });
}

function getSignalsForTemplate(
  template: 'SILENT_ACCUMULATION' | 'EXHAUSTION_MOVE' | 'DIVERGENCE_DETECTOR',
  signals: AnomalySignal[],
) {
  const targetType =
    template === 'SILENT_ACCUMULATION'
      ? 'silent_accumulation'
      : template === 'EXHAUSTION_MOVE'
        ? 'exhaustion_move'
        : 'divergence';

  return signals.filter((signal) => signal.type === targetType);
}

async function buildAnomalyTemplateItems(
  template: 'SILENT_ACCUMULATION' | 'EXHAUSTION_MOVE' | 'DIVERGENCE_DETECTOR',
) {
  const {videos} = await generateAnomalySignals();
  const templateSignals = getSignalsForTemplate(template, videos);

  if (!templateSignals.length) {
    const readableName = template.toLowerCase().replaceAll('_', ' ');
    throw new Error(`No crypto market signals met the ${readableName} thresholds clearly enough.`);
  }

  return templateSignals.map((signal) => mapSignalToMarketItem(template, signal));
}

export async function generateMarketTemplateItems(template: MarketTemplateId): Promise<MarketTemplateData[]> {
  switch (template) {
    case 'MARKET_SNAPSHOT':
      return [await buildMarketSnapshot()];
    case 'NARRATIVE_DETECTOR':
      return [await buildNarrativeDetector()];
    case 'ANOMALY_DETECTOR':
      return [await buildAnomalyDetector()];
    case 'VOLATILITY_REGIME':
      return [await buildVolatilityRegime()];
    case 'PATTERN_MATCH':
      return [await buildPatternMatch()];
    case 'SILENT_ACCUMULATION':
      return buildAnomalyTemplateItems('SILENT_ACCUMULATION');
    case 'EXHAUSTION_MOVE':
      return buildAnomalyTemplateItems('EXHAUSTION_MOVE');
    case 'DIVERGENCE_DETECTOR':
      return buildAnomalyTemplateItems('DIVERGENCE_DETECTOR');
    default:
      throw new Error(`Unsupported market template: ${template satisfies never}`);
  }
}

export async function generateMarketTemplateData(template: MarketTemplateId): Promise<MarketTemplateData> {
  const items = await generateMarketTemplateItems(template);
  return items[0];
}
