import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {videoTheme} from '../theme';

export function LogoIntroScene() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = spring({
    frame,
    fps,
    config: {damping: 14, stiffness: 140},
  });
  const opacity = interpolate(frame, [0, 36, 54], [1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, 18], [26, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const glowOpacity = interpolate(frame, [0, 8, 22, 40], [0.85, 1, 0.7, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity}}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at center, rgba(0,255,136,0.16), transparent 32%), radial-gradient(circle at center, rgba(255,255,255,0.08), transparent 52%)',
          opacity: glowOpacity,
        }}
      />
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
            background: 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))',
            padding: '34px 42px',
            boxShadow: '0 24px 140px rgba(0, 255, 136, 0.22)',
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
        <div
          style={{
            marginTop: 14,
            color: videoTheme.foreground,
            fontSize: 22,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity: 0.72,
          }}
        >
          Market stories in motion
        </div>
      </div>
    </AbsoluteFill>
  );
}
