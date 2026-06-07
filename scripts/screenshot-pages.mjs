import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';

const PAGES = [
  ['home', '/'],
  ['our-space', '/our-space/'],
  ['get-involved', '/get-involved/'],
  ['sponsors', '/sponsors/'],
  ['history', '/history/'],
];

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4321';
const outDir = process.env.OUT_DIR || './screenshots-out';
const chromePath = process.env.CHROME_PATH;

if (!chromePath) {
  console.error('CHROME_PATH must be set to the system Chrome/Chromium binary.');
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chromePath,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  for (const [slug, path] of PAGES) {
    const url = `${baseUrl}${path}`;
    console.log(`=> ${slug} (${url})`);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });

    // Force lazy images to load, then scroll the full page to trigger any
    // IntersectionObserver-based lazy loaders, then wait for everything to settle.
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
        img.loading = 'eager';
      });
      const step = 400;
      const pause = 60;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, pause));
      }
      window.scrollTo(0, 0);
      await Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
              }),
          ),
      );
    });

    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({
      path: `${outDir}/${slug}.jpg`,
      type: 'jpeg',
      quality: 82,
      fullPage: true,
    });
  }
} finally {
  await browser.close();
}
