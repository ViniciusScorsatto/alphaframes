import type {LookbackWindow, NormalizedAssetData} from '@/types';
import {createBaseResult, sliceByLookback} from '@/templates/shared';
import {formatAssetIdentity, formatCurrency, formatDisplayDate, formatPercent} from '@/lib/utils';

export function bestDayToBuyTemplate(asset: NormalizedAssetData, investment: number, lookbackWindow: LookbackWindow = 365) {
  const period = sliceByLookback(asset.historical, lookbackWindow);
  const bestBuyPoint = period.reduce((lowest, point) => (point.price < lowest.price ? point : lowest), period[0]);
  const shares = investment / bestBuyPoint.price;
  const valueToday = shares * asset.currentPrice;
  const returnPercent = ((asset.currentPrice - bestBuyPoint.price) / bestBuyPoint.price) * 100;
  const assetLabel = formatAssetIdentity(asset.ticker, asset.displayName);

  return createBaseResult({
    asset,
    template: 'BEST_DAY_TO_BUY',
    investment,
    period,
    startPrice: bestBuyPoint.price,
    startDate: bestBuyPoint.date,
    currentPrice: asset.currentPrice,
    bestBuyDate: bestBuyPoint.date,
    bestBuyPrice: bestBuyPoint.price,
    hookLabel: `${formatDisplayDate(bestBuyPoint.date)} -> ${formatCurrency(valueToday, asset.currency)}`,
    contextLabel: `Best dip entry for ${assetLabel} in the selected range`,
    resultLabel: `${formatPercent(returnPercent)} since the low`,
    insights: [
      `The lowest tracked close was ${formatCurrency(bestBuyPoint.price, asset.currency)} on ${formatDisplayDate(bestBuyPoint.date)}.`,
      `${formatCurrency(investment, asset.currency)} bought on that day would now be worth ${formatCurrency(valueToday, asset.currency)}.`,
    ],
  });
}
