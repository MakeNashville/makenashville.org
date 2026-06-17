import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildManifestEntry,
  sortManifest,
  writeManifest,
  cleanupOrphans,
} from '../manifest.mjs';

test('buildManifestEntry produces the expected shape and URLs', () => {
  const entry = buildManifestEntry({
    id: 'abc123',
    alt: 'A workshop in progress',
    width: 1600,
    height: 1067,
    createdTime: '2026-06-10T12:00:00Z',
  });
  assert.deepEqual(entry, {
    id: 'abc123',
    alt: 'A workshop in progress',
    thumb: '/images/gallery/abc123-thumb.webp',
    large: '/images/gallery/abc123-large.webp',
    width: 1600,
    height: 1067,
    createdTime: '2026-06-10T12:00:00Z',
  });
});

test('sortManifest orders entries newest-first by createdTime', () => {
  const sorted = sortManifest([
    { id: 'a', createdTime: '2026-01-01T00:00:00Z' },
    { id: 'b', createdTime: '2026-06-01T00:00:00Z' },
    { id: 'c', createdTime: '2026-03-01T00:00:00Z' },
  ]);
  assert.deepEqual(sorted.map((e) => e.id), ['b', 'c', 'a']);
});

test('writeManifest writes pretty JSON with a trailing newline', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'gallery-test-'));
  const file = path.join(dir, 'gallery.json');
  await writeManifest([{ id: 'x' }], file);
  const contents = await readFile(file, 'utf8');
  assert.equal(contents, '[\n  {\n    "id": "x"\n  }\n]\n');
});

test('cleanupOrphans removes only files whose IDs are not in keepIds', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'gallery-test-'));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'keep1-thumb.webp'), 'x');
  await writeFile(path.join(dir, 'keep1-large.webp'), 'x');
  await writeFile(path.join(dir, 'gone-thumb.webp'), 'x');
  await writeFile(path.join(dir, 'gone-large.webp'), 'x');
  await writeFile(path.join(dir, '.gitkeep'), '');

  const deleted = await cleanupOrphans(dir, new Set(['keep1']));
  const remaining = (await readdir(dir)).sort();

  assert.deepEqual(deleted.sort(), ['gone-large.webp', 'gone-thumb.webp']);
  assert.deepEqual(remaining, ['.gitkeep', 'keep1-large.webp', 'keep1-thumb.webp']);
});
