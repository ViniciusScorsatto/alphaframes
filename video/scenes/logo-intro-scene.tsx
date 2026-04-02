import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {videoTheme} from '../theme';

export function LogoIntroScene({
  hookTitle,
  resultTease,
  resultTone,
  hookSubtitle,
  showdownCards,
  durationInFrames = 172,
}: {
  hookTitle: string;
  resultTease: string;
  resultTone: 'gain' | 'loss' | 'neutral';
  hookSubtitle: string;
  showdownCards?: Array<{
    ticker: string;
    assetType: string;
    isWinner: boolean;
  }>;
  durationInFrames?: number;
}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fadeStart = Math.max(durationInFrames - 34, 108);
  const fadeEnd = Math.max(durationInFrames - 10, fadeStart + 8);
  const darkWorldStart = Math.max(durationInFrames - 58, 88);
  const darkWorldEnd = Math.max(durationInFrames - 8, darkWorldStart + 10);
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
  const opacity = interpolate(frame, [0, fadeStart, fadeEnd], [1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const heroTranslateY = interpolate(frame, [0, 16, 44], [48, 0, -16], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const plateOpacity = interpolate(frame, [0, 10, fadeStart - 8, fadeEnd], [0.96, 1, 0.9, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const darkWorldOpacity = interpolate(frame, [darkWorldStart, darkWorldEnd], [0, 1], {
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
  const cardsOpacity = interpolate(frame, [18, 34], [0, 1], {
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
        {showdownCards?.length ? (
          <div
            style={{
              marginTop: 34,
              display: 'flex',
              gap: 18,
              opacity: cardsOpacity,
            }}
          >
            {showdownCards.map((card) => (
              <ShowdownCard
                key={`${card.ticker}-${card.assetType}`}
                ticker={card.ticker}
                assetType={card.assetType}
                isWinner={card.isWinner}
              />
            ))}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}

function ShowdownCard({
  ticker,
  assetType,
  isWinner,
}: {
  ticker: string;
  assetType: string;
  isWinner: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 34,
        border: isWinner ? '3px solid rgba(0,255,136,0.82)' : '2px solid rgba(20,29,24,0.12)',
        background: isWinner
          ? 'linear-gradient(180deg, rgba(213,247,225,0.96), rgba(232,255,240,0.9))'
          : 'linear-gradient(180deg, rgba(248,248,248,0.96), rgba(242,244,247,0.92))',
        padding: '24px 28px 26px',
        boxShadow: isWinner ? '0 24px 72px rgba(0,255,136,0.16)' : '0 18px 48px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          color: isWinner ? '#0a3b24' : '#6f7888',
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        {isWinner ? 'Top Performer' : 'Challenger'}
      </div>
      <div
        style={{
          marginTop: 16,
          color: isWinner ? '#0b3a24' : '#6f7888',
          fontSize: 72,
          lineHeight: 0.94,
          fontWeight: 900,
          letterSpacing: '-0.06em',
        }}
      >
        {ticker}
      </div>
      <div
        style={{
          marginTop: 18,
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 999,
          background: isWinner ? '#18aa4e' : 'rgba(111,120,136,0.14)',
          color: isWinner ? '#f5fff8' : '#6f7888',
          padding: '12px 20px',
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {isWinner ? 'Winner' : assetType}
      </div>
    </div>
  );
}
