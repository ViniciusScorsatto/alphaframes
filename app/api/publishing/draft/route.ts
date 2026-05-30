import {NextResponse} from 'next/server';
import {z} from 'zod';
import {generatePublishingDraft} from '@/lib/publishing';
import type {AnyGeneratedVideoData, PublishingDraftResponsePayload} from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  job: z.discriminatedUnion('kind', [
    z.object({kind: z.literal('single')}).passthrough(),
    z.object({kind: z.literal('comparison')}).passthrough(),
    z.object({kind: z.literal('market')}).passthrough(),
  ]),
  extraContext: z.string().max(2000).optional(),
  copyModelInstructions: z.string().max(2000).optional(),
  outputRenderPath: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = await generatePublishingDraft({
      job: body.job as unknown as AnyGeneratedVideoData,
      extraContext: body.extraContext,
      copyModelInstructions: body.copyModelInstructions,
      outputRenderPath: body.outputRenderPath,
    });

    return NextResponse.json<PublishingDraftResponsePayload>({
      ok: true,
      draft: result.draft,
      metadata: result.metadata,
      model: result.model,
      templateName: result.templateName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate publishing draft.';
    return NextResponse.json({ok: false, error: message}, {status: 400});
  }
}
