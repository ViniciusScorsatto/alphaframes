import {NextResponse} from 'next/server';
import {z} from 'zod';
import {fetchTopCoinsMarketData} from '@/data/coingecko-market';
import {getAssetData} from '@/data';
import {generateComparisonAnalystNote, generateSingleAssetAnalystNote} from '@/lib/asset-narrative';
import {addVoiceoverToItem} from '@/lib/google-tts';
import {generateComparisonData, generateMarketTemplateItems, generateTemplateData, isMarketTemplate} from '@/templates';
import type {GenerateResponsePayload} from '@/types';

export const runtime = 'nodejs';

const requestItemSchema = z.object({
  ticker: z.string().trim().min(1).regex(/^[A-Za-z0-9.\-]+$/),
  assetType: z.enum(['crypto', 'stock', 'etf']),
});

const requestSchema = z
  .object({
    tickers: z.array(requestItemSchema),
    template: z.enum([
      'LAST_30_DAYS',
      'LAST_1_YEAR',
      'BEST_DAY_TO_BUY',
      'DCA_STRATEGY',
      'THEN_VS_NOW',
      'COMPARE_ASSETS',
      'MARKET_SNAPSHOT',
      'NARRATIVE_DETECTOR',
      'ANOMALY_DETECTOR',
      'VOLATILITY_REGIME',
      'PATTERN_MATCH',
      'SILENT_ACCUMULATION',
      'EXHAUSTION_MOVE',
      'DIVERGENCE_DETECTOR',
    ]),
    investment: z.number().positive(),
    lookbackWindow: z.union([z.literal(30), z.literal(90), z.literal(180), z.literal(365), z.literal('max')]).optional(),
    dcaCadence: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
    comparison: z
      .object({
        primary: requestItemSchema,
        secondary: requestItemSchema,
      })
      .optional(),
  })
  .superRefine((body, ctx) => {
    if (isMarketTemplate(body.template)) {
      return;
    }

    if (body.template === 'COMPARE_ASSETS') {
      if (!body.comparison) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Comparison mode requires two selected assets.',
          path: ['comparison'],
        });
      }
      return;
    }

    if (body.tickers.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one ticker.',
        path: ['tickers'],
      });
    }
  });

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    if (isMarketTemplate(body.template)) {
      const [items, dataset] = await Promise.all([generateMarketTemplateItems(body.template), fetchTopCoinsMarketData()]);
      const itemsWithVoiceover = await Promise.all(items.map((item) => addVoiceoverToItem(item)));

      return NextResponse.json<GenerateResponsePayload>({
        items: itemsWithVoiceover,
        marketContext: {
          dataset: dataset.map((coin) => ({
            id: coin.id,
            ticker: coin.ticker,
            name: coin.name,
            marketCap: coin.marketCap,
            totalVolume: coin.totalVolume,
            change24h: coin.change24h,
            change7d: coin.change7d,
          })),
        },
      });
    }

    if (body.template === 'COMPARE_ASSETS') {
      if (!body.comparison) {
        throw new Error('Comparison mode requires two selected assets.');
      }

      const [primary, secondary] = await Promise.all([
        getAssetData(body.comparison.primary.ticker, body.comparison.primary.assetType),
        getAssetData(body.comparison.secondary.ticker, body.comparison.secondary.assetType),
      ]);
      const comparison = generateComparisonData(primary, secondary, body.investment, body.lookbackWindow);
      const analystNote = await generateComparisonAnalystNote(comparison);

      return NextResponse.json<GenerateResponsePayload>({
        items: [
          await addVoiceoverToItem({
            ...comparison,
            analystNote,
          }),
        ],
      });
    }

    const items = await Promise.all(
      body.tickers.map(async ({ticker, assetType}) => {
        const asset = await getAssetData(ticker, assetType);
        const generated = generateTemplateData(asset, body.template, body.investment, body.lookbackWindow, body.dcaCadence);
        if (generated.kind !== 'single') {
          throw new Error('Unexpected non-single template output.');
        }
        const analystNote = await generateSingleAssetAnalystNote(generated);
        return addVoiceoverToItem({
          ...generated,
          analystNote,
        });
      }),
    );

    return NextResponse.json<GenerateResponsePayload>({items});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate video data.';
    return NextResponse.json({error: message}, {status: 400});
  }
}
