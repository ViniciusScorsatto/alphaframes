import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {videoTheme} from '../theme';

export function DisclaimerScene({startFrame}: {startFrame?: number}) {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const resolvedStart = startFrame ?? Math.max(durationInFrames - 68, 0);
  const opacity = interpolate(frame, [resolvedStart, resolvedStart + 8], [0, 0.78], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 28, pointerEvents: 'none', opacity}}
    >
      <div
        style={{
          borderRadius: 999,
          border: `1px solid ${videoTheme.border}`,
          background: 'rgba(8,8,8,0.62)',
          padding: '8px 16px',
          color: videoTheme.secondary,
          fontSize: 22,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontFamily: videoTheme.fonts.ui,
          fontWeight: 500,
        }}
      >
        Educational content only. Not financial advice.
      </div>
    </AbsoluteFill>
  );
}
