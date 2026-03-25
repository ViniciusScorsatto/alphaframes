import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getAssetData} from '@/data';
import {generateComparisonData, generateTemplateData} from '@/templates';
import type {GenerateResponsePayload} from '@/types';

export const runtime = 'nodejs';

const requestItemSchema = z.object({
  ticker: z.string().trim().min(1).regex(/^[A-Za-z0-9.\-]+$/),
  assetType: z.enum(['crypto', 'stock', 'etf']),
});

const requestSchema = z
  .object({
    tickers: z.array(requestItemSchema),
    template: z.enum(['LAST_30_DAYS', 'LAST_1_YEAR', 'BEST_DAY_TO_BUY', 'DCA_STRATEGY', 'THEN_VS_NOW', 'COMPARE_ASSETS']),
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
    if (body.template === 'COMPARE_ASSETS') {
      if (!body.comparison) {
        throw new Error('Comparison mode requires two selected assets.');
      }

      const [primary, secondary] = await Promise.all([
        getAssetData(body.comparison.primary.ticker, body.comparison.primary.assetType),
        getAssetData(body.comparison.secondary.ticker, body.comparison.secondary.assetType),
      ]);

      return NextResponse.json<GenerateResponsePayload>({
        items: [generateComparisonData(primary, secondary, body.investment, body.lookbackWindow)],
      });
    }

    const items = await Promise.all(
      body.tickers.map(async ({ticker, assetType}) => {
        const asset = await getAssetData(ticker, assetType);
        return generateTemplateData(asset, body.template, body.investment, body.lookbackWindow, body.dcaCadence);
      }),
    );

    return NextResponse.json<GenerateResponsePayload>({items});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate video data.';
    return NextResponse.json({error: message}, {status: 400});
  }
}
