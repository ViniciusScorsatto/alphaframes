export type AssetType = 'crypto' | 'stock' | 'etf';

export type TemplateId =
  | 'LAST_30_DAYS'
  | 'LAST_1_YEAR'
  | 'BEST_DAY_TO_BUY'
  | 'DCA_STRATEGY'
  | 'THEN_VS_NOW'
  | 'COMPARE_ASSETS';

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

export type AnyGeneratedVideoData = GeneratedVideoData | ComparisonVideoData;

export interface GenerateRequestItem {
  ticker: string;
  assetType: AssetType;
}

export interface GenerateRequestPayload {
  tickers: GenerateRequestItem[];
  template: TemplateId;
  investment: number;
  comparison?: {
    primary: GenerateRequestItem;
    secondary: GenerateRequestItem;
  };
}

export interface GenerateResponsePayload {
  items: AnyGeneratedVideoData[];
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
