import type {NormalizedAssetData} from '@/types';
import {createBaseResult, describePerformance, sliceRecentDays} from '@/templates/shared';
import {formatCurrency} from '@/lib/utils';

export function last30DaysTemplate(asset: NormalizedAssetData, investment: number) {
  const period = sliceRecentDays(asset.historical, 30);
  const startPrice = period[0]?.price ?? asset.currentPrice;
  const valueToday = investment * (asset.currentPrice / startPrice);

  return createBaseResult({
    asset,
    template: 'LAST_30_DAYS',
    investment,
    period,
    hookLabel: `${formatCurrency(investment, asset.currency)} -> ${formatCurrency(valueToday, asset.currency)}`,
    contextLabel: `${asset.displayName} in the last 30 days`,
    resultLabel: `${asset.ticker} 30-day return`,
    insights: [
      describePerformance(asset.ticker, ((asset.currentPrice - startPrice) / startPrice) * 100, asset.currency, valueToday),
      `Started at ${formatCurrency(startPrice, asset.currency)} and closed at ${formatCurrency(asset.currentPrice, asset.currency)}.`,
    ],
  });
}
