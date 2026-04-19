import type {AnyGeneratedVideoData, DcaCadence, LookbackWindow, MarketTemplateId, NormalizedAssetData, TemplateId} from '@/types';
import {bestDayToBuyTemplate} from '@/templates/best-day-to-buy';
import {compareAssetsTemplate} from '@/templates/compare-assets';
import {dcaStrategyTemplate} from '@/templates/dca-strategy';
import {last1YearTemplate} from '@/templates/last-1-year';
import {last30DaysTemplate} from '@/templates/last-30-days';
import {generateMarketTemplateData, generateMarketTemplateItems} from '@/templates/market-insights';
import {thenVsNowTemplate} from '@/templates/then-vs-now';

type TemplateFn = (
  asset: NormalizedAssetData,
  investment: number,
  lookbackWindow?: LookbackWindow,
  dcaCadence?: DcaCadence,
) => AnyGeneratedVideoData;

const templateMap: Record<Exclude<TemplateId, 'COMPARE_ASSETS'>, TemplateFn> = {
  LAST_30_DAYS: last30DaysTemplate,
  LAST_1_YEAR: last1YearTemplate,
  BEST_DAY_TO_BUY: bestDayToBuyTemplate,
  DCA_STRATEGY: dcaStrategyTemplate,
  THEN_VS_NOW: thenVsNowTemplate,
  MARKET_SNAPSHOT: () => {
    throw new Error('MARKET_SNAPSHOT uses the market template generator.');
  },
  NARRATIVE_DETECTOR: () => {
    throw new Error('NARRATIVE_DETECTOR uses the market template generator.');
  },
  ANOMALY_DETECTOR: () => {
    throw new Error('ANOMALY_DETECTOR uses the market template generator.');
  },
  VOLATILITY_REGIME: () => {
    throw new Error('VOLATILITY_REGIME uses the market template generator.');
  },
  PATTERN_MATCH: () => {
    throw new Error('PATTERN_MATCH uses the market template generator.');
  },
  SILENT_ACCUMULATION: () => {
    throw new Error('SILENT_ACCUMULATION uses the market template generator.');
  },
  EXHAUSTION_MOVE: () => {
    throw new Error('EXHAUSTION_MOVE uses the market template generator.');
  },
  DIVERGENCE_DETECTOR: () => {
    throw new Error('DIVERGENCE_DETECTOR uses the market template generator.');
  },
};

export function isMarketTemplate(template: TemplateId): template is MarketTemplateId {
  return [
    'MARKET_SNAPSHOT',
    'NARRATIVE_DETECTOR',
    'ANOMALY_DETECTOR',
    'VOLATILITY_REGIME',
    'PATTERN_MATCH',
    'SILENT_ACCUMULATION',
    'EXHAUSTION_MOVE',
    'DIVERGENCE_DETECTOR',
  ].includes(template);
}

export function generateTemplateData(
  asset: NormalizedAssetData,
  template: TemplateId,
  investment: number,
  lookbackWindow?: LookbackWindow,
  dcaCadence?: DcaCadence,
) {
  if (isMarketTemplate(template)) {
    throw new Error(`${template} requires the market template generator.`);
  }

  if (template === 'COMPARE_ASSETS') {
    throw new Error('COMPARE_ASSETS requires two assets.');
  }

  const generator = templateMap[template];
  return generator(asset, investment, lookbackWindow, dcaCadence);
}

export function generateComparisonData(
  primary: NormalizedAssetData,
  secondary: NormalizedAssetData,
  investment: number,
  lookbackWindow?: LookbackWindow,
) {
  return compareAssetsTemplate(primary, secondary, investment, lookbackWindow);
}

export {generateMarketTemplateData, generateMarketTemplateItems};
