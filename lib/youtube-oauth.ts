const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to generate a YouTube refresh token.`);
  }

  return value;
}

export function getYouTubeOAuthRedirectUri(requestUrl: string) {
  return process.env.YOUTUBE_REDIRECT_URI || `${new URL(requestUrl).origin}/api/youtube/oauth/callback`;
}

export function buildYouTubeOAuthUrl(requestUrl: string) {
  const redirectUri = getYouTubeOAuthRedirectUri(requestUrl);
  const params = new URLSearchParams({
    client_id: requireEnv('YOUTUBE_CLIENT_ID'),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_UPLOAD_SCOPE,
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state: 'alphaframes-youtube-upload',
  });

  return {
    authUrl: `${GOOGLE_AUTH_URL}?${params.toString()}`,
    redirectUri,
    scope: YOUTUBE_UPLOAD_SCOPE,
  };
}

export async function exchangeYouTubeOAuthCode({
  code,
  requestUrl,
}: {
  code: string;
  requestUrl: string;
}) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      code,
      client_id: requireEnv('YOUTUBE_CLIENT_ID'),
      client_secret: requireEnv('YOUTUBE_CLIENT_SECRET'),
      redirect_uri: getYouTubeOAuthRedirectUri(requestUrl),
      grant_type: 'authorization_code',
    }),
  });

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error_description ?? payload.error ?? 'Unable to exchange YouTube OAuth code.');
  }

  return payload;
}
