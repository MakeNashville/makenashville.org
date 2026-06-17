# Photo Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `/gallery/` page on makenashville.org populated from a shared Google Drive folder, where each photo's Description field becomes its `alt` and a manual GitHub Actions workflow syncs new uploads.

**Architecture:** A Node sync script (`scripts/sync-gallery.mjs`) authenticates to Drive with a service account, downloads new images, resizes/converts them to WebP via `sharp`, writes a manifest to `src/data/gallery.json`, and commits the optimized assets. The Astro page reads the manifest at build time and renders a responsive grid with a CSS `:target`-based lightbox plus a tiny inline Esc-handler script. The Drive pull runs only in a manual `workflow_dispatch` workflow that commits and pushes the changes — the existing `deploy.yml` then ships them.

**Tech Stack:** Astro 6, Node 22, `googleapis` (Drive API v3), `sharp` (image processing), built-in `node --test` for unit tests, GitHub Actions for sync + deploy.

## Global Constraints

- Static Astro 6 build, GitHub Pages target. No runtime server.
- Site convention is zero client-side JS; the lightbox Esc-handler (~10 LOC inline) is the only deliberate exception.
- All images require non-empty meaningful alt text (WCAG AA, CLAUDE.md). Photos without a Drive Description are skipped at sync time.
- Generated assets (`public/images/gallery/*.webp`, `src/data/gallery.json`) ARE committed to the repo so deploys are deterministic and don't depend on Drive.
- Node version: `>=22.12.0` (existing `.nvmrc`).
- New runtime deps stay in `devDependencies` since the sync script never runs at request time.
- Build commands and dev port stay as-is (`npm run dev`, `npm run build`).
- File naming for generated assets: `<drive-file-id>-thumb.webp` (≤600px long edge, quality 75) and `<drive-file-id>-large.webp` (≤1600px long edge, quality 80).
- Accepted source MIME types: `image/jpeg`, `image/png`, `image/webp`. HEIC/HEIF are skipped with a warning.

---

## File Structure

**Create:**
- `scripts/sync-gallery.mjs` — entry point for the sync (orchestration + main()).
- `scripts/gallery/auth.mjs` — service-account auth helper (`getDriveClient`).
- `scripts/gallery/drive.mjs` — Drive API calls (`listFolderFiles`, `downloadFile`).
- `scripts/gallery/process.mjs` — `sharp`-based image processing (`processImage` → `{ thumbBuffer, largeBuffer, width, height }`).
- `scripts/gallery/manifest.mjs` — manifest read/write (`buildManifest`, `writeManifest`) and orphan cleanup (`cleanupOrphans`).
- `scripts/gallery/__tests__/process.test.mjs` — `sharp` processing unit tests.
- `scripts/gallery/__tests__/manifest.test.mjs` — manifest + cleanup unit tests.
- `scripts/gallery/__tests__/fixtures/landscape.jpg` — 1200×800 test image (created with `sharp` in a setup step, not committed by hand).
- `src/data/gallery.json` — empty `[]` manifest, committed.
- `src/pages/gallery.astro` — gallery page (grid + lightbox + empty state).
- `public/images/gallery/.gitkeep` — preserves the directory so the page's image paths resolve before the first sync.
- `.github/workflows/sync-gallery.yml` — manual sync workflow.

**Modify:**
- `package.json` — add `googleapis` and `sharp` devDeps; add `"sync-gallery": "node scripts/sync-gallery.mjs"` and `"test": "node --test scripts/**/*.test.mjs"` scripts.
- `src/components/Header.astro` — add `{ href: \`${base}gallery/\`, label: 'Gallery' }` between `Our Space` and `Calendar` in `navLinks`.

**Not modified:**
- `.github/workflows/deploy.yml` — unchanged. The sync workflow pushes to `main`, which triggers the existing deploy.
- `.gitignore` — unchanged. Generated assets are intentionally committed.

---

## Task 1: Project setup (deps + scripts + dirs)

