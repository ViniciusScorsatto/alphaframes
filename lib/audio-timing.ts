import type {RenderableVideoData} from '@/types';

export const MUSIC_START_BUFFER_FRAMES = 6;
export const MUSIC_NORMAL_VOLUME = 0.14;
export const MUSIC_DUCKED_VOLUME = 0.035;
export const VOICEOVER_VOLUME = 0.82;

function hasValidVoiceover(item: Pick<RenderableVideoData, 'voiceoverDurationFrames' | 'voiceoverUrl'>) {
  if (!item.voiceoverUrl || item.voiceoverDurationFrames == null || !Number.isFinite(item.voiceoverDurationFrames)) {
    return false;
  }

  return item.voiceoverDurationFrames > 0;
}

export function getMusicVolume(item: Pick<RenderableVideoData, 'voiceoverDurationFrames' | 'voiceoverUrl'>) {
  if (!hasValidVoiceover(item)) {
    return MUSIC_NORMAL_VOLUME;
  }

  const voiceoverDurationFrames = item.voiceoverDurationFrames ?? 0;
  const fadeStart = Math.max(0, voiceoverDurationFrames);
  const fadeEnd = fadeStart + MUSIC_START_BUFFER_FRAMES;

  return (frame: number) => {
    if (frame <= fadeStart) {
      return MUSIC_DUCKED_VOLUME;
    }

    if (frame >= fadeEnd) {
      return MUSIC_NORMAL_VOLUME;
    }

    const progress = (frame - fadeStart) / MUSIC_START_BUFFER_FRAMES;
    return MUSIC_DUCKED_VOLUME + (MUSIC_NORMAL_VOLUME - MUSIC_DUCKED_VOLUME) * progress;
  };
}

export function toPublicStaticPath(value?: string) {
  return value?.replace(/^\//, '');
}
