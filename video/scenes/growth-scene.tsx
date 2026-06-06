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
    frame: Math.max(frame - 112, 0),
    fps,
    config: {damping: 18, stiffness: 120},
  });
  const opacity = interpolate(frame, [112, 126], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [158, 184], [1, 0], {
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
          fontWeight: 700,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          fontFamily: videoTheme.fonts.metric,
        }}
      >
        {formatCurrency(valueToday, currency)}
      </div>
      <div
        style={{
          marginTop: 18,
          color: videoTheme.foreground,
          fontSize: 54,
          fontFamily: videoTheme.fonts.metric,
          fontWeight: 700,
        }}
      >
        {formatPercent(returnPercent)}
      </div>
    </AbsoluteFill>
  );
}