**Files:**
- Modify: `package.json`
- Create: `public/images/gallery/.gitkeep`
- Create: `src/data/gallery.json` (contents: `[]`)
- Create: `scripts/gallery/` (directory, created implicitly by later file writes — no explicit step needed)

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run sync-gallery` and `npm test` scripts; `googleapis` and `sharp` available as devDependencies; an empty manifest the gallery page can import without erroring on the first build.

- [ ] **Step 1: Update package.json with new scripts and deps**

Replace the `scripts` and `devDependencies` blocks in `/Users/kevinhuber/src/makenashville.org/package.json`:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "sync-gallery": "node scripts/sync-gallery.mjs",
    "test": "node --test \"scripts/gallery/__tests__/*.test.mjs\""
  },
  "devDependencies": {
    "googleapis": "^144.0.0",
    "puppeteer-core": "^25.1.0",
    "sharp": "^0.34.0"
  }
}
```

(Keep the existing `dependencies` block — `@astrojs/sitemap` and `astro` — untouched.)

- [ ] **Step 2: Install the new packages**

Run from the repo root:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm install
```

Expected: `package-lock.json` updates, `node_modules/googleapis` and `node_modules/sharp` exist, no errors.

- [ ] **Step 3: Create the empty manifest and gallery image directory placeholder**

```bash
mkdir -p src/data public/images/gallery
echo '[]' > src/data/gallery.json
touch public/images/gallery/.gitkeep
```

- [ ] **Step 4: Verify everything still builds**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build
```

Expected: build succeeds, no new warnings.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/data/gallery.json public/images/gallery/.gitkeep
git commit -m "scaffold the photo gallery: add googleapis + sharp devDeps, an empty manifest, and the gallery image directory so subsequent sync work has somewhere to land

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Image processing module (with tests)

**Files:**
- Create: `scripts/gallery/process.mjs`
- Create: `scripts/gallery/__tests__/process.test.mjs`
- Create: `scripts/gallery/__tests__/fixtures/landscape.jpg` (generated by the test, not hand-authored)

**Interfaces:**
- Consumes: `sharp` from node_modules.
- Produces: `processImage(buffer: Buffer) -> Promise<{ thumbBuffer: Buffer, largeBuffer: Buffer, width: number, height: number }>`. `width`/`height` are the dimensions of the LARGE WebP after orientation normalization. Callers feed `thumbBuffer` and `largeBuffer` straight to `fs.writeFile`. Throws on unreadable image.

- [ ] **Step 1: Write the failing test**

Create `scripts/gallery/__tests__/process.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm test
```

Expected: FAIL — "Cannot find module '../process.mjs'" or similar.

- [ ] **Step 3: Implement processImage**

Create `scripts/gallery/process.mjs`:

```javascript
import sharp from 'sharp';

const THUMB_MAX = 600;
const LARGE_MAX = 1600;

async function resizeToWebp(input, maxEdge, quality) {
  return sharp(input)
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });
}

export async function processImage(buffer) {
  const thumb = await resizeToWebp(buffer, THUMB_MAX, 75);
  const large = await resizeToWebp(buffer, LARGE_MAX, 80);
  return {
    thumbBuffer: thumb.data,
    largeBuffer: large.data,
    width: large.info.width,
    height: large.info.height,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm test
```

Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add scripts/gallery/process.mjs scripts/gallery/__tests__/process.test.mjs scripts/gallery/__tests__/fixtures
git commit -m "add the gallery image-processing module so downloaded originals become EXIF-rotated WebPs at 600px (thumb, quality 75) and 1600px (large, quality 80) — sharp's withoutEnlargement preserves originals smaller than the target size

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Manifest + orphan cleanup module (with tests)

**Files:**
- Create: `scripts/gallery/manifest.mjs`
- Create: `scripts/gallery/__tests__/manifest.test.mjs`

**Interfaces:**
- Consumes: `node:fs/promises`, `node:path`.
- Produces:
  - `buildManifestEntry({ id, alt, width, height, createdTime }) -> { id, alt, thumb, large, width, height, createdTime }` where `thumb` and `large` are the public URLs `/images/gallery/<id>-thumb.webp` and `/images/gallery/<id>-large.webp`. (Note: the deployed `BASE_URL` is `/` so the path needs no extra prefix — Astro will resolve it correctly from `public/`.)
  - `sortManifest(entries)` returns a new array sorted newest-first by `createdTime` (ISO string).
  - `writeManifest(entries, manifestPath)` writes JSON (2-space indent + trailing newline) atomically (write-then-rename).
  - `cleanupOrphans(galleryDir, keepIds)` deletes any `.webp` file in `galleryDir` whose filename starts with an ID NOT in `keepIds`, returns array of deleted filenames. Ignores `.gitkeep`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/gallery/__tests__/manifest.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm test
