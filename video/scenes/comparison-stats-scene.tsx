import {AbsoluteFill} from 'remotion';
import {formatCurrency, formatPercent} from '../../lib/utils';
import type {ComparisonVideoData} from '../../types';
import {videoTheme} from '../theme';

export function ComparisonStatsScene({data}: {data: ComparisonVideoData}) {
  const primaryPerformanceColor = data.primaryAsset.return >= 0 ? videoTheme.gain : videoTheme.loss;
  const secondaryPerformanceColor = data.secondaryAsset.return >= 0 ? videoTheme.gain : videoTheme.loss;
  const winnerColor =
    data.primaryAsset.return >= data.secondaryAsset.return
      ? primaryPerformanceColor
      : secondaryPerformanceColor;

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 120px'}}>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
        <Card
          title={data.primaryAsset.ticker}
          assetColor={data.primaryAsset.color}
          performanceColor={primaryPerformanceColor}
          value={formatCurrency(data.primaryAsset.valueToday, data.currency)}
          subvalue={formatPercent(data.primaryAsset.return)}
        />
        <Card
          title={data.secondaryAsset.ticker}
          assetColor={data.secondaryAsset.color}
          performanceColor={secondaryPerformanceColor}
          value={formatCurrency(data.secondaryAsset.valueToday, data.currency)}
          subvalue={formatPercent(data.secondaryAsset.return)}
        />
      </div>
      <div
        style={{
          marginTop: 24,
          borderRadius: 28,
          border: `1px solid ${videoTheme.border}`,
          background: 'rgba(255,255,255,0.05)',
          padding: '28px 30px',
        }}
      >
        <div style={{fontSize: 36, color: winnerColor, textTransform: 'uppercase', letterSpacing: '0.12em'}}>
          {data.resultLabel}
        </div>
        <div style={{marginTop: 14, fontSize: 34, color: videoTheme.foreground, lineHeight: 1.3}}>
          {data.insights[0]}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Card({
  title,
  assetColor,
  performanceColor,
  value,
  subvalue,
}: {
  title: string;
  assetColor: string;
  performanceColor: string;
  value: string;
  subvalue: string;
}) {
  return (
    <div
      style={{
        borderRadius: 28,
        border: '1px solid rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.05)',
        padding: '26px 28px',
      }}
    >
      <div style={{fontSize: 30, color: assetColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em'}}>{title}</div>
      <div style={{marginTop: 14, fontSize: 58, color: '#fff', fontWeight: 900, letterSpacing: '-0.05em'}}>{value}</div>
      <div style={{marginTop: 10, fontSize: 34, color: performanceColor}}>{subvalue}</div>
    </div>
  );
}
