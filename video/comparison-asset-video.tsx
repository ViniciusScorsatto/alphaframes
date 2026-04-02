import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import type {ComparisonVideoData} from '../types';
import {getComparisonIntroCopy} from './intro-copy';
import {BrandWatermarkScene} from './scenes/brand-watermark-scene';
import {ComparisonChartScene} from './scenes/comparison-chart-scene';
import {ComparisonHeaderScene} from './scenes/comparison-header-scene';
import {ComparisonStatsScene} from './scenes/comparison-stats-scene';
import {DisclaimerScene} from './scenes/disclaimer-scene';
import {LogoIntroScene} from './scenes/logo-intro-scene';

export function ComparisonAssetVideo({data}: {data: ComparisonVideoData}) {
  const introCopy = getComparisonIntroCopy(data);
  const introDuration = 72;
  const contentStart = 60;

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at top left, rgba(0,255,136,0.16), transparent 25%), radial-gradient(circle at bottom right, rgba(93,169,255,0.16), transparent 30%), #000',
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
          hookTitle={introCopy.hookTitle}
          resultTease={introCopy.resultTease}
          resultTone={introCopy.resultTone}
          hookSubtitle={introCopy.hookSubtitle}
        />
      </Sequence>
      <Sequence from={contentStart}>
        <BrandWatermarkScene />
      </Sequence>
      <Sequence from={contentStart}>
        <ComparisonHeaderScene data={data} />
      </Sequence>
      <Sequence from={contentStart}>
        <ComparisonChartScene data={data} />
      </Sequence>
      <Sequence from={contentStart}>
        <ComparisonStatsScene data={data} />
      </Sequence>
      <DisclaimerScene />
    </AbsoluteFill>
  );
}
