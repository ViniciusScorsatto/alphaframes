import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {HistoricalPricePoint} from '../../types';
import {formatCurrency, formatDisplayDate} from '../../lib/utils';
import {normalizeTimeline} from '../helpers';
import {videoTheme} from '../theme';

export function TimelineScene({
  points,
  currency,
  bestBuyDate,
}: {
  points: HistoricalPricePoint[];
  currency: string;
  bestBuyDate?: string;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [24, 102], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const finalLabelOpacity = interpolate(frame, [108, 122], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const normalized = normalizeTimeline(points);
  const visibleCount = Math.max(2, Math.floor(normalized.length * progress));
  const visiblePoints = normalized.slice(0, visibleCount);
  const startPoint = normalized[0];
  const endPoint = normalized[normalized.length - 1];
  const bestBuyPoint = bestBuyDate ? normalized.find((point) => point.date === bestBuyDate) : undefined;
  const isBestBuyVisible = Boolean(
    bestBuyPoint && visiblePoints.some((point) => point.date === bestBuyPoint.date),
  );
  const path = visiblePoints
    .map((point, index) => {
      const x = 90 + point.x * 900;
      const y = 420 + point.y * 520;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <AbsoluteFill style={{padding: '0 60px'}}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920">
        <defs>
          <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor={videoTheme.gain} />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="url(#line)" strokeWidth={12} strokeLinecap="round" />
        {bestBuyPoint && isBestBuyVisible ? (
          <g>
            <line
              x1={90 + bestBuyPoint.x * 900}
              y1={340}
              x2={90 + bestBuyPoint.x * 900}
              y2={420 + bestBuyPoint.y * 520}
              stroke={videoTheme.loss}
              strokeWidth="4"
              strokeDasharray="12 10"
              opacity="0.9"
            />
            <circle
              cx={90 + bestBuyPoint.x * 900}
              cy={420 + bestBuyPoint.y * 520}
              r="22"
              fill="rgba(255,77,77,0.18)"
              stroke={videoTheme.loss}
              strokeWidth="5"
            />
            <circle
              cx={90 + bestBuyPoint.x * 900}
              cy={420 + bestBuyPoint.y * 520}
              r="10"
              fill={videoTheme.loss}
            />
            <text
              x={90 + bestBuyPoint.x * 900}
              y={300}
              textAnchor="middle"
              fill={videoTheme.loss}
              fontSize="34"
              fontFamily="sans-serif"
              fontWeight="800"
            >
              Best buy
            </text>
            <text
              x={90 + bestBuyPoint.x * 900}
              y={336}
              textAnchor="middle"
              fill={videoTheme.foreground}
              fontSize="28"
              fontFamily="sans-serif"
              fontWeight="600"
            >
              {formatDisplayDate(bestBuyPoint.date)}
            </text>
          </g>
        ) : null}
        {startPoint ? (
          <g>
            <circle cx={90 + startPoint.x * 900} cy={420 + startPoint.y * 520} r="14" fill="#FFFFFF" />
            <text
              x={90 + startPoint.x * 900}
              y={420 + startPoint.y * 520 - 34}
              fill={videoTheme.foreground}
              fontSize="34"
              fontFamily="sans-serif"
              fontWeight="700"
            >
              {formatCurrency(startPoint.price, currency)}
            </text>
          </g>
        ) : null}
        {endPoint ? (
          <g opacity={finalLabelOpacity}>
            <circle cx={90 + endPoint.x * 900} cy={420 + endPoint.y * 520} r="14" fill={videoTheme.gain} />
            <text
              x={90 + endPoint.x * 900}
              y={420 + endPoint.y * 520 - 34}
              textAnchor="end"
              fill={videoTheme.gain}
              fontSize="34"
              fontFamily="sans-serif"
              fontWeight="700"
            >
              {formatCurrency(endPoint.price, currency)}
            </text>
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
}
