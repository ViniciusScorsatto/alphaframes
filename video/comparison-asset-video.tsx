import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import type {ComparisonVideoData} from '../types';
import {ComparisonChartScene} from './scenes/comparison-chart-scene';
import {ComparisonHeaderScene} from './scenes/comparison-header-scene';
import {ComparisonStatsScene} from './scenes/comparison-stats-scene';
import {LogoIntroScene} from './scenes/logo-intro-scene';

export function ComparisonAssetVideo({data}: {data: ComparisonVideoData}) {
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
      <Sequence from={0} durationInFrames={60}>
        <LogoIntroScene />
      </Sequence>
      <Sequence from={48}>
        <ComparisonHeaderScene data={data} />
      </Sequence>
      <Sequence from={48}>
        <ComparisonChartScene data={data} />
      </Sequence>
      <Sequence from={48}>
        <ComparisonStatsScene data={data} />
      </Sequence>
    </AbsoluteFill>
  );
}
