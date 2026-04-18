import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {MarketTemplateData} from '@/types';
import {videoTheme} from '../theme';

function getRiskColor(risk: MarketTemplateData['risk_label']) {
  if (risk === 'high') {
    return videoTheme.loss;
  }

  if (risk === 'medium') {
    return '#F5C451';
  }

  return videoTheme.gain;
}

export function MarketInsightSummaryScene({data}: {data: MarketTemplateData}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({
    frame: Math.max(frame - 20, 0),
    fps,
    config: {damping: 18, stiffness: 120},
  });
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const riskColor = getRiskColor(data.risk_label);

  return (
    <AbsoluteFill
      style={{
        padding: '140px 64px 220px',
        opacity,
        transform: `translateY(${28 - rise * 28}px)`,
      }}
    >
      <div
        style={{
          color: videoTheme.secondary,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        Crypto market intelligence
      </div>
      <div
        style={{
          marginTop: 22,
          color: videoTheme.foreground,
          fontSize: 78,
          lineHeight: 0.96,
          fontWeight: 900,
          letterSpacing: '-0.06em',
          maxWidth: 920,
        }}
      >
        {data.headline}
      </div>

      <div style={{marginTop: 42, display: 'grid', gap: 18}}>
        {data.supporting_stats.slice(0, 3).map((stat) => (
          <div
            key={stat.label}
            style={{
              borderRadius: 28,
              border: `1px solid ${videoTheme.border}`,
              background: 'rgba(255,255,255,0.05)',
              padding: '24px 28px',
            }}
          >
            <div
              style={{
                color: videoTheme.secondary,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                marginTop: 10,
                color: videoTheme.foreground,
                fontSize: 44,
                fontWeight: 800,
                letterSpacing: '-0.04em',
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 30,
          borderRadius: 32,
          border: `1px solid ${videoTheme.border}`,
          background: 'rgba(255,255,255,0.05)',
          padding: '28px 30px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              color: videoTheme.secondary,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Narrative
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <Pill label={`Confidence ${(data.confidence * 100).toFixed(0)}%`} color={videoTheme.foreground} />
            <Pill label={`Risk ${data.risk_label}`} color={riskColor} />
          </div>
        </div>
        <div
          style={{
            marginTop: 18,
            color: videoTheme.foreground,
            fontSize: 34,
            lineHeight: 1.28,
            maxWidth: 900,
          }}
        >
          {data.narrative_text}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Pill({label, color}: {label: string; color: string}) {
  return (
    <div
      style={{
        borderRadius: 999,
        border: `1px solid ${color}33`,
        background: `${color}18`,
        color,
        padding: '10px 16px',
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  );
}
