# CLAUDE.md

## Project

Make Nashville website - static Astro site for a nonprofit makerspace. Deployed to GitHub Pages.

## Commands

- `npm run dev` - Start dev server (requires Node 22+, see .nvmrc)
- `npm run build` - Build static site to dist/
- `npm run preview` - Preview built site

If Node 22 isn't the default: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run dev`

## Architecture

- **Astro 6** with static output, vanilla CSS, zero client-side JS (except third-party embeds)
- **Content collections**: Shop data in `src/data/shops/*.md` with Zod schema in `src/content.config.ts`
- **Styling**: CSS custom properties in `src/styles/global.css`, component-scoped styles via `<style>` tags
- **Fonts**: Oswald (headings), Libre Franklin (body) via Google Fonts
- **Deployment**: GitHub Actions via `.github/workflows/deploy.yml`, sitemap via `@astrojs/sitemap`

## Key decisions

- CSS-only carousel with radio buttons (no JS). Prev/next arrows and dot indicators.
- CSS-only mobile hamburger menu (checkbox/label pattern, visually hidden checkbox stays in tab order).
- Shop orientation requirements stored as `orientationRequired: boolean` in shop frontmatter.
- Third-party embeds: EventsCalendar.co on /calendar, Leaflet + Stadia Maps on /get-involved.
- Images stored in `public/images/` as WebP. Shop images in `public/images/shops/`.

## Content editing

- Shop info: edit `src/data/shops/<shop-name>.md` (frontmatter has title, tagline, image, order, orientationRequired, equipment list)
- Shop order on pages: controlled by the `order` field in frontmatter (alphabetical, 1-12)
- External links (Eventbrite, Slack, etc.): hardcoded in components and pages, see the spec for the full URL table

## Conventions

- Accessibility first: WCAG AA contrast, semantic HTML, skip nav, aria labels, keyboard navigable
- Colors must meet 4.5:1 contrast ratio for normal text
- All images need meaningful alt text
- Use `is:inline` on third-party scripts to prevent Astro bundling
