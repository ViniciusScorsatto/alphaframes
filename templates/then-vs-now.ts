import type {LookbackWindow, NormalizedAssetData} from '@/types';
import {createBaseResult, sliceByLookback} from '@/templates/shared';
import {formatCurrency} from '@/lib/utils';

export function thenVsNowTemplate(asset: NormalizedAssetData, investment: number, lookbackWindow: LookbackWindow = 'max') {
  const period = sliceByLookback(asset.historical, lookbackWindow);
  const startPrice = period[0]?.price ?? asset.currentPrice;
  const valueToday = investment * (asset.currentPrice / startPrice);

  return createBaseResult({
    asset,
    template: 'THEN_VS_NOW',
    investment,
    period,
    hookLabel: `${formatCurrency(investment, asset.currency)} -> ${formatCurrency(valueToday, asset.currency)}`,
    contextLabel: `${asset.displayName}: then vs now`,
    resultLabel: `From ${period[0]?.date ?? 'start'} to today`,
    insights: [
      `Earliest tracked close is ${formatCurrency(startPrice, asset.currency)} and the latest close is ${formatCurrency(asset.currentPrice, asset.currency)}.`,
      `${formatCurrency(investment, asset.currency)} followed that move to ${formatCurrency(valueToday, asset.currency)}.`,
    ],
  });
}
