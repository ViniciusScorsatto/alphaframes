import {AbsoluteFill} from 'remotion';
import {formatAssetIdentity, formatCurrency, formatDisplayDate} from '../../lib/utils';
import type {ComparisonVideoData} from '../../types';
import {videoTheme} from '../theme';

export function ComparisonHeaderScene({data}: {data: ComparisonVideoData}) {
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', padding: '110px 72px 0'}}>
      <div style={{fontSize: 96, fontWeight: 900, letterSpacing: '-0.06em', color: videoTheme.foreground}}>
        {data.primaryAsset.ticker} vs {data.secondaryAsset.ticker}
      </div>
      <div
        style={{
          marginTop: 16,
          maxWidth: 860,
          fontSize: 24,
          color: videoTheme.secondary,
          lineHeight: 1.35,
          letterSpacing: '0.01em',
        }}
      >
        {formatAssetIdentity(data.primaryAsset.ticker, data.primaryAsset.name)} vs{' '}
        {formatAssetIdentity(data.secondaryAsset.ticker, data.secondaryAsset.name)}
      </div>
      <div style={{marginTop: 20, fontSize: 36, color: videoTheme.secondary, textTransform: 'uppercase', letterSpacing: '0.12em'}}>
        {formatCurrency(data.investment, data.currency)} into each asset
      </div>
      <div style={{marginTop: 20, fontSize: 30, color: videoTheme.foreground}}>
        {formatDisplayDate(data.startDate)} to {formatDisplayDate(data.endDate)}
      </div>
    </AbsoluteFill>
  );
}
