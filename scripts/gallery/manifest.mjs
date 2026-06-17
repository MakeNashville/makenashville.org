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