```

Expected: FAIL — "Cannot find module '../manifest.mjs'".

- [ ] **Step 3: Implement the manifest module**

Create `scripts/gallery/manifest.mjs`:

```javascript
import { writeFile, rename, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

export function buildManifestEntry({ id, alt, width, height, createdTime }) {
  return {
    id,
    alt,
    thumb: `/images/gallery/${id}-thumb.webp`,
    large: `/images/gallery/${id}-large.webp`,
    width,
    height,
    createdTime,
  };
}

export function sortManifest(entries) {
  return [...entries].sort((a, b) => (a.createdTime < b.createdTime ? 1 : -1));
}

export async function writeManifest(entries, manifestPath) {
  const tmp = `${manifestPath}.tmp`;
  await writeFile(tmp, JSON.stringify(entries, null, 2) + '\n', 'utf8');
  await rename(tmp, manifestPath);
}

export async function cleanupOrphans(galleryDir, keepIds) {
  const files = await readdir(galleryDir);
  const deleted = [];
  for (const file of files) {
    if (!file.endsWith('.webp')) continue;
    const id = file.replace(/-(thumb|large)\.webp$/, '');
    if (!keepIds.has(id)) {
      await unlink(path.join(galleryDir, file));
      deleted.push(file);
    }
  }
  return deleted;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm test
```

Expected: PASS — all four tests green plus the two from Task 2.

- [ ] **Step 5: Commit**

```bash
git add scripts/gallery/manifest.mjs scripts/gallery/__tests__/manifest.test.mjs
git commit -m "add the gallery manifest module so the sync script can shape entries, sort newest-first, atomically write JSON, and prune orphan WebPs when a photo is removed from the Drive folder

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Drive auth + listing module

**Files:**
- Create: `scripts/gallery/auth.mjs`
- Create: `scripts/gallery/drive.mjs`

**Interfaces:**
- Consumes: `googleapis`, env vars `GOOGLE_SERVICE_ACCOUNT_KEY` (raw JSON string) and `GALLERY_FOLDER_ID`.
- Produces:
  - `getDriveClient(serviceAccountJson: string) -> drive_v3.Drive` — creates an authed Drive client. Throws if `serviceAccountJson` doesn't parse.
  - `listFolderFiles(drive, folderId) -> Promise<Array<{ id, name, mimeType, description, createdTime }>>` — paginated list of all files in the folder. Trash-excluded. Used by sync to enumerate candidates.
  - `downloadFile(drive, fileId) -> Promise<Buffer>` — returns raw bytes for the file's media.

Unit-testing Drive API calls would require mocking the entire client; the cost outweighs the value for a thin wrapper around `googleapis`. Coverage comes from integration testing in Task 5 and the manual local sync verification.

- [ ] **Step 1: Implement auth.mjs**

Create `scripts/gallery/auth.mjs`:

```javascript
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export function getDriveClient(serviceAccountJson) {
  const credentials = JSON.parse(serviceAccountJson);
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });
  return google.drive({ version: 'v3', auth });
}
```

- [ ] **Step 2: Implement drive.mjs**

Create `scripts/gallery/drive.mjs`:

```javascript
export async function listFolderFiles(drive, folderId) {
  const files = [];
  let pageToken;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, description, createdTime)',
      pageSize: 200,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    files.push(...(res.data.files ?? []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return files;
}

export async function downloadFile(drive, fileId) {
  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' },
  );
  return Buffer.from(res.data);
}
```

- [ ] **Step 3: Sanity-check the module parses and exports cleanly**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" node --input-type=module -e "import('./scripts/gallery/auth.mjs').then(m => console.log('auth:', Object.keys(m))); import('./scripts/gallery/drive.mjs').then(m => console.log('drive:', Object.keys(m)));"
```

Expected output (order may vary):

```
auth: [ 'getDriveClient' ]
drive: [ 'listFolderFiles', 'downloadFile' ]
```

- [ ] **Step 4: Commit**

```bash
git add scripts/gallery/auth.mjs scripts/gallery/drive.mjs
git commit -m "add the Drive auth + listing helpers so sync can connect via a service account JSON, paginate through every file in the gallery folder, and pull each file's raw bytes for processing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Sync script orchestration

**Files:**
- Create: `scripts/sync-gallery.mjs`

**Interfaces:**
- Consumes: `getDriveClient`, `listFolderFiles`, `downloadFile`, `processImage`, `buildManifestEntry`, `sortManifest`, `writeManifest`, `cleanupOrphans`.
- Produces: a CLI entry point. Exits 0 on success or no-op. Exits non-zero on hard errors (Drive auth failure, network errors). Writes to `src/data/gallery.json` and `public/images/gallery/*.webp`.

The script's behavior on env-var absence (graceful no-op) is the only piece worth a unit test — the rest is orchestration glue and is best verified end-to-end. Local verification is described in Step 5.

- [ ] **Step 1: Implement sync-gallery.mjs**

Create `scripts/sync-gallery.mjs`:

```javascript
#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDriveClient } from './gallery/auth.mjs';
import { listFolderFiles, downloadFile } from './gallery/drive.mjs';
import { processImage } from './gallery/process.mjs';
import {
  buildManifestEntry,
  sortManifest,
  writeManifest,
  cleanupOrphans,
} from './gallery/manifest.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const galleryDir = path.join(repoRoot, 'public', 'images', 'gallery');
const manifestPath = path.join(repoRoot, 'src', 'data', 'gallery.json');

const SUPPORTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const HEIC_MIME = new Set(['image/heic', 'image/heif']);

async function main() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const folderId = process.env.GALLERY_FOLDER_ID;
  if (!keyJson || !folderId) {
    console.log(
      'sync-gallery: GOOGLE_SERVICE_ACCOUNT_KEY or GALLERY_FOLDER_ID not set — skipping (no-op).',
    );
    return;
  }

  const drive = getDriveClient(keyJson);
  const files = await listFolderFiles(drive, folderId);
  console.log(`sync-gallery: found ${files.length} item(s) in folder.`);

  const skipped = [];
  const kept = [];

  for (const file of files) {
    if (HEIC_MIME.has(file.mimeType)) {
      skipped.push(`${file.name} (HEIC/HEIF not supported in CI)`);
      continue;
    }
    if (!SUPPORTED_MIME.has(file.mimeType)) {
      continue;
    }
    const alt = (file.description ?? '').trim();
    if (!alt) {
      skipped.push(`${file.name} (missing Description / alt text)`);
      continue;
    }

    const bytes = await downloadFile(drive, file.id);
    const { thumbBuffer, largeBuffer, width, height } = await processImage(bytes);
    await writeFile(path.join(galleryDir, `${file.id}-thumb.webp`), thumbBuffer);
    await writeFile(path.join(galleryDir, `${file.id}-large.webp`), largeBuffer);

    kept.push(
      buildManifestEntry({
        id: file.id,
        alt,
        width,
        height,
        createdTime: file.createdTime,
      }),
    );
    console.log(`sync-gallery: processed ${file.name} (${file.id}).`);
  }

  const manifest = sortManifest(kept);
  await writeManifest(manifest, manifestPath);

  const deleted = await cleanupOrphans(galleryDir, new Set(kept.map((e) => e.id)));
  if (deleted.length) {
    console.log(`sync-gallery: removed ${deleted.length} orphan file(s): ${deleted.join(', ')}.`);
  }

  if (skipped.length) {
    console.log(`sync-gallery: skipped ${skipped.length} file(s):`);
    for (const reason of skipped) console.log(`  - ${reason}`);
  }
  console.log(`sync-gallery: manifest has ${manifest.length} photo(s).`);
}

main().catch((err) => {
  console.error('sync-gallery: failed.', err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify the no-secrets fallback works**

```bash
unset GOOGLE_SERVICE_ACCOUNT_KEY GALLERY_FOLDER_ID
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run sync-gallery
```

Expected output ends with:

```
sync-gallery: GOOGLE_SERVICE_ACCOUNT_KEY or GALLERY_FOLDER_ID not set — skipping (no-op).
```

Exit code 0. `src/data/gallery.json` and `public/images/gallery/` are unchanged.

- [ ] **Step 3: Commit**

```bash
git add scripts/sync-gallery.mjs
git commit -m "wire up the gallery sync entry point so running npm run sync-gallery pulls every photo in the Drive folder, skips ones without a Description (alt text) or in HEIC format, writes thumb + large WebPs plus an updated manifest, and prunes orphans

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Local end-to-end verification (run locally before the next task, NOT in CI)**

The script's Drive-touching path can only be verified once the service account + folder exist. After completing the "one-time setup" in the design doc (steps 1–7), run from the repo root:

```bash
export GOOGLE_SERVICE_ACCOUNT_KEY="$(cat /path/to/service-account.json)"
export GALLERY_FOLDER_ID="<folder-id-from-drive-url>"
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run sync-gallery
```

Expected: per-file log lines, manifest written with N entries, WebPs in `public/images/gallery/`.

Do NOT commit the generated assets yet — the gallery page (Task 6) is what will render them, and committing assets without the page would look odd in history. The sync workflow (Task 7) is what commits these assets in production.

---

## Task 6: Gallery page

**Files:**
- Create: `src/pages/gallery.astro`

**Interfaces:**
- Consumes: `src/data/gallery.json` via direct import (Astro/Vite handles JSON imports), `BaseLayout`.
- Produces: a static page at `/gallery/`.

- [ ] **Step 1: Create the page**

Create `src/pages/gallery.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import gallery from '../data/gallery.json';

const base = import.meta.env.BASE_URL;
const photos = gallery;
---
<BaseLayout title="Gallery - Make Nashville" description="A look inside Make Nashville — workshops, projects, members, and the space at work.">
  <section class="hero">
    <div class="container">
      <h1 id="gallery">Gallery</h1>
      <p class="hero-subtitle">A look inside Make Nashville. Photos rotate as members share new ones.</p>
    </div>
  </section>

  <section class="section gallery-section">
    <div class="container">
      {photos.length === 0 ? (
        <p class="gallery-empty">Photos coming soon. Check back after the next sync.</p>
      ) : (
        <ul class="gallery-grid" role="list">
          {photos.map(photo => (
            <li class="gallery-item">
              <a href={`#photo-${photo.id}`} class="gallery-thumb-link" aria-label={`View larger: ${photo.alt}`}>
                <img
                  src={`${base}${photo.thumb.replace(/^\//, '')}`}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="600"
                />
              </a>
              <div class="lightbox" id={`photo-${photo.id}`} role="dialog" aria-modal="true" aria-label={photo.alt}>
                <a href="#gallery" class="lightbox-backdrop" aria-label="Close photo viewer" tabindex="-1"></a>
                <figure class="lightbox-figure">
                  <img
                    src={`${base}${photo.large.replace(/^\//, '')}`}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                  />
                  <figcaption class="sr-only">{photo.alt}</figcaption>
                </figure>
                <a href="#gallery" class="lightbox-close" aria-label="Close photo viewer">Close</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </section>

  <script is:inline>
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!document.querySelector('.lightbox:target')) return;
      const url = new URL(window.location.href);
      url.hash = 'gallery';
      history.replaceState(null, '', url);
    });
  </script>
