import type {NormalizedAssetData} from '@/types';
import {createBaseResult, sliceRecentDays} from '@/templates/shared';
import {formatCurrency, formatDisplayDate, formatPercent} from '@/lib/utils';

export function bestDayToBuyTemplate(asset: NormalizedAssetData, investment: number) {
  const period = sliceRecentDays(asset.historical, 365);
  const bestBuyPoint = period.reduce((lowest, point) => (point.price < lowest.price ? point : lowest), period[0]);
  const shares = investment / bestBuyPoint.price;
  const valueToday = shares * asset.currentPrice;
  const returnPercent = ((asset.currentPrice - bestBuyPoint.price) / bestBuyPoint.price) * 100;

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
    contextLabel: `Best dip entry for ${asset.displayName} in the last year`,
    resultLabel: `${formatPercent(returnPercent)} since the low`,
    insights: [
      `The lowest tracked close was ${formatCurrency(bestBuyPoint.price, asset.currency)} on ${formatDisplayDate(bestBuyPoint.date)}.`,
      `${formatCurrency(investment, asset.currency)} bought on that day would now be worth ${formatCurrency(valueToday, asset.currency)}.`,
    ],
  });
}
