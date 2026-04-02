import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {videoTheme} from '../theme';

export function DisclaimerScene() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [352, 382], [0, 0.78], {
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
          fontSize: 18,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        For educational purposes only
      </div>
    </AbsoluteFill>
  );
}
