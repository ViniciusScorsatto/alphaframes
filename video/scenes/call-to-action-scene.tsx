import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {videoTheme} from '../theme';

export function CallToActionScene() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ctaStart = 328;
  const backgroundOpacity = interpolate(frame, [ctaStart, ctaStart + 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lift = spring({
    frame: Math.max(frame - ctaStart, 0),
    fps,
    config: {damping: 18, stiffness: 120},
  });
  const contentOpacity = interpolate(frame, [ctaStart + 8, ctaStart + 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const glowOpacity = interpolate(frame, [ctaStart, ctaStart + 16, ctaStart + 64], [0, 0.85, 0.65], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const panelOpacity = interpolate(frame, [ctaStart, ctaStart + 14, 420], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '0 54px',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, #f8fffb 0%, #f2fff8 54%, #f2fff8 100%)',
          opacity: panelOpacity * backgroundOpacity,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(0,255,136,0.22), transparent 22%), radial-gradient(circle at 82% 16%, rgba(0,0,0,0.08), transparent 22%), radial-gradient(circle at 50% 42%, rgba(255,255,255,0.96), transparent 56%)',
          opacity: panelOpacity * backgroundOpacity,
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          opacity: glowOpacity * backgroundOpacity,
        }}
      >
        <div
          style={{
            width: 780,
            height: 220,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(0,255,136,0.18), rgba(0,255,136,0) 72%)',
          }}
        />
      </AbsoluteFill>
      <div
        style={{
          width: '100%',
          opacity: contentOpacity,
          transform: `translateY(${24 - lift * 24}px)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: 980,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            borderRadius: 999,
            background: 'rgba(0,255,136,0.16)',
            color: '#0f6b40',
            padding: '14px 20px',
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          AlphaFrames
        </div>
        <div
          style={{
            marginTop: 30,
            color: '#07140d',
            fontSize: 112,
            lineHeight: 0.9,
            fontWeight: 900,
            letterSpacing: '-0.07em',
            maxWidth: 920,
            textWrap: 'balance',
          }}
        >
          Follow for more
          <br />
          market breakdowns
        </div>
        <div
          style={{
            marginTop: 26,
            color: 'rgba(7,20,13,0.66)',
            fontSize: 42,
            lineHeight: 1.2,
            fontWeight: 600,
            maxWidth: 860,
          }}
        >
          Daily investing visuals, chart stories, and head-to-head comparisons.
        </div>
        <div
          style={{
            marginTop: 54,
            width: '100%',
            height: 2,
            background: 'linear-gradient(90deg, rgba(15,107,64,0.36), rgba(15,107,64,0.04))',
          }}
        />
        <div
          style={{
            marginTop: 28,
            color: 'rgba(7,20,13,0.5)',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Save this video and follow AlphaFrames
        </div>
      </div>
    </AbsoluteFill>
  );
}
