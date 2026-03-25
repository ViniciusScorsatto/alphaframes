import type {HistoricalPricePoint} from '../types';

export function normalizeTimeline(points: HistoricalPricePoint[]) {
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, 1);

  return points.map((point, index) => ({
    ...point,
    x: index / Math.max(points.length - 1, 1),
    y: 1 - (point.price - min) / range,
  }));
}
