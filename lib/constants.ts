import type {DcaCadence, LookbackWindow, TemplateId} from '@/types';

export const TEMPLATE_OPTIONS: {label: string; value: TemplateId; description: string}[] = [
  {
    value: 'LAST_30_DAYS',
    label: 'Last 30 Days',
    description: 'Shows how an investment moved over the past month.',
  },
  {
    value: 'LAST_1_YEAR',
    label: 'Last 1 Year',
    description: 'Highlights yearly momentum and outcome.',
  },
  {
    value: 'BEST_DAY_TO_BUY',
    label: 'Best Day To Buy',
    description: 'Finds the lowest entry point in the selected lookback.',
  },
  {
    value: 'DCA_STRATEGY',
    label: 'DCA Strategy',
    description: 'Simulates spreading the investment over time.',
  },
  {
    value: 'THEN_VS_NOW',
    label: 'Then Vs Now',
    description: 'Compares the earliest tracked price to today.',
  },
  {
    value: 'COMPARE_ASSETS',
    label: 'Compare Assets',
    description: 'Puts two assets head-to-head over the same historical window.',
  },
  {
    value: 'MARKET_SNAPSHOT',
    label: 'Market Snapshot',
    description: 'CoinGecko-only daily market overview using top-50 crypto breadth and category context.',
  },
  {
    value: 'NARRATIVE_DETECTOR',
    label: 'Narrative Detector',
    description: 'Finds the strongest crypto category and summarizes relative market rotation.',
  },
  {
    value: 'ANOMALY_DETECTOR',
    label: 'Anomaly Detector',
    description: 'Flags coins showing unusual price and volume behaviour from batched market data.',
  },
  {
    value: 'VOLATILITY_REGIME',
    label: 'Volatility Regime',
    description: 'Classifies the current market environment as low, medium, or high volatility.',
  },
  {
    value: 'PATTERN_MATCH',
    label: 'Pattern Match',
    description: 'Compares the latest crypto spikes with similar historical moves from CoinGecko history.',
  },
];

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 420,
};

export const LOOKBACK_OPTIONS: {label: string; value: LookbackWindow}[] = [
  {label: '30 Days', value: 30},
  {label: '90 Days', value: 90},
  {label: '180 Days', value: 180},
  {label: '1 Year', value: 365},
  {label: 'Max History', value: 'max'},
];

export const DCA_CADENCE_OPTIONS: {label: string; value: DcaCadence}[] = [
  {label: 'Weekly', value: 'weekly'},
  {label: 'Biweekly', value: 'biweekly'},
  {label: 'Monthly', value: 'monthly'},
];
