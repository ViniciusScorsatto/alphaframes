import fs from 'node:fs/promises';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import type {AnyGeneratedVideoData, RenderedVideoResult} from '@/types';
import {VIDEO} from '@/lib/constants';
import {slugify} from '@/lib/utils';

const REMOTION_ENTRY = path.join(process.cwd(), 'remotion', 'index.ts');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'renders');

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

export async function renderVideos(items: AnyGeneratedVideoData[]): Promise<RenderedVideoResult[]> {
  await fs.mkdir(OUTPUT_DIR, {recursive: true});
  const serveUrl = await getBundleLocation();

  return Promise.all(
    items.map(async (item) => {
      const compositionId = item.kind === 'comparison' ? 'ComparisonAssetVideo' : 'FinancialAssetVideo';
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

      return {
        asset: item.asset,
        template: item.template,
        fileName,
        url: `/renders/${fileName}`,
      };
    }),
  );
}
