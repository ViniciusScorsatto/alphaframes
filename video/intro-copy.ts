import {formatCurrency} from '../lib/utils';
import type {ComparisonVideoData, GeneratedVideoData} from '../types';

function toAssetTypeLabel(value: 'crypto' | 'stock' | 'etf') {
  if (value === 'etf') {
    return 'ETF';
  }

  if (value === 'stock') {
    return 'stock';
  }

  return 'crypto';
}

export function getSingleIntroCopy(data: GeneratedVideoData) {
  const investmentLabel = formatCurrency(data.investment, data.currency);

  switch (data.template) {
    case 'BEST_DAY_TO_BUY':
      return {
        hookTitle: `Did you miss the best day to buy ${data.assetName}?`,
        hookSubtitle: 'We tracked the lowest close in this window and what happened next.',
      };
    case 'DCA_STRATEGY': {
      const cadence = data.contextLabel.split(' ')[0] ?? 'Recurring';
      return {
        hookTitle: `What if you bought ${data.assetName} every ${cadence.toLowerCase()}?`,
        hookSubtitle: 'A recurring-buy strategy in one fast breakdown.',
      };
    }
    case 'THEN_VS_NOW':
      return {
        hookTitle: `If you bought ${data.assetName} back then...`,
        hookSubtitle: `Here is what ${investmentLabel} would look like today.`,
      };
    case 'LAST_1_YEAR':
      return {
        hookTitle: `What happened to ${investmentLabel} in ${data.assetName}?`,
        hookSubtitle: 'A 1-year performance breakdown in one quick story.',
      };
    case 'LAST_30_DAYS':
    default:
      return {
        hookTitle: `What happened to ${investmentLabel} in ${data.assetName} this month?`,
        hookSubtitle: 'Price action, returns, and timing in under 12 seconds.',
      };
  }
}

export function getComparisonIntroCopy(data: ComparisonVideoData) {
  return {
    hookTitle: `${data.primaryAsset.ticker} vs ${data.secondaryAsset.ticker}: who actually won?`,
    hookSubtitle: `${data.primaryAsset.name} (${toAssetTypeLabel(data.primaryAsset.assetType)}) vs ${data.secondaryAsset.name} (${toAssetTypeLabel(data.secondaryAsset.assetType)})`,
  };
}
