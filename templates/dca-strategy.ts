import type {NormalizedAssetData} from '@/types';
import {createBaseResult, sliceRecentDays} from '@/templates/shared';
import {formatCurrency} from '@/lib/utils';

export function dcaStrategyTemplate(asset: NormalizedAssetData, investment: number) {
  const period = sliceRecentDays(asset.historical, 365);
  const cadence = 7;
  const purchases = period.filter((_, index) => index % cadence === 0);
  const allocation = investment / purchases.length;
  const sharesAccumulated = purchases.reduce((total, point) => total + allocation / point.price, 0);
  const averageEntry = investment / sharesAccumulated;
  const valueToday = sharesAccumulated * asset.currentPrice;

  return createBaseResult({
    asset,
    template: 'DCA_STRATEGY',
    investment,
    period,
    startPrice: averageEntry,
    sharesAccumulated,
    hookLabel: `${purchases.length} buys -> ${formatCurrency(valueToday, asset.currency)}`,
    contextLabel: `Weekly DCA into ${asset.displayName} for 1 year`,
    resultLabel: `${formatCurrency(averageEntry, asset.currency)} avg cost`,
    insights: [
      `This simulates ${purchases.length} evenly spaced buys across one year.`,
      `Average entry lands around ${formatCurrency(averageEntry, asset.currency)} and the position is now ${formatCurrency(valueToday, asset.currency)}.`,
    ],
  });
}
