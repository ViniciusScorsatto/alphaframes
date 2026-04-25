import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import textToSpeech from '@google-cloud/text-to-speech';
import {parseBuffer} from 'music-metadata';
import type {AnyGeneratedVideoData, RenderableVideoData} from '@/types';
import {VIDEO} from '@/lib/constants';
import {formatAssetIdentity, slugify} from '@/lib/utils';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'tts');
const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const GOOGLE_TTS_VOICE_NAME = 'en-US-Neural2-J';
const GOOGLE_TTS_SPEAKING_RATE = 0.84;

type VoiceoverSynthesis = {
  audioContent?: string | Buffer | Uint8Array | null;
};

function getGoogleClient() {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (credentialsJson) {
    return new textToSpeech.TextToSpeechClient({
      credentials: JSON.parse(credentialsJson) as Record<string, unknown>,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return new textToSpeech.TextToSpeechClient();
  }

  return null;
}

function getGoogleApiKey() {
  const apiKey =
    process.env.GOOGLE_TTS_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_TTS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  return apiKey?.trim() || null;
}

function limitWords(value: string, maxWords = 18) {
  const words = value.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  return words.slice(0, maxWords).join(' ');
}

function getTemplatePhrase(template: string) {
  return template
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildVoiceoverText(item: RenderableVideoData) {
  if (item.kind === 'single') {
    const assetLabel = formatAssetIdentity(item.asset, item.assetName);
    return limitWords(
      `We tracked ${assetLabel}, focusing on ${getTemplatePhrase(item.template)} and the latest return structure.`,
    );
  }

  if (item.kind === 'comparison') {
    return limitWords(
      `We compared ${item.primaryAsset.name} and ${item.secondaryAsset.name}, showing which asset performed better.`,
    );
  }

  const signalLabel =
    item.signal_quality?.label != null ? `${item.signal_quality.label.toLowerCase()} signal` : 'market signal';

  return limitWords(
    `We reviewed the crypto market, focusing on ${item.headline.toLowerCase()} as a ${signalLabel}.`,
  );
}

async function getMp3DurationFrames(audioBuffer: Buffer) {
  const metadata = await parseBuffer(audioBuffer, 'audio/mpeg');
  const durationSeconds = metadata.format.duration ?? 0;
  return Math.max(1, Math.ceil(durationSeconds * VIDEO.fps));
}

async function synthesizeWithClient(text: string): Promise<VoiceoverSynthesis | null> {
  const client = getGoogleClient();

  if (!client) {
    return null;
  }

  const [response] = await client.synthesizeSpeech({
    input: {text},
    voice: {
      languageCode: 'en-US',
      name: GOOGLE_TTS_VOICE_NAME,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: GOOGLE_TTS_SPEAKING_RATE,
    },
  });

  return response;
}

async function synthesizeWithApiKey(text: string): Promise<VoiceoverSynthesis | null> {
  const apiKey = getGoogleApiKey();

  if (!apiKey) {
    return null;
  }

  const response = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      input: {text},
      voice: {
        languageCode: 'en-US',
        name: GOOGLE_TTS_VOICE_NAME,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: GOOGLE_TTS_SPEAKING_RATE,
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as VoiceoverSynthesis;
}

export async function addVoiceoverToItem<T extends AnyGeneratedVideoData>(item: T): Promise<T> {
  const voiceoverText = buildVoiceoverText(item);

  try {
    const response = (await synthesizeWithClient(voiceoverText)) ?? (await synthesizeWithApiKey(voiceoverText));

    if (!response?.audioContent) {
      return item;
    }

    const audioBuffer =
      typeof response.audioContent === 'string'
        ? Buffer.from(response.audioContent, 'base64')
        : Buffer.isBuffer(response.audioContent)
          ? response.audioContent
          : Buffer.from(response.audioContent);
    const durationFrames = await getMp3DurationFrames(audioBuffer);
    const hash = createHash('sha1')
      .update(`${item.asset}-${item.template}-${voiceoverText}-${GOOGLE_TTS_VOICE_NAME}-${GOOGLE_TTS_SPEAKING_RATE}`)
      .digest('hex')
      .slice(0, 12);
    const fileName = `${slugify(item.asset)}-${slugify(item.template)}-${hash}.mp3`;

    await fs.mkdir(OUTPUT_DIR, {recursive: true});
    await fs.writeFile(path.join(OUTPUT_DIR, fileName), audioBuffer);

    return {
      ...item,
      voiceoverUrl: `/tts/${fileName}`,
      voiceoverText,
      voiceoverDurationFrames: durationFrames,
    };
  } catch {
    return item;
  }
}
