import {Composition} from 'remotion';
import {ComparisonAssetVideo} from '../video/comparison-asset-video';
import {MarketInsightVideo} from '../video/market-insight-video';
import type {GeneratedVideoData, MarketTemplateData} from '../types';
import {VIDEO} from '../lib/constants';
import {FinancialAssetVideo} from '../video/financial-asset-video';

const defaultProps: GeneratedVideoData = {
  kind: 'single',
  asset: 'BTC',
  assetType: 'crypto',
  assetName: 'Bitcoin',
  template: 'LAST_30_DAYS',
  currency: 'USD',
  investment: 1000,
  startDate: '2026-02-01',
  endDate: '2026-03-01',
  startPrice: 42000,
  currentPrice: 47000,
  return: 11.9,
  valueToday: 1119,
  hookLabel: '$1,000 -> $1,119',
  contextLabel: 'Bitcoin in the last 30 days',
  resultLabel: 'BTC 30-day return',
  timeline: [
    {date: '2026-02-01', timestamp: 1, price: 42000},
    {date: '2026-02-08', timestamp: 2, price: 43200},
    {date: '2026-02-15', timestamp: 3, price: 43900},
    {date: '2026-02-22', timestamp: 4, price: 45200},
    {date: '2026-03-01', timestamp: 5, price: 47000},
  ],
  insights: ['Bitcoin turned $1,000 into $1,119 over the last month.'],
};

const defaultMarketProps: MarketTemplateData = {
  kind: 'market',
  asset: 'CRYPTO_MARKET',
  assetName: 'Crypto Market',
  template: 'SILENT_ACCUMULATION',
  currency: 'USD',
  generated_at: '2026-04-19',
  headline: 'Unusual accumulation detected in ETH',
  supporting_stats: [
    {label: '24h change', value: '+0.84%'},
    {label: 'Volume ratio', value: '0.0842'},
    {label: '24h volume', value: '$3,481,000,000'},
  ],
  narrative_text: 'Volume is increasing while price remains stable. This pattern has historically appeared before larger directional moves.',
  confidence: 0.68,
  risk_label: 'medium',
  data_points: {
    price_change_24h: 0.84,
    volume_ratio: 0.0842,
    volume_usd: 3481000000,
  },
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FinancialAssetVideo"
        component={FinancialAssetVideo}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{data: defaultProps}}
      />
      <Composition
        id="ComparisonAssetVideo"
        component={ComparisonAssetVideo}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{
          data: {
            kind: 'comparison',
            asset: 'BTC-VS-VOO',
            assetName: 'Bitcoin vs Vanguard S&P 500 ETF',
            template: 'COMPARE_ASSETS',
            investment: 1000,
            currency: 'USD',
            startDate: '2026-01-01',
            endDate: '2026-03-01',
            hookLabel: 'BTC vs VOO',
            contextLabel: '$1,000 in each asset over the same period',
            resultLabel: 'BTC wins by +8.20%',
            insights: ['BTC outperformed by +8.20% over the same window.'],
            primaryAsset: {
              ticker: 'BTC',
              assetType: 'crypto',
              name: 'Bitcoin',
              startPrice: 90000,
              currentPrice: 102000,
              return: 13.33,
              valueToday: 1133,
              color: '#00FF88',
            },
            secondaryAsset: {
              ticker: 'VOO',
              assetType: 'etf',
              name: 'Vanguard S&P 500 ETF',
              startPrice: 500,
              currentPrice: 525,
              return: 5,
              valueToday: 1050,
              color: '#5DA9FF',
            },
            winnerTicker: 'BTC',
            deltaReturn: 8.33,
            comparisonTimeline: [
              {date: '2026-01-01', timestamp: 1, primaryValue: 1000, secondaryValue: 1000},
              {date: '2026-01-15', timestamp: 2, primaryValue: 1040, secondaryValue: 1010},
              {date: '2026-02-01', timestamp: 3, primaryValue: 1090, secondaryValue: 1028},
              {date: '2026-02-15', timestamp: 4, primaryValue: 1060, secondaryValue: 1038},
              {date: '2026-03-01', timestamp: 5, primaryValue: 1133, secondaryValue: 1050},
            ],
          },
        }}
      />
      <Composition
        id="MarketInsightVideo"
        component={MarketInsightVideo}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{data: defaultMarketProps}}
      />
    </>
  );
};
