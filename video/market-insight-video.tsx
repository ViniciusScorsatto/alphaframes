import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {
  getMusicDuckEndFrame,
  getMusicStaticPath,
  MARKET_MUSIC_DUCKED_VOLUME,
  MARKET_MUSIC_NORMAL_VOLUME,
  MARKET_VOICEOVER_VOLUME,
  toPublicStaticPath,
} from '../lib/audio-timing';
import type {MarketTemplateData} from '@/types';
import {BrandWatermarkScene} from './scenes/brand-watermark-scene';
import {CallToActionScene} from './scenes/call-to-action-scene';
import {DisclaimerScene} from './scenes/disclaimer-scene';
import {LogoIntroScene} from './scenes/logo-intro-scene';
import {MarketInsightSummaryScene} from './scenes/market-insight-summary-scene';
import {SHORT_TIMING} from './timing';

function getMarketIntroCopy(data: MarketTemplateData) {
  const ticker = data.signal_metadata?.coinTicker ?? data.asset;
  const firstStat = data.supporting_stats[0];
  const volumeStat = data.supporting_stats.find((stat) => stat.label.toLowerCase().includes('volume'));
  const resultTease = volumeStat ? `${volumeStat.label}: ${volumeStat.value}` : (firstStat?.value ?? 'Market signal');

  if (data.template === 'SILENT_ACCUMULATION' && firstStat) {
    return {
      hookTitle: `${ticker} ${firstStat.value} but volume stayed active`,
      resultTease,
      hookSubtitle: 'Silent accumulation is a signal, not confirmation.',
    };
  }

  return {
    hookTitle: data.headline,
    resultTease,
    hookSubtitle: data.narrative_text,
  };
}

export function MarketInsightVideo({data}: {data: MarketTemplateData}) {
  const introDuration = SHORT_TIMING.introDuration;
  const contentStart = SHORT_TIMING.contentStart;
  const introCopy = getMarketIntroCopy(data);
  const primaryStatValue = Number((data.supporting_stats[0]?.value ?? '0').replace(/[^0-9.+-]/g, ''));
  const resultTone = primaryStatValue > 0 ? 'gain' : primaryStatValue < 0 ? 'loss' : 'neutral';
  const musicDuckEndFrame = getMusicDuckEndFrame(data);
  const musicPath = getMusicStaticPath(data);
  const voiceoverPath = toPublicStaticPath(data.voiceoverUrl);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at top, rgba(0,255,136,0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(255,77,77,0.10), transparent 28%), #000',
      }}
    >
      {musicDuckEndFrame > 0 ? (
        <>
          <Sequence durationInFrames={musicDuckEndFrame}>
            <Audio src={staticFile(musicPath)} volume={MARKET_MUSIC_DUCKED_VOLUME} />
          </Sequence>
          <Sequence from={musicDuckEndFrame}>
            <Audio
              src={staticFile(musicPath)}
              trimBefore={musicDuckEndFrame}
              volume={MARKET_MUSIC_NORMAL_VOLUME}
            />
          </Sequence>
        </>
      ) : (
        <Audio src={staticFile(musicPath)} volume={MARKET_MUSIC_NORMAL_VOLUME} />
      )}
      {voiceoverPath ? <Audio src={staticFile(voiceoverPath)} volume={MARKET_VOICEOVER_VOLUME} /> : null}
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
          hookTitle={introCopy.hookTitle}
          resultTease={introCopy.resultTease}
          resultTone={resultTone}
          hookSubtitle={introCopy.hookSubtitle}
          durationInFrames={introDuration}
        />
      </Sequence>
      <Sequence from={contentStart}>
        <BrandWatermarkScene />
      </Sequence>
      <Sequence from={contentStart}>
        <MarketInsightSummaryScene data={data} />
      </Sequence>
      <CallToActionScene
        title={`Save this ${data.signal_metadata?.coinTicker ?? 'market'} breakdown`}
        subtitle="Crypto market anomalies in one visual."
        footer="Follow AlphaFrames"
      />
      <DisclaimerScene startFrame={SHORT_TIMING.disclaimerStart} />
    </AbsoluteFill>
  );
}
