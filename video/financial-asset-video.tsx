import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {
  getMusicStaticPath,
  getMusicDuckEndFrame,
  MUSIC_DUCKED_VOLUME,
  MUSIC_NORMAL_VOLUME,
  toPublicStaticPath,
  VOICEOVER_VOLUME,
} from '../lib/audio-timing';
import {formatCurrency} from '../lib/utils';
import type {GeneratedVideoData} from '../types';
import {getSingleIntroCopy} from './intro-copy';
import {BrandWatermarkScene} from './scenes/brand-watermark-scene';
import {CallToActionScene} from './scenes/call-to-action-scene';
import {ContextScene} from './scenes/context-scene';
import {GrowthScene} from './scenes/growth-scene';
import {HookScene} from './scenes/hook-scene';
import {DisclaimerScene} from './scenes/disclaimer-scene';
import {LogoIntroScene} from './scenes/logo-intro-scene';
import {ResultScene} from './scenes/result-scene';
import {TimelineScene} from './scenes/timeline-scene';
import {SHORT_TIMING} from './timing';

export function FinancialAssetVideo({data}: {data: GeneratedVideoData}) {
  const introCopy = getSingleIntroCopy(data);
  const introDuration = SHORT_TIMING.introDuration;
  const contentStart = SHORT_TIMING.contentStart;
  const musicDuckEndFrame = getMusicDuckEndFrame(data);
  const musicPath = getMusicStaticPath(data);
  const voiceoverPath = toPublicStaticPath(data.voiceoverUrl);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at top, rgba(0,255,136,0.18), transparent 25%), radial-gradient(circle at bottom right, rgba(255,77,77,0.12), transparent 28%), #000',
      }}
    >
      {voiceoverPath ? <Audio src={staticFile(voiceoverPath)} volume={VOICEOVER_VOLUME} /> : null}
      {musicDuckEndFrame > 0 ? (
        <>
          <Sequence durationInFrames={musicDuckEndFrame}>
            <Audio src={staticFile(musicPath)} volume={MUSIC_DUCKED_VOLUME} />
          </Sequence>
          <Sequence from={musicDuckEndFrame}>
            <Audio
              src={staticFile(musicPath)}
              trimBefore={musicDuckEndFrame}
              volume={MUSIC_NORMAL_VOLUME}
            />
          </Sequence>
        </>
      ) : (
        <Audio src={staticFile(musicPath)} volume={MUSIC_NORMAL_VOLUME} />
      )}
      <AbsoluteFill style={{opacity: 0.14}}>
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </AbsoluteFill>
      <Sequence from={0} durationInFrames={introDuration}>
        <LogoIntroScene
          hookTitle={introCopy.hookTitle}
          resultTease={introCopy.resultTease}
          resultTone={introCopy.resultTone}
          hookSubtitle={introCopy.hookSubtitle}
          durationInFrames={introDuration}
        />
      </Sequence>
      <Sequence from={contentStart}>
        <BrandWatermarkScene />
      </Sequence>
      <Sequence from={contentStart}>
        <HookScene label={data.hookLabel} />
      </Sequence>
      <Sequence from={contentStart}>
        <ContextScene
          label={data.contextLabel}
          investmentLabel={formatCurrency(data.investment, data.currency)}
        />
      </Sequence>
      <Sequence from={contentStart}>
        <TimelineScene points={data.timeline} currency={data.currency} bestBuyDate={data.bestBuyDate} />
      </Sequence>
      <Sequence from={contentStart}>
        <GrowthScene valueToday={data.valueToday} returnPercent={data.return} currency={data.currency} />
      </Sequence>
      <Sequence from={contentStart}>
        <ResultScene label={data.resultLabel} insights={data.insights} analystNote={data.analystNote} />
      </Sequence>
      <CallToActionScene
        title={`Save this ${data.asset} snapshot`}
        subtitle="Track the move, not the noise."
        footer="Follow AlphaFrames"
      />
      <DisclaimerScene startFrame={SHORT_TIMING.disclaimerStart} />
    </AbsoluteFill>
  );
}
