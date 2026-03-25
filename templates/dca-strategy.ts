import type {DcaCadence, HistoricalPricePoint, LookbackWindow, NormalizedAssetData} from '@/types';
import {createBaseResult, sliceByLookback} from '@/templates/shared';
import {formatCurrency} from '@/lib/utils';

function selectPurchases(period: HistoricalPricePoint[], cadence: DcaCadence) {
  if (cadence === 'monthly') {
    const seenMonths = new Set<string>();
    return period.filter((point) => {
      const monthKey = point.date.slice(0, 7);
      if (seenMonths.has(monthKey)) {
        return false;
      }

      seenMonths.add(monthKey);
      return true;
    });
  }

  const step = cadence === 'biweekly' ? 14 : 7;
  return period.filter((_, index) => index % step === 0);
}

function formatCadenceLabel(cadence: DcaCadence) {
  if (cadence === 'biweekly') {
    return 'Biweekly';
  }

  if (cadence === 'monthly') {
    return 'Monthly';
  }

  return 'Weekly';
}

export function dcaStrategyTemplate(
  asset: NormalizedAssetData,
  investment: number,
  lookbackWindow: LookbackWindow = 365,
  dcaCadence: DcaCadence = 'weekly',
) {
  const period = sliceByLookback(asset.historical, lookbackWindow);
  const purchases = selectPurchases(period, dcaCadence);
  const allocation = investment / purchases.length;
  const sharesAccumulated = purchases.reduce((total, point) => total + allocation / point.price, 0);
  const averageEntry = investment / sharesAccumulated;
  const valueToday = sharesAccumulated * asset.currentPrice;
  const cadenceLabel = formatCadenceLabel(dcaCadence);

  return createBaseResult({
    asset,
    template: 'DCA_STRATEGY',
    investment,
    period,
    startPrice: averageEntry,
    sharesAccumulated,
    hookLabel: `${purchases.length} buys -> ${formatCurrency(valueToday, asset.currency)}`,
    contextLabel: `${cadenceLabel} DCA into ${asset.displayName} for the selected range`,
    resultLabel: `${formatCurrency(averageEntry, asset.currency)} avg cost`,
    insights: [
      `This simulates ${purchases.length} ${dcaCadence} buys across the selected range.`,
      `Average entry lands around ${formatCurrency(averageEntry, asset.currency)} and the position is now ${formatCurrency(valueToday, asset.currency)}.`,
    ],
  });
}
