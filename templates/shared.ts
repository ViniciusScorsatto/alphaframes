import type {GeneratedVideoData, HistoricalPricePoint, LookbackWindow, NormalizedAssetData, TemplateId} from '@/types';
import {formatCurrency, formatPercent} from '@/lib/utils';

export function sliceRecentDays(points: HistoricalPricePoint[], days: number) {
  return points.slice(Math.max(points.length - days, 0));
}

export function sliceByLookback(points: HistoricalPricePoint[], lookbackWindow?: LookbackWindow) {
  if (!lookbackWindow || lookbackWindow === 'max') {
    return points;
  }

  return sliceRecentDays(points, lookbackWindow);
}

export function getReturnPercent(startPrice: number, currentPrice: number) {
  return ((currentPrice - startPrice) / startPrice) * 100;
}

export function createBaseResult(input: {
  asset: NormalizedAssetData;
  template: TemplateId;
  investment: number;
  period: HistoricalPricePoint[];
  startPrice?: number;
  startDate?: string;
  currentPrice?: number;
  hookLabel: string;
  contextLabel: string;
  resultLabel: string;
  insights: string[];
  bestBuyDate?: string;
  bestBuyPrice?: number;
  sharesAccumulated?: number;
}): GeneratedVideoData {
  const timeline = input.period;
  const startPrice = input.startPrice ?? timeline[0]?.price ?? input.asset.currentPrice;
  const currentPrice = input.currentPrice ?? timeline[timeline.length - 1]?.price ?? input.asset.currentPrice;
  const startDate = input.startDate ?? timeline[0]?.date ?? '';
  const endDate = timeline[timeline.length - 1]?.date ?? '';
  const returnPercent = getReturnPercent(startPrice, currentPrice);
  const valueToday =
    input.sharesAccumulated != null ? input.sharesAccumulated * currentPrice : input.investment * (1 + returnPercent / 100);

  return {
    kind: 'single',
    asset: input.asset.ticker,
    assetType: input.asset.assetType,
    assetName: input.asset.displayName,
    template: input.template,
    currency: input.asset.currency,
    investment: input.investment,
    startDate,
    endDate,
    startPrice,
    currentPrice,
    return: Number(returnPercent.toFixed(2)),
    valueToday: Number(valueToday.toFixed(2)),
    bestBuyDate: input.bestBuyDate,
    bestBuyPrice: input.bestBuyPrice,
    sharesAccumulated: input.sharesAccumulated,
    hookLabel: input.hookLabel,
    contextLabel: input.contextLabel,
    resultLabel: input.resultLabel,
    timeline,
    insights: input.insights,
  };
}

export function describePerformance(asset: string, returnPercent: number, currency: string, valueToday: number) {
  const move = returnPercent >= 0 ? 'gain' : 'drop';
  return `${asset} turned into ${formatCurrency(valueToday, currency)} with a ${move} of ${formatPercent(returnPercent)}.`;
}
