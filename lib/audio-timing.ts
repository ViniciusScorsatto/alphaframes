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

function createMusicVolumeCurve(
  item: Pick<RenderableVideoData, 'voiceoverDurationFrames' | 'voiceoverUrl'>,
  normalVolume: number,
  duckedVolume: number,
) {
  if (!hasValidVoiceover(item)) {
    return normalVolume;
  }

  const voiceoverDurationFrames = item.voiceoverDurationFrames ?? 0;
  const fadeStart = Math.max(0, voiceoverDurationFrames);
  const safeFadeStart = Math.min(fadeStart, MAX_MUSIC_DUCK_FRAMES);
  const fadeEnd = safeFadeStart + MUSIC_START_BUFFER_FRAMES;

  return (frame: number) => {
    if (frame <= safeFadeStart) {
      return duckedVolume;
    }

    if (frame >= fadeEnd) {
      return normalVolume;
    }

    const progress = (frame - safeFadeStart) / MUSIC_START_BUFFER_FRAMES;
    return duckedVolume + (normalVolume - duckedVolume) * progress;
  };
}

export function getMusicVolume(item: Pick<RenderableVideoData, 'voiceoverDurationFrames' | 'voiceoverUrl'>) {
  return createMusicVolumeCurve(item, MUSIC_NORMAL_VOLUME, MUSIC_DUCKED_VOLUME);
}

export function getMarketMusicVolume(item: Pick<RenderableVideoData, 'voiceoverDurationFrames' | 'voiceoverUrl'>) {
  return createMusicVolumeCurve(item, MARKET_MUSIC_NORMAL_VOLUME, MARKET_MUSIC_DUCKED_VOLUME);
}

export function toPublicStaticPath(value?: string) {
  return value?.replace(/^\//, '');
}
