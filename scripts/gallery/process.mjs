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
