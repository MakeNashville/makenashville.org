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
    await new Promise((r) => setTimeout(r, 1500));
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
