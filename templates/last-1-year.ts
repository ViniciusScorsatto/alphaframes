import type {NormalizedAssetData} from '@/types';
import {createBaseResult, describePerformance, sliceRecentDays} from '@/templates/shared';
import {formatAssetIdentity, formatCurrency} from '@/lib/utils';

export function last1YearTemplate(asset: NormalizedAssetData, investment: number) {
  const period = sliceRecentDays(asset.historical, 365);
  const startPrice = period[0]?.price ?? asset.currentPrice;
  const valueToday = investment * (asset.currentPrice / startPrice);
  const assetLabel = formatAssetIdentity(asset.ticker, asset.displayName);

  return createBaseResult({
    asset,
    template: 'LAST_1_YEAR',
    investment,
    period,
    hookLabel: `${formatCurrency(investment, asset.currency)} -> ${formatCurrency(valueToday, asset.currency)}`,
    contextLabel: `${assetLabel} over the last year`,
    resultLabel: `${asset.ticker} 1-year performance`,
    insights: [
      describePerformance(asset.ticker, ((asset.currentPrice - startPrice) / startPrice) * 100, asset.currency, valueToday),
      `One year ago the asset traded near ${formatCurrency(startPrice, asset.currency)}.`,
    ],
  });
}
