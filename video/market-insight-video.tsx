import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import type {MarketTemplateData} from '@/types';
import {BrandWatermarkScene} from './scenes/brand-watermark-scene';
import {CallToActionScene} from './scenes/call-to-action-scene';
import {DisclaimerScene} from './scenes/disclaimer-scene';
import {LogoIntroScene} from './scenes/logo-intro-scene';
import {MarketInsightSummaryScene} from './scenes/market-insight-summary-scene';

export function MarketInsightVideo({data}: {data: MarketTemplateData}) {
  const introDuration = 148;
  const contentStart = 112;
  const primaryStatValue = Number((data.supporting_stats[0]?.value ?? '0').replace(/[^0-9.+-]/g, ''));
  const resultTone = primaryStatValue > 0 ? 'gain' : primaryStatValue < 0 ? 'loss' : 'neutral';

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at top, rgba(0,255,136,0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(255,77,77,0.10), transparent 28%), #000',
      }}
    >
      <Audio src={staticFile('audio/make-money-money.mp3')} volume={0.14} />
      <AbsoluteFill style={{opacity: 0.12}}>
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
      <Sequence from={0} durationInFrames={introDuration}>
        <LogoIntroScene
          hookTitle={data.headline}
          resultTease={data.supporting_stats[0]?.value ?? 'CoinGecko market read'}
          resultTone={resultTone}
          hookSubtitle={data.narrative_text}
          durationInFrames={introDuration}
        />
      </Sequence>
      <Sequence from={contentStart}>
        <BrandWatermarkScene />
      </Sequence>
      <Sequence from={contentStart}>
        <MarketInsightSummaryScene data={data} />
      </Sequence>
      <CallToActionScene />
      <DisclaimerScene startFrame={0} />
    </AbsoluteFill>
  );
}
