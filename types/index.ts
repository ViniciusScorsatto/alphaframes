export type AssetType = 'crypto' | 'stock' | 'etf';

export type TemplateId =
  | 'LAST_30_DAYS'
  | 'LAST_1_YEAR'
  | 'BEST_DAY_TO_BUY'
  | 'DCA_STRATEGY'
  | 'THEN_VS_NOW'
  | 'COMPARE_ASSETS'
  | 'MARKET_SNAPSHOT'
  | 'NARRATIVE_DETECTOR'
  | 'ANOMALY_DETECTOR'
  | 'VOLATILITY_REGIME'
  | 'PATTERN_MATCH'
  | 'SILENT_ACCUMULATION'
  | 'EXHAUSTION_MOVE'
  | 'DIVERGENCE_DETECTOR';

export type MarketTemplateId =
  | 'MARKET_SNAPSHOT'
  | 'NARRATIVE_DETECTOR'
  | 'ANOMALY_DETECTOR'
  | 'VOLATILITY_REGIME'
  | 'PATTERN_MATCH'
  | 'SILENT_ACCUMULATION'
  | 'EXHAUSTION_MOVE'
  | 'DIVERGENCE_DETECTOR';

export type LookbackWindow = 30 | 90 | 180 | 365 | 'max';
export type DcaCadence = 'weekly' | 'biweekly' | 'monthly';

export interface HistoricalPricePoint {
  date: string;
  timestamp: number;
  price: number;
}

export interface NormalizedAssetData {
  ticker: string;
  displayName: string;
  assetType: AssetType;
  currency: string;
  currentPrice: number;
  historical: HistoricalPricePoint[];
}

export interface GeneratedVideoData {
  kind: 'single';
  asset: string;
  assetType: AssetType;
  assetName: string;
  template: TemplateId;
  currency: string;
  investment: number;
  startDate: string;
  endDate: string;
  startPrice: number;
  currentPrice: number;
  return: number;
  valueToday: number;
  bestBuyDate?: string;
  bestBuyPrice?: number;
  sharesAccumulated?: number;
  hookLabel: string;
  contextLabel: string;
  resultLabel: string;
  timeline: HistoricalPricePoint[];
  insights: string[];
  analystNote?: string;
  voiceoverUrl?: string;
  voiceoverText?: string;
  voiceoverDurationFrames?: number;
}

export interface ComparisonTimelinePoint {
  date: string;
  timestamp: number;
  primaryValue: number;
  secondaryValue: number;
}

export interface ComparisonVideoData {
  kind: 'comparison';
  asset: string;
  assetName: string;
  template: TemplateId;
  investment: number;
  currency: string;
  startDate: string;
  endDate: string;
  hookLabel: string;
  contextLabel: string;
  resultLabel: string;
  insights: string[];
  analystNote?: string;
  voiceoverUrl?: string;
  voiceoverText?: string;
  voiceoverDurationFrames?: number;
  primaryAsset: {
    ticker: string;
    assetType: AssetType;
    name: string;
    startPrice: number;
    currentPrice: number;
    return: number;
    valueToday: number;
    color: string;
  };
  secondaryAsset: {
    ticker: string;
    assetType: AssetType;
    name: string;
    startPrice: number;
    currentPrice: number;
    return: number;
    valueToday: number;
    color: string;
  };
  winnerTicker: string;
  deltaReturn: number;
  comparisonTimeline: ComparisonTimelinePoint[];
}

export interface MarketTemplateData {
  kind: 'market';
  asset: string;
  assetName: string;
  template: MarketTemplateId;
  currency: 'USD';
  generated_at: string;
  headline: string;
  supporting_stats: Array<{
    label: string;
    value: string;
  }>;
  narrative_text: string;
  confidence: number;
  risk_label: 'low' | 'medium' | 'high';
  data_points: Record<string, unknown>;
  signal_metadata?: {
    type: 'silent_accumulation' | 'exhaustion_move' | 'divergence';
    coinId: string;
    coinTicker: string;
    coinName: string;
  };
  signal_quality?: MarketSignalQuality;
  voiceoverUrl?: string;
  voiceoverText?: string;
  voiceoverDurationFrames?: number;
}

export type AnyGeneratedVideoData = GeneratedVideoData | ComparisonVideoData | MarketTemplateData;
export type RenderableVideoData = GeneratedVideoData | ComparisonVideoData | MarketTemplateData;

export interface MarketSignalDatasetCoin {
  id: string;
  ticker: string;
  name: string;
  marketCap: number;
  totalVolume: number;
  change24h: number;
  change7d: number;
}

export interface MarketSignalQuality {
  total: number;
  label: 'Post' | 'Review' | 'Skip';
  color: 'green' | 'amber' | 'red';
  factors: {
    thresholdDistance: 0 | 1 | 2;
    marketCapTier: 0 | 1 | 2;
    repeatTrigger: 0 | 1 | 2;
    volumeFloorMargin: 0 | 1 | 2;
  };
  reasons: string[];
}

export interface GenerateRequestItem {
  ticker: string;
  assetType: AssetType;
}

export interface GenerateRequestPayload {
  tickers: GenerateRequestItem[];
  template: TemplateId;
  investment: number;
  lookbackWindow?: LookbackWindow;
  dcaCadence?: DcaCadence;
  comparison?: {
    primary: GenerateRequestItem;
    secondary: GenerateRequestItem;
  };
}

export interface GenerateResponsePayload {
  items: AnyGeneratedVideoData[];
  marketContext?: {
    dataset: MarketSignalDatasetCoin[];
  };
}

export interface RenderRequestPayload {
  items: AnyGeneratedVideoData[];
}

export interface RenderedVideoResult {
  asset: string;
  template: TemplateId;
  fileName: string;
  url: string;
}
