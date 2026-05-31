import {readFile, stat} from 'fs/promises';
import path from 'path';
import type {PublishingDraft} from '@/types';

const YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const RENDERS_DIR = path.join(process.cwd(), 'public', 'renders');

interface YouTubeUploadResult {
  videoId: string;
  watchUrl: string;
  studioUrl: string;
  privacyStatus: 'private';
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to upload private videos to YouTube.`);
  }

  return value;
}

async function getYouTubeAccessToken() {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      client_id: requireEnv('YOUTUBE_CLIENT_ID'),
      client_secret: requireEnv('YOUTUBE_CLIENT_SECRET'),
      refresh_token: requireEnv('YOUTUBE_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  });

  const payload = (await response.json()) as {access_token?: string; error?: string; error_description?: string};

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? 'Unable to refresh YouTube access token.');
  }

  return payload.access_token;
}

function resolveRenderPath(renderUrl: string) {
  if (!renderUrl.startsWith('/renders/')) {
    throw new Error('Only local rendered files from /renders can be uploaded.');
  }

  const fileName = path.basename(renderUrl);
  if (!fileName.endsWith('.mp4')) {
    throw new Error('Only MP4 render outputs can be uploaded to YouTube.');
  }

  return path.join(RENDERS_DIR, fileName);
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 30);
}

export async function uploadPrivateYouTubeShort({
  draft,
  renderUrl,
}: {
  draft: PublishingDraft;
  renderUrl: string;
}): Promise<YouTubeUploadResult> {
  const filePath = resolveRenderPath(renderUrl);
  const fileStat = await stat(filePath);
  const videoBytes = await readFile(filePath);
  const accessToken = await getYouTubeAccessToken();
  const youtube = draft.platforms.youtube;

  const metadata = {
    snippet: {
      title: youtube.title,
      description: youtube.description,
      tags: normalizeTags(youtube.tags),
      categoryId: '22',
      defaultLanguage: 'en',
      defaultAudioLanguage: 'en',
    },
    status: {
      privacyStatus: 'private',
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: false,
    },
    paidProductPlacementDetails: {
      hasPaidProductPlacement: false,
    },
  };

  const sessionResponse = await fetch(
    `${YOUTUBE_UPLOAD_URL}?uploadType=resumable&part=snippet,status,paidProductPlacementDetails&notifySubscribers=false`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(fileStat.size),
        'X-Upload-Content-Type': 'video/mp4',
      },
      body: JSON.stringify(metadata),
    },
  );

  const uploadUrl = sessionResponse.headers.get('location');
  if (!sessionResponse.ok || !uploadUrl) {
    const errorText = await sessionResponse.text();
    throw new Error(errorText || 'Unable to start YouTube upload session.');
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Length': String(fileStat.size),
      'Content-Type': 'video/mp4',
    },
    body: videoBytes,
  });

  const uploadPayload = (await uploadResponse.json()) as {
    id?: string;
    status?: {privacyStatus?: string};
    error?: {message?: string};
  };

  if (!uploadResponse.ok || !uploadPayload.id) {
    throw new Error(uploadPayload.error?.message ?? 'Unable to upload private video to YouTube.');
  }

  return {
    videoId: uploadPayload.id,
    watchUrl: `https://www.youtube.com/watch?v=${uploadPayload.id}`,
    studioUrl: `https://studio.youtube.com/video/${uploadPayload.id}/edit`,
    privacyStatus: 'private',
  };
}
