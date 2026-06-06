import {formatAssetIdentity, formatCurrency, formatPercent} from '../lib/utils';
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
  const assetLabel = formatAssetIdentity(data.asset, data.assetName);

  switch (data.template) {
    case 'BEST_DAY_TO_BUY':
      return {
        hookTitle: `${assetLabel} low point changed the result`,
        resultTease: `${investmentLabel} would be ${resultValueLabel}`,
        resultTone: getToneFromReturn(data.return),
        hookSubtitle: 'We found the low, then tracked what happened next.',
      };
    case 'DCA_STRATEGY': {
      const cadence = data.contextLabel.split(' ')[0] ?? 'Recurring';
      return {
        hookTitle: `${cadence} DCA into ${assetLabel}`,
        resultTease: `${data.hookLabel} | ${returnLabel}`,
        resultTone: getToneFromReturn(data.return),
        hookSubtitle: `${cadence} DCA, one window, and the full payoff story.`,
      };
    }
    case 'THEN_VS_NOW':
      return {
        hookTitle: `${assetLabel} then vs now`,
        resultTease: `${investmentLabel} is now ${resultValueLabel}`,
        resultTone: getToneFromReturn(data.return),
        hookSubtitle: 'A before-vs-now snapshot with the chart as proof.',
      };
    case 'LAST_1_YEAR':
      return {
        hookTitle: `${assetLabel} moved ${returnLabel} in 1 year`,
        resultTease: `${returnLabel} | now ${resultValueLabel}`,
        resultTone: getToneFromReturn(data.return),
        hookSubtitle: 'One year of price action, timing, and return in one quick story.',
      };
    case 'LAST_30_DAYS':
    default:
      return {
        hookTitle: `${assetLabel} moved ${returnLabel} in 30 days`,
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
  const spreadLabel = formatPercent(data.deltaReturn);

  return {
    hookTitle: `${winner.ticker} beat ${otherAsset.ticker} by ${spreadLabel}`,
    resultTease: `${winner.ticker} finished at ${winnerValueLabel}`,
    resultTone: 'gain' as const,
    hookSubtitle: `${formatAssetIdentity(data.primaryAsset.ticker, data.primaryAsset.name)} (${toAssetTypeLabel(data.primaryAsset.assetType)}) vs ${formatAssetIdentity(data.secondaryAsset.ticker, data.secondaryAsset.name)} (${toAssetTypeLabel(data.secondaryAsset.assetType)})`,
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
