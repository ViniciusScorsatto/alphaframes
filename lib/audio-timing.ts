import type {RenderableVideoData} from '../types';

export const MUSIC_START_BUFFER_FRAMES = 6;
export const MUSIC_NORMAL_VOLUME = 0.14;
export const MUSIC_DUCKED_VOLUME = 0.08;
export const MAX_MUSIC_DUCK_FRAMES = 105;
export const VOICEOVER_VOLUME = 0.82;
export const MARKET_MUSIC_NORMAL_VOLUME = 0.2;
export const MARKET_MUSIC_DUCKED_VOLUME = 0.12;
export const MARKET_VOICEOVER_VOLUME = 0.72;

function hasValidVoiceover(item: Pick<RenderableVideoData, 'voiceoverDurationFrames' | 'voiceoverUrl'>) {
  if (!item.voiceoverUrl || item.voiceoverDurationFrames == null || !Number.isFinite(item.voiceoverDurationFrames)) {
    return false;
  }

  return item.voiceoverDurationFrames > 0;
}

export function getMusicDuckEndFrame(item: Pick<RenderableVideoData, 'voiceoverDurationFrames' | 'voiceoverUrl'>) {
  if (!hasValidVoiceover(item)) {
    return 0;
  }

  const voiceoverDurationFrames = item.voiceoverDurationFrames ?? 0;
  const fadeStart = Math.max(0, voiceoverDurationFrames);
  const safeFadeStart = Math.min(fadeStart, MAX_MUSIC_DUCK_FRAMES);
  return safeFadeStart + MUSIC_START_BUFFER_FRAMES;
}

export function toPublicStaticPath(value?: string) {
  return value?.replace(/^\//, '');
}