</BaseLayout>

<style>
  .hero {
    text-align: center;
    padding: var(--spacing-lg) 0;
  }

  .hero h1 {
    font-size: 2rem;
    margin-bottom: var(--spacing-xs);
  }

  .hero-subtitle {
    color: var(--color-text-dim);
  }

  .gallery-section {
    padding-top: 0;
  }

  .gallery-empty {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--spacing-lg) 0;
  }

  .gallery-grid {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--spacing-sm);
    margin: 0;
    padding: 0;
  }

  .gallery-item {
    position: relative;
  }

  .gallery-thumb-link {
    display: block;
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 1;
  }

  .gallery-thumb-link img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.2s ease;
  }

  .gallery-thumb-link:hover img,
  .gallery-thumb-link:focus-visible img {
    transform: scale(1.03);
  }

  .gallery-thumb-link:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 2px;
  }

  .lightbox {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 100;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md);
  }

  .lightbox:target {
    display: flex;
  }

  .lightbox-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    cursor: zoom-out;
  }

  .lightbox-figure {
    position: relative;
    max-width: min(100%, 1400px);
    max-height: 90vh;
    margin: 0;
    z-index: 1;
  }

  .lightbox-figure img {
    max-width: 100%;
    max-height: 90vh;
    width: auto;
    height: auto;
    display: block;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    border-radius: 4px;
  }

  .lightbox-close {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    z-index: 2;
    background: var(--color-white);
    color: var(--color-text);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 600;
  }

  .lightbox-close:hover,
  .lightbox-close:focus-visible {
    background: var(--color-accent);
    color: var(--color-white);
  }

  .lightbox-close:focus-visible {
    outline: 2px solid var(--color-white);
    outline-offset: 2px;
  }
