import {AbsoluteFill} from 'remotion';
import {formatCurrency} from '../../lib/utils';
import type {ComparisonVideoData} from '../../types';
import {videoTheme} from '../theme';

function normalize(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  return values.map((value) => 1 - (value - min) / range);
}

export function ComparisonChartScene({data}: {data: ComparisonVideoData}) {
  const normalizedPrimary = normalize(data.comparisonTimeline.map((point) => point.primaryValue));
  const normalizedSecondary = normalize(data.comparisonTimeline.map((point) => point.secondaryValue));
  const primaryPerformanceColor = data.primaryAsset.return >= 0 ? videoTheme.gain : videoTheme.loss;
  const secondaryPerformanceColor = data.secondaryAsset.return >= 0 ? videoTheme.gain : videoTheme.loss;

  const primaryPath = data.comparisonTimeline
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${110 + (index / Math.max(data.comparisonTimeline.length - 1, 1)) * 860} ${400 + normalizedPrimary[index] * 520}`)
    .join(' ');
  const secondaryPath = data.comparisonTimeline
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${110 + (index / Math.max(data.comparisonTimeline.length - 1, 1)) * 860} ${400 + normalizedSecondary[index] * 520}`)
    .join(' ');

  const endX = 110 + 860;
  const primaryEndY = 400 + normalizedPrimary[normalizedPrimary.length - 1] * 520;
  const secondaryEndY = 400 + normalizedSecondary[normalizedSecondary.length - 1] * 520;

  return (
    <AbsoluteFill style={{padding: '0 60px'}}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920">
        <path d={primaryPath} fill="none" stroke={data.primaryAsset.color} strokeWidth={12} strokeLinecap="round" />
        <path d={secondaryPath} fill="none" stroke={data.secondaryAsset.color} strokeWidth={12} strokeLinecap="round" />
        <circle cx={endX} cy={primaryEndY} r="16" fill={data.primaryAsset.color} />
        <circle cx={endX} cy={secondaryEndY} r="16" fill={data.secondaryAsset.color} />
        <AssetChip
          x={Math.max(120, endX - 250)}
          y={primaryEndY - 56}
          ticker={data.primaryAsset.ticker}
          tickerColor={data.primaryAsset.color}
          value={formatCurrency(data.primaryAsset.valueToday, data.currency)}
          valueColor={primaryPerformanceColor}
        />
        <AssetChip
          x={Math.max(120, endX - 250)}
          y={secondaryEndY - 56}
          ticker={data.secondaryAsset.ticker}
          tickerColor={data.secondaryAsset.color}
          value={formatCurrency(data.secondaryAsset.valueToday, data.currency)}
          valueColor={secondaryPerformanceColor}
        />
      </svg>
    </AbsoluteFill>
  );
}

function AssetChip({
  x,
  y,
  ticker,
  tickerColor,
  value,
  valueColor,
}: {
  x: number;
  y: number;
  ticker: string;
  tickerColor: string;
  value: string;
  valueColor: string;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x="0"
        y="0"
        width="230"
        height="86"
        rx="22"
        fill="rgba(8, 8, 8, 0.88)"
        stroke="rgba(255,255,255,0.10)"
      />
      <text x="18" y="32" fill={tickerColor} fontSize="24" fontWeight="800">
        {ticker}
      </text>
      <text x="18" y="64" fill={valueColor} fontSize="32" fontWeight="900">
        {value}
      </text>
    </g>
  );
}
