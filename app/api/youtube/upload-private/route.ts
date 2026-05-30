import {NextResponse} from 'next/server';
import {z} from 'zod';
import {uploadPrivateYouTubeShort} from '@/lib/youtube-upload';
import type {PublishingDraft, YouTubePrivateUploadResponsePayload} from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const publishingDraftSchema = z.object({
  summary: z.string(),
  platforms: z.object({
    youtube: z.object({
      title: z.string().trim().min(1).max(100),
      description: z.string().trim().min(1).max(5000),
      tags: z.array(z.string().trim().min(1)).min(1),
      hashtags: z.array(z.string().trim().min(1)).min(1),
      thumbnailNotes: z.string(),
    }),
  }),
});

const requestSchema = z.object({
  renderUrl: z.string().min(1),
  draft: publishingDraftSchema,
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = await uploadPrivateYouTubeShort({
      renderUrl: body.renderUrl,
      draft: body.draft as PublishingDraft,
    });

    return NextResponse.json<YouTubePrivateUploadResponsePayload>({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to upload private video to YouTube.';
    return NextResponse.json({ok: false, error: message}, {status: 400});
  }
}
