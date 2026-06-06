import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const execFileAsync = promisify(execFile);

const [inputPath, duration = '12'] = process.argv.slice(2);

if (!inputPath) {
  console.error('Usage: node scripts/trim-video.mjs <video-path> [duration-seconds]');
  process.exit(1);
}

const parsed = path.parse(inputPath);
const outputPath = path.join(parsed.dir, `${parsed.name}.trimmed${parsed.ext}`);

await execFileAsync('ffmpeg', [
  '-i',
  inputPath,
  '-t',
  duration,
  '-c:v',
  'copy',
  '-c:a',
  'aac',
  outputPath,
  '-y',
]);

await fs.rename(outputPath, inputPath);
