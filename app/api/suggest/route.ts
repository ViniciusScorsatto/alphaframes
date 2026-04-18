import {NextResponse} from 'next/server';
import {z} from 'zod';
import {suggestContentIdeas} from '@/lib/ideas';
import type {AnyGeneratedVideoData} from '@/types';

const requestSchema = z.object({
  item: z.discriminatedUnion('kind', [
    z.object({
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
      bestBuyDate: z.string().optional(),
      bestBuyPrice: z.number().optional(),
      sharesAccumulated: z.number().optional(),
    }),
    z.object({
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
    }),
    z.object({
      kind: z.literal('market'),
      asset: z.literal('CRYPTO_MARKET'),
      assetName: z.literal('Crypto Market'),
      template: z.enum(['MARKET_SNAPSHOT', 'NARRATIVE_DETECTOR', 'ANOMALY_DETECTOR', 'VOLATILITY_REGIME', 'PATTERN_MATCH']),
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
    }),
  ]),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const ideas = suggestContentIdeas(body.item as AnyGeneratedVideoData);
    return NextResponse.json({ideas});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to suggest content ideas.';
    return NextResponse.json({error: message}, {status: 400});
  }
}
