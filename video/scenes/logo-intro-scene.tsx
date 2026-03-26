import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {videoTheme} from '../theme';

export function LogoIntroScene({hookTitle, hookSubtitle}: {hookTitle: string; hookSubtitle: string}) {
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
          width: '100%',
          maxWidth: 860,
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
            fontSize: 24,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
          }}
        >
          AlphaFrames
        </div>
        <div
          style={{
            marginTop: 30,
            color: videoTheme.foreground,
            fontSize: 74,
            lineHeight: 1.04,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            textAlign: 'center',
            maxWidth: 820,
          }}
        >
          {hookTitle}
        </div>
        <div
          style={{
            marginTop: 20,
            padding: '16px 22px',
            borderRadius: 24,
            border: `1px solid ${videoTheme.border}`,
            background: 'rgba(255,255,255,0.05)',
            color: videoTheme.secondary,
            fontSize: 24,
            letterSpacing: '0.03em',
            textAlign: 'center',
            maxWidth: 760,
            lineHeight: 1.35,
          }}
        >
          {hookSubtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
}
