import {NextResponse} from 'next/server';
import {buildYouTubeOAuthUrl} from '@/lib/youtube-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    return NextResponse.json({
      ok: true,
      ...buildYouTubeOAuthUrl(request.url),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate YouTube OAuth URL.';
    return NextResponse.json({ok: false, error: message}, {status: 400});
  }
}
