import type {MarketSignalDatasetCoin, MarketSignalQuality, MarketTemplateData} from '@/types';

const SIGNAL_LOG_KEY = 'signal_log';
const SIGNAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const VOLUME_FLOOR = 1_000_000;

interface SignalLogEntry {
  type: string;
  coinId: string;
  timestamp: number;
}

function clampScore(value: number): 0 | 1 | 2 {
  if (value >= 2) {
    return 2;
  }

  if (value >= 1) {
    return 1;
  }

  return 0;
}

function getLabel(total: number): MarketSignalQuality['label'] {
  if (total >= 6) {
    return 'Post';
  }

  if (total >= 3) {
    return 'Review';
  }

  return 'Skip';
}

function getColor(label: MarketSignalQuality['label']): MarketSignalQuality['color'] {
  if (label === 'Post') {
    return 'green';
  }

  if (label === 'Review') {
    return 'amber';
  }

  return 'red';
}

function describeThresholdDistance(score: 0 | 1 | 2, value: number, threshold: number) {
  const ratio = threshold > 0 ? value / threshold : 0;
  const ratioText = `${ratio.toFixed(2)}x`;

  if (score === 2) {
    return `${ratioText} above threshold - very clear`;
  }

  if (score === 1) {
    return `${ratioText} above threshold - decent clearance`;
  }

  return `${ratioText} above threshold - borderline pass`;
}

function describeMarketCapTier(score: 0 | 1 | 2, ticker: string, marketCap: number, isTop10: boolean) {
  const marketCapText = `$${Math.round(marketCap / 1_000_000).toLocaleString('en-US')}M cap`;

  if (score === 2) {
    return `${ticker} ${marketCapText} - mid-cap sweet spot`;
  }

  if (score === 1) {
    return `${ticker} ${marketCapText} - large-cap but usable`;
  }

  return isTop10 ? `${ticker} is top-10 - structural noise risk` : `${ticker} ${marketCapText} - small-cap noise risk`;
}

function describeRepeatTrigger(score: 0 | 1 | 2, priorCount: number) {
  if (score === 2) {
    return 'First trigger in 7 days';
  }

  if (score === 1) {
    return 'Second trigger in 7 days';
  }

  return `${priorCount + 1} triggers in 7 days`;
}

function describeVolumeFloor(score: 0 | 1 | 2, totalVolume: number) {
  const volumeText = `$${Math.round(totalVolume / 1_000_000).toLocaleString('en-US')}M volume`;

  if (score === 2) {
    return `${volumeText} - well above floor`;
  }

  if (score === 1) {
    return `${volumeText} - comfortably above floor`;
  }

  return `${volumeText} - barely above floor`;
}

function parseSignalLog() {
  if (typeof window === 'undefined') {
    return [] as SignalLogEntry[];
  }

  const raw = window.localStorage.getItem(SIGNAL_LOG_KEY);
  if (!raw) {
    return [] as SignalLogEntry[];
  }

  try {
    const parsed = JSON.parse(raw) as SignalLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as SignalLogEntry[];
  }
}

export function readSignalLog() {
  const cutoff = Date.now() - SIGNAL_WINDOW_MS;
  const pruned = parseSignalLog().filter(
    (entry) =>
      typeof entry?.type === 'string' &&
      typeof entry?.coinId === 'string' &&
      typeof entry?.timestamp === 'number' &&
      entry.timestamp >= cutoff,
  );

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SIGNAL_LOG_KEY, JSON.stringify(pruned));
  }

  return pruned;
}

export function appendSignalLog(entries: Array<{type: string; coinId: string}>) {
  if (typeof window === 'undefined' || !entries.length) {
    return;
  }

  const timestamp = Date.now();
  const current = readSignalLog();
  const next = [
    ...current,
    ...entries.map((entry) => ({
      ...entry,
      timestamp,
    })),
  ];

  window.localStorage.setItem(SIGNAL_LOG_KEY, JSON.stringify(next));
}

