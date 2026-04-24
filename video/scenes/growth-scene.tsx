import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {formatCurrency, formatPercent} from '../../lib/utils';
import {videoTheme} from '../theme';

export function GrowthScene({
  valueToday,
  returnPercent,
  currency,
}: {
  valueToday: number;
  returnPercent: number;
  currency: string;
}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lift = spring({
    frame: Math.max(frame - 126, 0),
    fps,
    config: {damping: 18, stiffness: 120},
  });
  const opacity = interpolate(frame, [126, 146], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [154, 176], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const color = returnPercent >= 0 ? videoTheme.gain : videoTheme.loss;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        padding: '0 72px 410px',
        opacity: opacity * fadeOut,
        transform: `translateY(${40 - lift * 40}px)`,
      }}
    >
      <div
        style={{
          color,
          fontSize: 118,
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: '-0.05em',
          fontFamily: 'sans-serif',
        }}
      >
        {formatCurrency(valueToday, currency)}
      </div>
      <div
        style={{
          marginTop: 18,
          color: videoTheme.foreground,
          fontSize: 54,
          fontFamily: 'sans-serif',
        }}
      >
        {formatPercent(returnPercent)}
      </div>
    </AbsoluteFill>
  );
}
