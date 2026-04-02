import {formatCurrency, formatPercent} from '../lib/utils';
import type {ComparisonVideoData, GeneratedVideoData} from '../types';

type IntroTone = 'gain' | 'loss' | 'neutral';

function getToneFromReturn(value: number): IntroTone {
  if (value > 0) {
    return 'gain';
  }

  if (value < 0) {
    return 'loss';
  }

  return 'neutral';
}

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
  const resultValueLabel = formatCurrency(data.valueToday, data.currency);
  const returnLabel = formatPercent(data.return);

  switch (data.template) {
    case 'BEST_DAY_TO_BUY':
      return {
        hookTitle: `Did you miss the best day to buy ${data.assetName}?`,
        resultTease: `${investmentLabel} would be ${resultValueLabel}`,
        resultTone: getToneFromReturn(data.return),
        hookSubtitle: 'We found the low, then tracked what happened next.',
      };
    case 'DCA_STRATEGY': {
      const cadence = data.contextLabel.split(' ')[0] ?? 'Recurring';
      const cadenceLabel = cadence.toLowerCase();
      return {
        hookTitle: `What if you bought ${data.assetName} every ${cadenceLabel}?`,
        resultTease: `${data.hookLabel} | ${returnLabel}`,
        resultTone: getToneFromReturn(data.return),
        hookSubtitle: `${cadence} DCA, one window, and the full payoff story.`,
      };
    }
    case 'THEN_VS_NOW':
      return {
        hookTitle: `If you bought ${data.assetName} back then...`,
        resultTease: `${investmentLabel} is now ${resultValueLabel}`,
        resultTone: getToneFromReturn(data.return),
        hookSubtitle: 'A before-vs-now snapshot with the chart as proof.',
      };
    case 'LAST_1_YEAR':
      return {
        hookTitle: `What happened to ${investmentLabel} in ${data.assetName}?`,
        resultTease: `${returnLabel} | now ${resultValueLabel}`,
        resultTone: getToneFromReturn(data.return),
        hookSubtitle: 'One year of price action, timing, and return in one quick story.',
      };
    case 'LAST_30_DAYS':
    default:
      return {
        hookTitle: `What happened to ${investmentLabel} in ${data.assetName} this month?`,
        resultTease: `${returnLabel} | now ${resultValueLabel}`,
        resultTone: getToneFromReturn(data.return),
        hookSubtitle: 'The result first, then the graph that explains it.',
      };
  }
}

export function getComparisonIntroCopy(data: ComparisonVideoData) {
  const winner = data.winnerTicker === data.primaryAsset.ticker ? data.primaryAsset : data.secondaryAsset;
  const otherAsset = winner.ticker === data.primaryAsset.ticker ? data.secondaryAsset : data.primaryAsset;
  const winnerValueLabel = formatCurrency(winner.valueToday, data.currency);

  return {
    hookTitle: `${data.primaryAsset.ticker} vs ${data.secondaryAsset.ticker}: who actually won?`,
    resultTease: `${winner.ticker} finished at ${winnerValueLabel}`,
    resultTone: 'gain' as const,
    hookSubtitle: `${data.primaryAsset.name} (${toAssetTypeLabel(data.primaryAsset.assetType)}) vs ${data.secondaryAsset.name} (${toAssetTypeLabel(data.secondaryAsset.assetType)})`,
    showdownCards: [
      {
        ticker: winner.ticker,
        assetType: toAssetTypeLabel(winner.assetType),
        isWinner: true,
      },
      {
        ticker: otherAsset.ticker,
        assetType: toAssetTypeLabel(otherAsset.assetType),
        isWinner: false,
      },
    ],
  };
}
