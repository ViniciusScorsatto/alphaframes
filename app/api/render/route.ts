import {NextResponse} from 'next/server';
import {z} from 'zod';
import {renderVideos} from '@/lib/render-video';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const singleItemSchema = z.object({
  kind: z.literal('single'),
  asset: z.string(),
  assetType: z.enum(['crypto', 'stock', 'etf']),
  assetName: z.string(),
  template: z.enum(['LAST_30_DAYS', 'LAST_1_YEAR', 'BEST_DAY_TO_BUY', 'DCA_STRATEGY', 'THEN_VS_NOW']),
  currency: z.string(),
  investment: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  startPrice: z.number(),
  currentPrice: z.number(),
  return: z.number(),
  valueToday: z.number(),
  bestBuyDate: z.string().optional(),
  bestBuyPrice: z.number().optional(),
  sharesAccumulated: z.number().optional(),
  hookLabel: z.string(),
  contextLabel: z.string(),
  resultLabel: z.string(),
  timeline: z.array(
    z.object({
      date: z.string(),
      timestamp: z.number(),
      price: z.number(),
    }),
  ),
  insights: z.array(z.string()),
  analystNote: z.string().optional(),
});

const comparisonItemSchema = z.object({
  kind: z.literal('comparison'),
  asset: z.string(),
  assetName: z.string(),
  template: z.literal('COMPARE_ASSETS'),
  investment: z.number(),
  currency: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  hookLabel: z.string(),
  contextLabel: z.string(),
  resultLabel: z.string(),
  insights: z.array(z.string()),
  analystNote: z.string().optional(),
  primaryAsset: z.object({
    ticker: z.string(),
    assetType: z.enum(['crypto', 'stock', 'etf']),
    name: z.string(),
    startPrice: z.number(),
    currentPrice: z.number(),
    return: z.number(),
    valueToday: z.number(),
    color: z.string(),
  }),
  secondaryAsset: z.object({
    ticker: z.string(),
    assetType: z.enum(['crypto', 'stock', 'etf']),
    name: z.string(),
    startPrice: z.number(),
    currentPrice: z.number(),
    return: z.number(),
    valueToday: z.number(),
    color: z.string(),
  }),
  winnerTicker: z.string(),
  deltaReturn: z.number(),
  comparisonTimeline: z.array(
    z.object({
      date: z.string(),
      timestamp: z.number(),
      primaryValue: z.number(),
      secondaryValue: z.number(),
    }),
  ),
});

const marketItemSchema = z.object({
  kind: z.literal('market'),
  asset: z.string(),
  assetName: z.string(),
  template: z.enum([
    'MARKET_SNAPSHOT',
    'NARRATIVE_DETECTOR',
    'ANOMALY_DETECTOR',
    'VOLATILITY_REGIME',
    'PATTERN_MATCH',
    'SILENT_ACCUMULATION',
    'EXHAUSTION_MOVE',
    'DIVERGENCE_DETECTOR',
  ]),
  currency: z.literal('USD'),
  generated_at: z.string(),
  headline: z.string(),
  supporting_stats: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  ),
  narrative_text: z.string(),
  confidence: z.number(),
  risk_label: z.enum(['low', 'medium', 'high']),
  data_points: z.record(z.string(), z.unknown()),
});

const requestSchema = z.object({
  items: z.array(z.discriminatedUnion('kind', [singleItemSchema, comparisonItemSchema, marketItemSchema])),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const results = await renderVideos(body.items);
    return NextResponse.json({results});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to render video.';
    return NextResponse.json({error: message}, {status: 500});
  }
}
