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
    const alt = file.name.replace(/\.[^.]+$/, '').trim() || file.name.trim();
    const caption = (file.description ?? '').trim() || null;

    try {
      const bytes = await downloadFile(drive, file.id);
      const { thumbBuffer, largeBuffer, width, height } = await processImage(bytes);
      await writeFile(path.join(galleryDir, `${file.id}-thumb.webp`), thumbBuffer);
      await writeFile(path.join(galleryDir, `${file.id}-large.webp`), largeBuffer);
      kept.push(
        buildManifestEntry({
          id: file.id,
          alt,
          caption,
          width,
          height,
          createdTime: file.createdTime,
        }),
      );
      console.log(`sync-gallery: processed ${file.name} (${file.id}).`);
    } catch (err) {
      skipped.push(`${file.name} (processing failed: ${err.message})`);
    }
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
