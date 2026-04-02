import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
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

export function FinancialAssetVideo({data}: {data: GeneratedVideoData}) {
  const introCopy = getSingleIntroCopy(data);
  const introDuration = 172;
  const contentStart = 130;

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at top, rgba(0,255,136,0.18), transparent 25%), radial-gradient(circle at bottom right, rgba(255,77,77,0.12), transparent 28%), #000',
      }}
    >
      <Audio src={staticFile('audio/make-money-money.mp3')} volume={0.14} />
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
        <ResultScene label={data.resultLabel} insights={data.insights} />
      </Sequence>
      <CallToActionScene />
      <DisclaimerScene />
    </AbsoluteFill>
  );
}
