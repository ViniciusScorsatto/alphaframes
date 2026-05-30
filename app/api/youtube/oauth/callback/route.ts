import {exchangeYouTubeOAuthCode} from '@/lib/youtube-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {'Content-Type': 'text/html; charset=utf-8'},
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');

  if (oauthError) {
    return htmlResponse(`<h1>YouTube OAuth failed</h1><p>${escapeHtml(oauthError)}</p>`, 400);
  }

  if (!code) {
    return htmlResponse('<h1>YouTube OAuth failed</h1><p>Missing authorization code.</p>', 400);
  }

  try {
    const tokens = await exchangeYouTubeOAuthCode({code, requestUrl: request.url});
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return htmlResponse(
        `<h1>No refresh token returned</h1>
        <p>Google returned an access token, but no refresh token. Re-open the dashboard config and try again. If it still happens, revoke app access from your Google Account and retry the consent flow.</p>`,
        400,
      );
    }

    const escapedToken = escapeHtml(refreshToken);

    return htmlResponse(`<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>YouTube refresh token</title>
          <style>
            body { margin: 0; min-height: 100vh; background: #050505; color: #fff; font-family: system-ui, sans-serif; display: grid; place-items: center; }
            main { width: min(760px, calc(100vw - 32px)); border: 1px solid rgba(255,255,255,.14); border-radius: 24px; padding: 28px; background: rgba(255,255,255,.06); }
            h1 { margin: 0 0 12px; font-size: 24px; }
            p { color: #b9b9b9; line-height: 1.6; }
            code, textarea { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
            textarea { width: 100%; min-height: 120px; margin-top: 12px; border-radius: 16px; border: 1px solid rgba(255,255,255,.16); background: #000; color: #86efac; padding: 14px; }
            button { margin-top: 14px; border: 0; border-radius: 14px; background: #34d399; color: #000; padding: 12px 16px; font-weight: 700; cursor: pointer; }
          </style>
        </head>
        <body>
          <main>
            <h1>YouTube refresh token generated</h1>
            <p>Add this to <code>.env.local</code> as <code>YOUTUBE_REFRESH_TOKEN</code>. The dashboard window should also receive it automatically.</p>
            <textarea readonly id="token">${escapedToken}</textarea>
            <button id="copy">Copy token</button>
          </main>
          <script>
            const token = ${JSON.stringify(refreshToken)};
            if (window.opener) {
              window.opener.postMessage({type: 'alphaframes-youtube-refresh-token', refreshToken: token}, window.location.origin);
            }
            document.getElementById('copy').addEventListener('click', async () => {
              await navigator.clipboard.writeText(token);
              document.getElementById('copy').textContent = 'Copied';
            });
          </script>
        </body>
      </html>`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate YouTube refresh token.';
    return htmlResponse(`<h1>YouTube OAuth failed</h1><p>${escapeHtml(message)}</p>`, 400);
  }
}