export function scoreSignal(signal: MarketTemplateData, dataset: MarketSignalDatasetCoin[]): MarketSignalQuality {
  if (!signal.signal_metadata) {
    throw new Error('Signal metadata is required for anomaly scoring.');
  }

  const coin = dataset.find((entry) => entry.id === signal.signal_metadata?.coinId);

  if (!coin) {
    throw new Error(`Unable to score ${signal.signal_metadata.coinTicker}: dataset coin not found.`);
  }

  const threshold =
    signal.signal_metadata.type === 'silent_accumulation'
      ? Number(signal.data_points.signal_threshold ?? 0)
      : signal.signal_metadata.type === 'exhaustion_move'
        ? 20
        : 8;
  const signalValue =
    signal.signal_metadata.type === 'silent_accumulation'
      ? Number(signal.data_points.signal_value ?? signal.data_points.volume_ratio ?? 0)
      : signal.signal_metadata.type === 'exhaustion_move'
        ? Number(signal.data_points.signal_value ?? signal.data_points.price_change_7d ?? 0)
        : Math.abs(Number(signal.data_points.signal_value ?? signal.data_points.divergence ?? 0));

  const thresholdDistance =
    signalValue > threshold * 2.5 ? 2 : signalValue > threshold * 1.75 ? 1 : 0;

  const top10Ids = new Set(
    [...dataset]
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 10)
      .map((entry) => entry.id),
  );
  const isTop10 = top10Ids.has(coin.id);
  const marketCapTier =
    isTop10 || coin.marketCap < 500_000_000 ? 0 : coin.marketCap <= 5_000_000_000 ? 2 : coin.marketCap <= 20_000_000_000 ? 1 : 0;

  const existingTriggers = readSignalLog().filter(
    (entry) => entry.type === signal.signal_metadata?.type && entry.coinId === signal.signal_metadata?.coinId,
  ).length;
  const repeatTrigger = existingTriggers === 0 ? 2 : existingTriggers === 1 ? 1 : 0;

  const volumeFloorMargin =
    coin.totalVolume > VOLUME_FLOOR * 5 ? 2 : coin.totalVolume > VOLUME_FLOOR * 2 ? 1 : 0;

  const factors = {
    thresholdDistance: clampScore(thresholdDistance),
    marketCapTier: clampScore(marketCapTier),
    repeatTrigger: clampScore(repeatTrigger),
    volumeFloorMargin: clampScore(volumeFloorMargin),
  };
  const total =
    factors.thresholdDistance + factors.marketCapTier + factors.repeatTrigger + factors.volumeFloorMargin;
  const label = getLabel(total);

  return {
    total,
    label,
    color: getColor(label),
    factors,
    reasons: [
      describeThresholdDistance(factors.thresholdDistance, signalValue, threshold),
      describeMarketCapTier(factors.marketCapTier, coin.ticker, coin.marketCap, isTop10),
      describeRepeatTrigger(factors.repeatTrigger, existingTriggers),
      describeVolumeFloor(factors.volumeFloorMargin, coin.totalVolume),
    ],
  };
}

export function scoreFallbackMarketSignal(signal: MarketTemplateData): MarketSignalQuality {
  if (signal.confidence >= 0.72) {
    return {
      total: 6,
      label: 'Post',
      color: 'green',
      factors: {
        thresholdDistance: 2,
        marketCapTier: 1,
        repeatTrigger: 2,
        volumeFloorMargin: 1,
      },
      reasons: [
        `Confidence ${Math.round(signal.confidence * 100)}% - strong read`,
        'Based on template confidence',
        'No anomaly-factor scoring here',
        'Ready for operator review',
      ],
    };
  }

  if (signal.confidence >= 0.56) {
    return {
      total: 4,
      label: 'Review',
      color: 'amber',
      factors: {
        thresholdDistance: 1,
        marketCapTier: 1,
        repeatTrigger: 1,
        volumeFloorMargin: 1,
      },
      reasons: [
        `Confidence ${Math.round(signal.confidence * 100)}% - moderate read`,
        'Based on template confidence',
        'No anomaly-factor scoring here',
        'Review before rendering',
      ],
    };
  }

  return {
    total: 2,
    label: 'Skip',
    color: 'red',
    factors: {
      thresholdDistance: 0,
      marketCapTier: 1,
      repeatTrigger: 0,
      volumeFloorMargin: 1,
    },
    reasons: [
      `Confidence ${Math.round(signal.confidence * 100)}% - soft read`,
      'Based on template confidence',
      'No anomaly-factor scoring here',
      'Low conviction for posting',
    ],
  };
}

export function scoreMarketItem(signal: MarketTemplateData, dataset?: MarketSignalDatasetCoin[]) {
  if (signal.signal_metadata && dataset?.length) {
    return scoreSignal(signal, dataset);
  }

  return scoreFallbackMarketSignal(signal);
}

export function getSignalRecommendation(label: MarketSignalQuality['label']) {
  if (label === 'Post') {
    return 'Signal is strong. Ready to render.';
  }

  if (label === 'Review') {
    return 'Review before rendering. See reasons above.';
  }

  return 'Signal too weak. Regenerate or choose a different template.';
}

export function getSignalBlocks(label: MarketSignalQuality['label']) {
  if (label === 'Post') {
    return 5;
  }

  if (label === 'Review') {
    return 3;
  }

  return 1;
}
