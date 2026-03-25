import {AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {videoTheme} from '../theme';

export function LogoIntroScene() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = spring({
    frame,
    fps,
    config: {damping: 14, stiffness: 140},
  });
  const opacity = interpolate(frame, [0, 10, 36, 54], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, 18], [26, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity}}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `translateY(${translateY}px) scale(${0.92 + scale * 0.08})`,
        }}
      >
        <div
          style={{
            borderRadius: 40,
            border: `1px solid ${videoTheme.border}`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
            padding: '34px 42px',
            boxShadow: '0 24px 120px rgba(0, 255, 136, 0.16)',
          }}
        >
          <Img
            src={staticFile('branding/alphaframes-logo.svg')}
            style={{width: 320, height: 'auto', display: 'block'}}
          />
        </div>
        <div
          style={{
            marginTop: 30,
            color: videoTheme.secondary,
            fontSize: 34,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
          }}
        >
          AlphaFrames
        </div>
      </div>
    </AbsoluteFill>
  );
}
