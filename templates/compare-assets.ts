import type {ComparisonTimelinePoint, ComparisonVideoData, LookbackWindow, NormalizedAssetData} from '@/types';
import {formatCurrency, formatPercent} from '@/lib/utils';
import {sliceByLookback} from '@/templates/shared';

function alignTimelines(primary: NormalizedAssetData, secondary: NormalizedAssetData, lookbackWindow: LookbackWindow = 180) {
  const primaryWindow = sliceByLookback(primary.historical, lookbackWindow);
  const secondaryWindow = sliceByLookback(secondary.historical, lookbackWindow);
  const secondaryByDate = new Map(secondaryWindow.map((point) => [point.date, point]));
  return primaryWindow
    .map((point) => {
      const other = secondaryByDate.get(point.date);
      if (!other) {
        return null;
      }

      return {
        date: point.date,
        timestamp: point.timestamp,
        primaryPrice: point.price,
        secondaryPrice: other.price,
      };
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);
}

export function compareAssetsTemplate(
  primary: NormalizedAssetData,
  secondary: NormalizedAssetData,
  investment: number,
  lookbackWindow: LookbackWindow = 180,
): ComparisonVideoData {
  const aligned = alignTimelines(primary, secondary, lookbackWindow);

  if (aligned.length < 2) {
    throw new Error(`Not enough overlapping history to compare ${primary.ticker} and ${secondary.ticker}.`);
  }

  const start = aligned[0];
  const end = aligned[aligned.length - 1];
  const primaryReturn = ((end.primaryPrice - start.primaryPrice) / start.primaryPrice) * 100;
  const secondaryReturn = ((end.secondaryPrice - start.secondaryPrice) / start.secondaryPrice) * 100;
  const primaryValueToday = investment * (end.primaryPrice / start.primaryPrice);
  const secondaryValueToday = investment * (end.secondaryPrice / start.secondaryPrice);
  const winner = primaryReturn >= secondaryReturn ? primary : secondary;
  const deltaReturn = Math.abs(primaryReturn - secondaryReturn);

  const comparisonTimeline: ComparisonTimelinePoint[] = aligned.map((point) => ({
    date: point.date,
    timestamp: point.timestamp,
    primaryValue: investment * (point.primaryPrice / start.primaryPrice),
    secondaryValue: investment * (point.secondaryPrice / start.secondaryPrice),
  }));

  return {
    kind: 'comparison',
    asset: `${primary.ticker}-VS-${secondary.ticker}`,
    assetName: `${primary.displayName} vs ${secondary.displayName}`,
    template: 'COMPARE_ASSETS',
    investment,
    currency: primary.currency,
    startDate: start.date,
    endDate: end.date,
    hookLabel: `${primary.ticker} vs ${secondary.ticker}`,
    contextLabel: `${formatCurrency(investment, primary.currency)} in each asset over the same period`,
    resultLabel: `${winner.ticker} wins by ${formatPercent(deltaReturn)}`,
    insights: [
      `${winner.ticker} outperformed by ${formatPercent(deltaReturn)} over the same window.`,
      `${primary.ticker} reached ${formatCurrency(primaryValueToday, primary.currency)} while ${secondary.ticker} finished at ${formatCurrency(secondaryValueToday, secondary.currency)}.`,
    ],
    primaryAsset: {
      ticker: primary.ticker,
      assetType: primary.assetType,
      name: primary.displayName,
      startPrice: start.primaryPrice,
      currentPrice: end.primaryPrice,
      return: Number(primaryReturn.toFixed(2)),
      valueToday: Number(primaryValueToday.toFixed(2)),
      color: '#B8C0C2',
    },
    secondaryAsset: {
      ticker: secondary.ticker,
      assetType: secondary.assetType,
      name: secondary.displayName,
      startPrice: start.secondaryPrice,
      currentPrice: end.secondaryPrice,
      return: Number(secondaryReturn.toFixed(2)),
      valueToday: Number(secondaryValueToday.toFixed(2)),
      color: '#6FA8FF',
    },
    winnerTicker: winner.ticker,
    deltaReturn: Number(deltaReturn.toFixed(2)),
    comparisonTimeline,
  };
}
