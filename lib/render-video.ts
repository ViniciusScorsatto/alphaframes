import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import type {RenderableVideoData, RenderedVideoResult} from '@/types';
import {VIDEO} from '@/lib/constants';
import {slugify} from '@/lib/utils';

const REMOTION_ENTRY = path.join(process.cwd(), 'remotion', 'index.ts');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'renders');
const execFileAsync = promisify(execFile);

let bundleLocationPromise: Promise<string> | null = null;

async function getBundleLocation() {
  if (process.env.NODE_ENV !== 'production') {
    return bundle({
      entryPoint: REMOTION_ENTRY,
      onProgress: () => undefined,
      webpackOverride: (config) => config,
    });
  }

  if (!bundleLocationPromise) {
    bundleLocationPromise = bundle({
      entryPoint: REMOTION_ENTRY,
      onProgress: () => undefined,
      webpackOverride: (config) => config,
    });
  }

  return bundleLocationPromise;
}

async function trimToVideoDuration(outputLocation: string) {
  const durationSeconds = (VIDEO.durationInFrames / VIDEO.fps).toFixed(3);
  const parsed = path.parse(outputLocation);
  const trimmedLocation = path.join(parsed.dir, `${parsed.name}.trimmed${parsed.ext}`);

  await execFileAsync('ffmpeg', [
    '-i',
    outputLocation,
    '-t',
    durationSeconds,
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    trimmedLocation,
    '-y',
  ]);

  await fs.rename(trimmedLocation, outputLocation);
}

export async function renderVideos(items: RenderableVideoData[]): Promise<RenderedVideoResult[]> {
  await fs.mkdir(OUTPUT_DIR, {recursive: true});
  const serveUrl = await getBundleLocation();

  return Promise.all(
    items.map(async (item) => {
      const compositionId =
        item.kind === 'comparison'
          ? 'ComparisonAssetVideo'
          : item.kind === 'market'
            ? 'MarketInsightVideo'
            : 'FinancialAssetVideo';
      const composition = await selectComposition({
        serveUrl,
        id: compositionId,
        inputProps: {data: item},
      });

      const fileName = `${slugify(item.asset)}-${slugify(item.template)}-${Date.now()}.mp4`;
      const outputLocation = path.join(OUTPUT_DIR, fileName);

      await renderMedia({
        composition: {
          ...composition,
          durationInFrames: VIDEO.durationInFrames,
          fps: VIDEO.fps,
          height: VIDEO.height,
          width: VIDEO.width,
        },
        serveUrl,
        codec: 'h264',
        outputLocation,
        inputProps: {data: item},
      });
      await trimToVideoDuration(outputLocation);

      return {
        asset: item.asset,
        template: item.template,
        fileName,
        url: `/renders/${fileName}`,
      };
    }),
  );
}
