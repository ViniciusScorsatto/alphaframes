import {fetchCategorySnapshots, fetchCoinMarketChart, fetchTopCoinsMarketData} from '@/data/coingecko-market';
import {clamp, formatCurrency, formatPercent, toIsoDate} from '@/lib/utils';
import type {MarketCoinSnapshot} from '@/data/coingecko-market';
import type {MarketTemplateData, MarketTemplateId} from '@/types';

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

function createMarketResult(input: Omit<MarketTemplateData, 'kind' | 'asset' | 'assetName' | 'currency' | 'generated_at'>): MarketTemplateData {
  return {
    kind: 'market',
    asset: 'CRYPTO_MARKET',
    assetName: 'Crypto Market',
    currency: 'USD',
    generated_at: toIsoDate(Date.now()),
    ...input,
  };
}

async function getSharedMarketContext() {
  const [coins, categories] = await Promise.all([fetchTopCoinsMarketData(), fetchCategorySnapshots()]);
  const marketAverage24h = average(coins.map((coin) => coin.change24h));
  const btc = coins.find((coin) => coin.ticker === 'BTC');
  const alts = coins.filter((coin) => coin.ticker !== 'BTC');
  const altAverage24h = average(alts.map((coin) => coin.change24h));
  const dispersion24h = stddev(coins.map((coin) => coin.change24h));

  return {
    coins,
    categories,
    marketAverage24h,
    btcChange24h: btc?.change24h ?? 0,
    altAverage24h,
    dispersion24h,
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
  const {coins, categories, marketAverage24h, btcChange24h, altAverage24h, dispersion24h} = await getSharedMarketContext();
  const topCategory = [...categories].sort((a, b) => b.change24h - a.change24h)[0];
  const direction = marketAverage24h >= 0 ? 'up' : 'down';
  const breadth = coins.filter((coin) => Math.sign(coin.change24h) === Math.sign(marketAverage24h) || coin.change24h === 0).length / coins.length;

  return createMarketResult({
    template: 'MARKET_SNAPSHOT',
    headline: `Crypto market is ${direction} ${formatPercent(Math.abs(marketAverage24h)).replace('+', '')} in the last 24h`,
    supporting_stats: [
      {label: 'Top 50 average', value: formatPercent(marketAverage24h)},
      {label: 'BTC vs alt proxy', value: `${formatPercent(btcChange24h)} vs ${formatPercent(altAverage24h)}`},
      {label: 'Top category', value: `${topCategory?.name ?? 'N/A'} ${formatPercent(topCategory?.change24h ?? 0)}`},
    ],
    narrative_text:
      marketAverage24h >= 0
        ? `Crypto market breadth is leaning positive, with BTC ${btcChange24h >= altAverage24h ? 'holding up better than the alt proxy' : 'lagging the alt proxy'} and ${topCategory?.name ?? 'the leading category'} setting the pace.`
        : `Crypto market breadth is leaning negative, with BTC ${btcChange24h >= altAverage24h ? 'holding up better than the alt proxy' : 'dragging against the alt proxy'} while ${topCategory?.name ?? 'the leading category'} still shows the strongest relative resilience.`,
    confidence: Number(clamp(0.45 + breadth * 0.4, 0, 1).toFixed(2)),
    risk_label: toRiskLabel(dispersion24h, 3, 5.5),
    data_points: {
      market_average_24h: Number(marketAverage24h.toFixed(2)),
      btc_change_24h: Number(btcChange24h.toFixed(2)),
      alt_average_24h: Number(altAverage24h.toFixed(2)),
      breadth_ratio: Number(breadth.toFixed(2)),
      top_category: topCategory?.name ?? null,
      top_category_change_24h: Number((topCategory?.change24h ?? 0).toFixed(2)),
      top_50_count: coins.length,
    },
  });
}

async function buildNarrativeDetector() {
  const {categories, marketAverage24h, dispersion24h} = await getSharedMarketContext();
  const ranked = [...categories].sort((a, b) => b.change24h - a.change24h);
  const strongest = ranked[0];
  const relativeStrength = (strongest?.change24h ?? 0) - marketAverage24h;
  const confidence = clamp(0.4 + Math.min(Math.abs(relativeStrength) / 12, 0.45), 0, 1);

  return createMarketResult({
    template: 'NARRATIVE_DETECTOR',
    headline: `${strongest?.name ?? 'Leading'} category outperforming the crypto market`,
    supporting_stats: [
      {label: 'Category move', value: formatPercent(strongest?.change24h ?? 0)},
      {label: 'Market average', value: formatPercent(marketAverage24h)},
      {label: 'Relative strength', value: formatPercent(relativeStrength)},
    ],
    narrative_text: `This suggests capital rotation into ${strongest?.name ?? 'the leading category'}, with that group moving ${formatPercent(relativeStrength)} ahead of the broader crypto market average.`,
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
  const {coins, dispersion24h} = await getSharedMarketContext();
  const anomaly = getMostAnomalousCoin(coins);
  const topMover = getTopMover(coins);
  const target = anomaly?.coin ?? topMover;
  const score = anomaly?.score ?? 0;
  const confidence = clamp(0.42 + Math.min(score / 35, 0.5), 0, 1);

  return createMarketResult({
    template: 'ANOMALY_DETECTOR',
    headline: `Unusual crypto market activity detected in ${target?.ticker ?? 'the market leader'}`,
    supporting_stats: [
      {label: '24h move', value: formatPercent(target?.change24h ?? 0)},
      {label: '7d move', value: formatPercent(target?.change7d ?? 0)},
      {label: 'Volume / market cap', value: `${((target?.volumeToMarketCapRatio ?? 0) * 100).toFixed(2)}%`},
    ],
    narrative_text: `${target?.name ?? 'This asset'} is showing price and volume expansion together inside the crypto market, which often marks a momentum-heavy phase rather than a quiet rotation.`,
    confidence: Number(confidence.toFixed(2)),
    risk_label: toRiskLabel(Math.abs(target?.change24h ?? 0) + (target?.volumeToMarketCapRatio ?? 0) * 100 + dispersion24h, 12, 20),
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
  const {coins, marketAverage24h, dispersion24h} = await getSharedMarketContext();
  const absoluteAverageMove = average(coins.map((coin) => Math.abs(coin.change24h)));
  const volatilityLabel = toRiskLabel(dispersion24h, 2.5, 5);
  const phase = volatilityLabel === 'high' ? 'high' : volatilityLabel === 'low' ? 'low' : 'medium';
  const confidence = clamp(0.5 + Math.min(Math.abs(dispersion24h - 3.5) / 4, 0.4), 0, 1);

  return createMarketResult({
    template: 'VOLATILITY_REGIME',
    headline: `Crypto market entering ${phase} volatility phase`,
    supporting_stats: [
      {label: '24h dispersion', value: dispersion24h.toFixed(2)},
      {label: 'Average absolute move', value: formatPercent(absoluteAverageMove)},
      {label: 'Market average', value: formatPercent(marketAverage24h)},
    ],
    narrative_text:
      volatilityLabel === 'high'
        ? 'Similar conditions historically line up with unstable price swings and fast narrative rotation.'
        : volatilityLabel === 'low'
          ? 'Similar conditions historically line up with quieter price action and slower rotation between majors and alts.'
          : 'The current tape is active but not fully unstable, which often keeps direction changes quick and selective.',
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

  const bestMatch =
    [...patternResults].sort((a, b) => b.cases.length - a.cases.length || Math.abs(b.averageForward7d) - Math.abs(a.averageForward7d))[0];
  const similarCases = bestMatch?.cases.length ?? 0;
  const averageOutcome = bestMatch?.averageForward7d ?? 0;
  const confidence = clamp(0.35 + Math.min(similarCases / 10, 0.55), 0, 1);
  const narrativeTail =
    averageOutcome >= 0
      ? `Across ${similarCases} similar spikes, the average 7-day follow-through stayed positive at ${formatPercent(averageOutcome)}.`
      : `Across ${similarCases} similar spikes, the average 7-day follow-through faded by ${formatPercent(Math.abs(averageOutcome)).replace('+', '')}.`;

  return createMarketResult({
    template: 'PATTERN_MATCH',
    headline: 'Current crypto market move resembles past patterns',
    supporting_stats: [
      {label: 'Focus asset', value: bestMatch?.coin.ticker ?? 'N/A'},
      {label: 'Similar cases', value: String(similarCases)},
      {label: 'Avg 7d outcome', value: formatPercent(averageOutcome)},
    ],
    narrative_text:
      similarCases > 0
        ? `${bestMatch?.coin.name ?? 'This move'} is echoing earlier spike behaviour in its own history. ${narrativeTail}`
        : `${bestMatch?.coin.name ?? 'The current move'} is strong, but recent CoinGecko history does not show enough matching spikes to form a reliable pattern read yet.`,
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

export async function generateMarketTemplateData(template: MarketTemplateId): Promise<MarketTemplateData> {
  switch (template) {
    case 'MARKET_SNAPSHOT':
      return buildMarketSnapshot();
    case 'NARRATIVE_DETECTOR':
      return buildNarrativeDetector();
    case 'ANOMALY_DETECTOR':
      return buildAnomalyDetector();
    case 'VOLATILITY_REGIME':
      return buildVolatilityRegime();
    case 'PATTERN_MATCH':
      return buildPatternMatch();
    default:
      throw new Error(`Unsupported market template: ${template satisfies never}`);
  }
}
