import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {videoTheme} from '../theme';

export function ContextScene({label, investmentLabel}: {label: string; investmentLabel: string}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', padding: '150px 72px 0', opacity}}>
      <div
        style={{
          color: videoTheme.secondary,
          fontFamily: 'sans-serif',
          fontSize: 48,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 28,
          alignSelf: 'flex-start',
          borderRadius: 999,
          border: `1px solid ${videoTheme.border}`,
          background: 'rgba(255,255,255,0.06)',
          padding: '18px 28px',
          color: videoTheme.foreground,
          fontFamily: 'sans-serif',
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        Based on {investmentLabel} invested
      </div>
    </AbsoluteFill>
  );
}
