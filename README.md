# makenashville.org

Website for [Make Nashville](https://makenashville.org), a nonprofit community makerspace in Nashville, TN.

Built with [Astro](https://astro.build) and hosted on GitHub Pages.

## Development

Requires **Node.js 22+** (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open http://localhost:4321/makenashville.org/

## Build

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  content.config.ts    # Shop collection schema
  data/shops/          # Shop markdown files (12 shops)
  components/          # Astro components (Header, Footer, ShopCard, etc.)
  layouts/             # BaseLayout
  pages/               # index, our-space, calendar, get-involved
  styles/              # global.css
public/
  images/              # Shop photos, carousel, community photos, logo
```

## Content

Shop data lives in `src/data/shops/` as Markdown files with YAML frontmatter (title, tagline, image, equipment list, orientation requirements). Edit these files to update shop information.

## Deployment

Pushes to `main` trigger automatic deployment to GitHub Pages via `.github/workflows/deploy.yml`.

## License

Content is owned by Make Nashville. Code is MIT.
