import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { processImage } from '../process.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(here, 'fixtures');
const landscapeFixture = path.join(fixturesDir, 'landscape.jpg');

before(async () => {
  await mkdir(fixturesDir, { recursive: true });
  const buf = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: { r: 200, g: 100, b: 50 } },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
  await writeFile(landscapeFixture, buf);
});

test('processImage returns thumb and large WebP buffers sized by long edge', async () => {
  const input = await readFile(landscapeFixture);
  const { thumbBuffer, largeBuffer, width, height } = await processImage(input);

  const thumbMeta = await sharp(thumbBuffer).metadata();
  assert.equal(thumbMeta.format, 'webp');
  assert.ok(Math.max(thumbMeta.width, thumbMeta.height) <= 600);
  assert.equal(thumbMeta.width, 600);
  assert.equal(thumbMeta.height, 400);

  const largeMeta = await sharp(largeBuffer).metadata();
  assert.equal(largeMeta.format, 'webp');
  assert.ok(Math.max(largeMeta.width, largeMeta.height) <= 1600);
  assert.equal(largeMeta.width, 1200);
  assert.equal(largeMeta.height, 800);

  assert.equal(width, 1200);
  assert.equal(height, 800);
});

test('processImage rejects unreadable input', async () => {
  await assert.rejects(() => processImage(Buffer.from('not an image')));
});
