import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://makenashville.org',
  output: 'static',
  integrations: [sitemap()],
});