</style>
```

- [ ] **Step 2: Verify the empty state builds and renders**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build
```

Expected: `dist/gallery/index.html` exists; opening it shows the "Photos coming soon" message; no build errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/gallery.astro
git commit -m "add the gallery page that reads src/data/gallery.json and renders a responsive grid with a CSS :target lightbox — a small inline Esc-handler is the one allowed JS exception so keyboard users get the expected close behavior on top of the close button and back button

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Header nav link

**Files:**
- Modify: `src/components/Header.astro:5-8`

**Interfaces:**
- Consumes: nothing new.
- Produces: a "Gallery" link visible in the main nav.

- [ ] **Step 1: Add "Gallery" to navLinks**

In `src/components/Header.astro`, replace the existing `navLinks` array:

```javascript
const navLinks = [
  { href: `${base}our-space/`, label: 'Our Space' },
  { href: `${base}gallery/`, label: 'Gallery' },
  { href: `${base}calendar/`, label: 'Calendar' },
];
```

- [ ] **Step 2: Verify the link renders and the build passes**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build
```

Expected: build passes. Open `dist/index.html` or any built page in a browser; the nav reads "Our Space | Gallery | Calendar | Get Involved".

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.astro
git commit -m "add a Gallery link to the main nav between Our Space and Calendar so the new page is discoverable from every page

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Sync workflow

**Files:**
- Create: `.github/workflows/sync-gallery.yml`

**Interfaces:**
- Consumes: GitHub Secrets `GOOGLE_SERVICE_ACCOUNT_KEY` and `GALLERY_FOLDER_ID` (configured per the design doc's setup checklist).
- Produces: a manually-triggered Actions job that pulls Drive, commits the resulting changes, and pushes to `main`.

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/sync-gallery.yml`:

