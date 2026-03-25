import type {AnyGeneratedVideoData, DcaCadence, LookbackWindow, NormalizedAssetData, TemplateId} from '@/types';
import {bestDayToBuyTemplate} from '@/templates/best-day-to-buy';
import {compareAssetsTemplate} from '@/templates/compare-assets';
import {dcaStrategyTemplate} from '@/templates/dca-strategy';
import {last1YearTemplate} from '@/templates/last-1-year';
import {last30DaysTemplate} from '@/templates/last-30-days';
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
};

export function generateTemplateData(
  asset: NormalizedAssetData,
  template: TemplateId,
  investment: number,
  lookbackWindow?: LookbackWindow,
  dcaCadence?: DcaCadence,
) {
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
