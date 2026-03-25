import type {TemplateId} from '@/types';

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
];

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 360,
};
