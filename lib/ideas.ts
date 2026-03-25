import type {AnyGeneratedVideoData} from '@/types';

export function suggestContentIdeas(item: AnyGeneratedVideoData) {
  if (item.kind === 'comparison') {
    return [
      `${item.primaryAsset.ticker} vs ${item.secondaryAsset.ticker}: which wins with ${item.investment} ${item.currency}?`,
      `Would you rather hold ${item.primaryAsset.ticker} or ${item.secondaryAsset.ticker} this year?`,
      `${item.winnerTicker} beat the other asset by ${item.deltaReturn.toFixed(2)}%`,
    ];
  }

  return [
    `${item.asset}: What ${item.investment} ${item.currency} did in ${item.template.replaceAll('_', ' ').toLowerCase()}`,
    `Would you have bought ${item.asset} on ${item.startDate}?`,
    `${item.asset} from ${item.startDate} to ${item.endDate} in one chart`,
  ];
}
