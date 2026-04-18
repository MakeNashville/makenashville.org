# Make Nashville Astro Rebuild - Design Spec

## Overview

Faithful recreation of makenashville.org using Astro, hosted on GitHub Pages as a staging site. The current site runs on Webflow; the rebuild preserves the same content, structure, and visual design while moving to a static site generator with content collections.

## Goals

- Replicate the current site's content and layout in Astro
- Use Markdown content collections for shop data (easy to edit)
- Deploy to GitHub Pages as a staging site (`<org>.github.io/<repo>`)
- Zero client-side JavaScript (static output only)
- Vanilla CSS (no framework dependencies)
- Accessible, performant, semantic HTML

## Pages

### / (Home)

Sections in order:

1. **Header**: Logo, nav links (Our Space, Calendar, Get Involved), "Join Us" CTA button
2. **Hero**: "Make Nashville" heading, "Like a gym, but with tools for making stuff." tagline, "12,000 square feet of shops and endless possibility." subtitle
3. **Shop grid**: 4-column responsive grid of shop cards (image + title + short tagline), linking to anchors on /our-space. 12 shops total (4x3 grid)
4. **Testimonial**: Member quote with attribution
5. **Three pillars**: Classes (Eventbrite), Community (Slack + events), Access (24/7 facility)
6. **Membership CTA**: $75/month, no contract, cancel anytime, 18+ with valid photo ID, "Join Us" button
7. **Footer**: Address (620b Davidson St, Nashville, TN 37213), email (info@makenashville.org), social links (Instagram, GitHub, Venmo, Slack), nav links (Classes, Our Space, Pricing, Donate, Contact)

### /our-space

1. **Header** (shared)
2. **Hero**: "Many specialized shops all under one roof" heading
3. **Shop sub-nav**: Anchor links to each shop section on the page (pill-style links)
4. **Shop detail sections**: One per shop, each containing:
   - Shop image (pulled from current site)
   - Shop name
   - Short description/tagline
   - Equipment list
5. **Testimonial**: Different member quote (Jenny's quote about Slack community)
6. **Footer** (shared)

### /calendar

1. **Header** (shared)
2. **Hero**: "Upcoming Classes & Events" heading, "Member-led workshops and open houses" subtitle
3. **Eventbrite embed**: Widget from `eventbrite.com/o/make-nashville-9796500814`
4. **Footer** (shared)

### /get-involved

1. **Header** (shared)
2. **Membership section**: Price ($75/month), terms (no contract, cancel anytime, 18+)
3. **Includes**: Key fob access, tool access after safety training, Slack community, shop orientations
4. **How to join**: 3 steps (attend open house, complete paperwork/payment, complete orientations)
5. **Shop access requirements**: Orientation required for woodshop, metalshop, autoshop; open access for all others
6. **Volunteering**: Space is volunteer-run, 2 paid staff
7. **Donations**: Monetary via contribution page, Venmo, or check; physical items need shop captain approval
8. **Policies/FAQ**: Guests (signed waiver, accompanied by member), children (allowed except dangerous shops), dogs (allowed), parking info
9. **Footer** (shared)

## Content Architecture

### Content Collections

```
src/data/
  shops/
    3d-printing.md
    art-studio.md
    autoshop.md
    cnc.md
    ceramics.md
    darkroom.md
    electronics-lab.md
    laser.md
    metalshop.md
    photo-studio.md
    sewing.md
    woodshop.md
```

Each shop markdown file frontmatter:

```yaml
title: "3D Printing"
tagline: "Modern FDM printers with finishing tools"
image: "./images/3d-printing.webp"
order: 1
orientationRequired: false
equipment:
  - "4x Bambu Lab P1S"
  - "Prusa XL (5 toolheads)"
  - "Prusa Mini+"
  - "Sainsmart Belt Printer"
  - "Miraco Revopoint 3D Scanner"
  - "Filament dryers"
  - "100g monthly filament allocation"
```

Body content is the full description rendered on /our-space.

## Project Structure

```
makenashville.org/
  astro.config.mjs
  package.json
  public/
    images/
      shops/          # Shop photos pulled from current site
      logo.svg        # Make Nashville logo
    favicon.ico
  src/
    content.config.ts  # Content collection schema
    data/
      shops/          # Shop markdown files
    components/
      Header.astro
      Footer.astro
      ShopCard.astro
      ShopDetail.astro
      Testimonial.astro
    layouts/
      BaseLayout.astro
    pages/
      index.astro
      our-space.astro
      calendar.astro
      get-involved.astro
    styles/
      global.css
```

## Shared Components

### Header.astro
- Logo (links to /)
- Nav: Our Space, Calendar, Get Involved
- "Join Us" CTA button (links to external signup)
- Responsive: hamburger menu on mobile (CSS-only using checkbox/label pattern, no JS)
- Skip navigation link for accessibility

### Footer.astro
- Address and email
- Nav links: Classes (Eventbrite), Our Space, Pricing (/get-involved), Slack, Donate, Contact
- Social links: Instagram, GitHub, Venmo
- Open house info

### ShopCard.astro
- Props: title, tagline, image, slug
- Used on homepage grid
- Image with alt text, title, tagline
- Links to `/our-space#${slug}`

### ShopDetail.astro
- Props: full shop data from content collection
- Used on /our-space page
- Image, title, description, equipment list
- Anchor ID for sub-nav linking

### Testimonial.astro
- Props: quote, attribution
- Styled blockquote

### BaseLayout.astro
- HTML head (meta, title, description, favicon, Open Graph tags)
- Skip nav link
- Header component
- `<main>` slot
- Footer component
- Global CSS import

## Styling

- Vanilla CSS in `src/styles/global.css`
- CSS custom properties for colors, fonts, spacing
- Dark theme matching current site (dark background, light text)
- Responsive: mobile-first, breakpoints for tablet/desktop
- Custom `:focus-visible` styles for keyboard navigation
- `font-display: swap` for web fonts
- No animations that could cause vestibular issues

## External Links

| Label | URL |
|-------|-----|
| Join Us / Signup | https://members.makenashville.org/civicrm/contribute/transact/?reset=1&id=19 |
| Donate | https://go.makenashville.org/sustaining |
| Eventbrite (org) | https://www.eventbrite.com/o/make-nashville-9796500814 |
| Eventbrite (open house) | https://www.eventbrite.com/e/165415485169?aff=oddtdtcreator |
| Slack | https://makenashville.slack.com |
| Instagram | https://www.instagram.com/makenashville/ |
| GitHub | https://github.com/MakeNashville/ |
| Venmo | https://venmo.com/makenashville |
| Email | mailto:info@makenashville.org |

## Deployment

- Astro static output (`output: 'static'`)
- GitHub Pages via GitHub Actions workflow
- Staging URL: `<org>.github.io/<repo>`
- Custom domain can be configured later
- `.github/workflows/deploy.yml` for automated builds on push to main

## Accessibility

- Semantic HTML throughout (`<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`)
- Skip navigation link
- All images have meaningful alt text
- Color contrast meets WCAG AA
- Keyboard navigable (custom `:focus-visible` styles)
- Proper heading hierarchy (single h1 per page)

## Performance

- Images optimized to WebP, appropriately sized
- Lazy loading for below-fold images
- Zero client JS (except Eventbrite embed on /calendar)
- `font-display: swap` for web fonts
- Static HTML, served from CDN via GitHub Pages

## Assets

All images will be pulled from the current makenashville.org site:
- Shop photos (12 total)
- Logo/branding
- Any member/testimonial photos

Images will be converted to WebP and sized appropriately for responsive display.