```yaml
name: Sync gallery from Drive

on:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          persist-credentials: true

      - name: Setup Node
        uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Sync photos from Drive
        env:
          GOOGLE_SERVICE_ACCOUNT_KEY: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_KEY }}
          GALLERY_FOLDER_ID: ${{ secrets.GALLERY_FOLDER_ID }}
        run: npm run sync-gallery

      - name: Commit and push if changed
        run: |
          if [ -z "$(git status --porcelain public/images/gallery src/data/gallery.json)" ]; then
            echo "No gallery changes."
            exit 0
          fi
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add public/images/gallery src/data/gallery.json
          git commit -m "sync gallery from Drive"
          git push
```

- [ ] **Step 2: Lint the YAML by re-reading the file**

```bash
cat .github/workflows/sync-gallery.yml
```

Expected: file matches what was written. (GitHub Actions does its own validation on push; nothing else is needed locally.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/sync-gallery.yml
git commit -m "add the manual gallery sync workflow so a button in the Actions tab pulls Drive, optimizes the new photos, and pushes the result — the push triggers the existing deploy so no changes to deploy.yml are needed

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: End-to-end verification

**Files:** none — pure verification.

**Interfaces:** none.

- [ ] **Step 1: Run the test suite**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm test
```

Expected: all tests pass.

- [ ] **Step 2: Build the site with the empty manifest**

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build
```

Expected: build succeeds, no warnings; `dist/gallery/index.html` exists.

- [ ] **Step 3: Manual local sync against real Drive (optional but recommended before merge)**

After the design doc's setup checklist is complete, locally:

```bash
export GOOGLE_SERVICE_ACCOUNT_KEY="$(cat /path/to/key.json)"
export GALLERY_FOLDER_ID="<folder-id>"
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run sync-gallery
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run preview
```

Open the preview URL, confirm:

- Gallery page renders the grid.
- Each thumbnail loads and is keyboard-focusable.
- Clicking a thumb opens the lightbox; close button, Esc, back button, and backdrop click all dismiss.
- Browser inspector shows non-empty `alt` on every image and no console errors.

Discard any local sync changes that aren't going through the production sync workflow:

```bash
git checkout -- public/images/gallery src/data/gallery.json
```

- [ ] **Step 4: Final review**

Confirm the spec's requirements are all visibly present:

- Drive folder source, build-time fetch, manual trigger ✓
- Description field → alt; photos without descriptions skipped ✓
- Single feed, newest-first ✓
- CSS-only lightbox with Esc handler ✓
- Empty state ✓
- Generated assets committed to repo ✓
- Existing deploy workflow unchanged ✓

If everything passes, the branch is ready for PR.
