import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {formatDatesInText} from '../../lib/utils';
import {videoTheme} from '../theme';

export function ResultScene({label, insights}: {label: string; insights: string[]}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [205, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 72px 120px', opacity}}>
      <div
        style={{
          borderRadius: 32,
          border: `1px solid ${videoTheme.border}`,
          background: 'rgba(255,255,255,0.05)',
          padding: '32px 34px',
          boxShadow: '0 18px 80px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div style={{fontSize: 42, color: videoTheme.secondary, textTransform: 'uppercase', letterSpacing: '0.12em'}}>
          {formatDatesInText(label)}
        </div>
        <div style={{marginTop: 18, fontSize: 38, color: videoTheme.foreground, lineHeight: 1.3}}>
          {formatDatesInText(insights[0])}
        </div>
      </div>
    </AbsoluteFill>
  );
}
