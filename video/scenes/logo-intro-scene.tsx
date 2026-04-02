import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {videoTheme} from '../theme';

export function LogoIntroScene({
  hookTitle,
  resultTease,
  resultTone,
  hookSubtitle,
}: {
  hookTitle: string;
  resultTease: string;
  resultTone: 'gain' | 'loss' | 'neutral';
  hookSubtitle: string;
}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hookScale = spring({
    frame,
    fps,
    config: {damping: 16, stiffness: 170},
  });
  const resultScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: {damping: 14, stiffness: 150},
  });
  const opacity = interpolate(frame, [0, 52, 68], [1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const heroTranslateY = interpolate(frame, [0, 16, 44], [48, 0, -16], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const plateOpacity = interpolate(frame, [0, 10, 48, 68], [0.96, 1, 0.9, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const darkWorldOpacity = interpolate(frame, [36, 72], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const resultOpacity = interpolate(frame, [8, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subtitleOpacity = interpolate(frame, [16, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoOpacity = interpolate(frame, [0, 6, 60], [0.4, 0.82, 0.22], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const resultColor =
    resultTone === 'gain' ? videoTheme.gain : resultTone === 'loss' ? videoTheme.loss : '#F4F7F5';

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, #f8fffb 0%, #f2fff8 54%, rgba(242,255,248,0.88) 70%, rgba(242,255,248,0) 100%)',
          opacity: plateOpacity,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(0,255,136,0.22), transparent 22%), radial-gradient(circle at 82% 16%, rgba(0,0,0,0.08), transparent 22%), radial-gradient(circle at 50% 42%, rgba(255,255,255,0.96), transparent 56%)',
          opacity: plateOpacity,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at top, rgba(0,255,136,0.18), transparent 24%), radial-gradient(circle at bottom right, rgba(255,77,77,0.10), transparent 26%), #000',
          opacity: darkWorldOpacity,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: darkWorldOpacity * 0.12,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{padding: '82px 72px 128px'}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: logoOpacity,
          }}
        >
          <div
            style={{
              borderRadius: 999,
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <Img
              src={staticFile('branding/alphaframes-logo.svg')}
              style={{width: 116, height: 'auto', display: 'block'}}
            />
          </div>
          <div
            style={{
              color: 'rgba(10, 18, 14, 0.48)',
              fontSize: 20,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            AlphaFrames
          </div>
        </div>
      </AbsoluteFill>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: '100%',
          maxWidth: 920,
          padding: '0 72px',
          transform: `translateY(${heroTranslateY}px)`,
        }}
      >
        <div
          style={{
            color: '#07140d',
            fontSize: 110,
            lineHeight: 0.94,
            fontWeight: 900,
            letterSpacing: '-0.07em',
            maxWidth: 860,
            transform: `scale(${0.94 + hookScale * 0.06})`,
            textShadow: '0 10px 30px rgba(255,255,255,0.22)',
          }}
        >
          {hookTitle}
        </div>
        <div
          style={{
            marginTop: 24,
            padding: '18px 24px',
            borderRadius: 26,
            background: 'rgba(7,20,13,0.92)',
            color: resultColor,
            fontSize: 44,
            lineHeight: 1.04,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            opacity: resultOpacity,
            transform: `scale(${0.94 + resultScale * 0.06})`,
            boxShadow: '0 22px 80px rgba(7,20,13,0.24)',
          }}
        >
          {resultTease}
        </div>
        <div
          style={{
            marginTop: 22,
            maxWidth: 760,
            color: 'rgba(7,20,13,0.62)',
            fontSize: 28,
            letterSpacing: '0.01em',
            lineHeight: 1.3,
            opacity: subtitleOpacity,
            fontWeight: 600,
          }}
        >
          {hookSubtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
}
