import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {formatCurrency} from '../lib/utils';
import type {GeneratedVideoData} from '../types';
import {getSingleIntroCopy} from './intro-copy';
import {BrandWatermarkScene} from './scenes/brand-watermark-scene';
import {ContextScene} from './scenes/context-scene';
import {GrowthScene} from './scenes/growth-scene';
import {HookScene} from './scenes/hook-scene';
import {DisclaimerScene} from './scenes/disclaimer-scene';
import {LogoIntroScene} from './scenes/logo-intro-scene';
import {ResultScene} from './scenes/result-scene';
import {TimelineScene} from './scenes/timeline-scene';

export function FinancialAssetVideo({data}: {data: GeneratedVideoData}) {
  const introCopy = getSingleIntroCopy(data);

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
      <Sequence from={0} durationInFrames={60}>
        <LogoIntroScene hookTitle={introCopy.hookTitle} hookSubtitle={introCopy.hookSubtitle} />
      </Sequence>
      <Sequence from={48}>
        <BrandWatermarkScene />
      </Sequence>
      <Sequence from={48}>
        <HookScene label={data.hookLabel} />
      </Sequence>
      <Sequence from={48}>
        <ContextScene
          label={data.contextLabel}
          investmentLabel={formatCurrency(data.investment, data.currency)}
        />
      </Sequence>
      <Sequence from={48}>
        <TimelineScene points={data.timeline} currency={data.currency} bestBuyDate={data.bestBuyDate} />
      </Sequence>
      <Sequence from={48}>
        <GrowthScene valueToday={data.valueToday} returnPercent={data.return} currency={data.currency} />
      </Sequence>
      <Sequence from={48}>
        <ResultScene label={data.resultLabel} insights={data.insights} />
      </Sequence>
      <DisclaimerScene />
    </AbsoluteFill>
  );
}
