import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {formatDatesInText} from '../../lib/utils';
import {videoTheme} from '../theme';

export function HookScene({label}: {label: string}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = spring({
    frame,
    fps,
    config: {damping: 16, stiffness: 150},
  });
  const opacity = interpolate(frame, [0, 15], [0, 1]);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity}}>
      <div
        style={{
          padding: '28px 34px',
          borderRadius: 36,
          border: `1px solid ${videoTheme.border}`,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
          transform: `scale(${0.82 + scale * 0.18})`,
          boxShadow: '0 30px 120px rgba(0, 255, 136, 0.12)',
        }}
      >
        <div
          style={{
            fontFamily: 'sans-serif',
            color: videoTheme.foreground,
            fontSize: 110,
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            textAlign: 'center',
          }}
        >
          {formatDatesInText(label, 'short')}
        </div>
      </div>
    </AbsoluteFill>
  );
}
