# Make Nashville Astro Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild makenashville.org as a static Astro site with Markdown content collections, deployed to GitHub Pages.

**Architecture:** Static Astro site with vanilla CSS, Markdown content collections for shop data, and zero client-side JavaScript. Images pulled from the current site and optimized. GitHub Actions for automated deployment.

**Tech Stack:** Astro (static output), Markdown content collections, vanilla CSS, GitHub Pages, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-04-18-makenashville-astro-rebuild-design.md`

---

## File Structure

```
makenashville.org/
  .github/
    workflows/
      deploy.yml              # GitHub Actions deploy workflow
  .gitignore
  astro.config.mjs            # Astro config (site, base, static output)
  package.json
  public/
    favicon.ico
    images/
      shops/                  # Shop photos (WebP, pulled from current site)
        3d-printing.webp
        art-studio.webp
        autoshop.webp
        cnc.webp
        ceramics.webp
        darkroom.webp
        electronics-lab.webp
        laser.webp
        metalshop.webp
        photo-studio.webp
        sewing.webp
        woodshop.webp
      logo.svg                # Make Nashville logo
  src/
    content.config.ts          # Content collection schema definition
    data/
      shops/                   # Shop markdown files
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
    components/
      Header.astro             # Site header with nav and Join Us CTA
      Footer.astro             # Site footer with links and socials
      ShopCard.astro            # Shop card for homepage grid
      ShopDetail.astro          # Full shop detail for /our-space
      Testimonial.astro         # Blockquote testimonial component
    layouts/
      BaseLayout.astro          # Shared HTML shell (head, header, footer)
    pages/
      index.astro               # Homepage
      our-space.astro           # Shop directory page
      calendar.astro            # Eventbrite embed page
      get-involved.astro        # Membership, volunteering, policies page
    styles/
      global.css                # All site styles
```

---

### Task 1: Initialize Astro project

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `.gitignore`
- Create: `src/pages/index.astro`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/kevinhuber/src/makenashville.org
git init
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "makenashville-org",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  }
}
```

- [ ] **Step 3: Install Astro**

```bash
npm install astro
```

- [ ] **Step 4: Create astro.config.mjs**

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://makenashville.github.io',
  base: '/makenashville.org',
  output: 'static',
});
```

Note: `site` and `base` should be updated to match the actual GitHub org/repo name. The above assumes the repo is `MakeNashville/makenashville.org`.

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
.astro/
.superpowers/
.DS_Store
```

- [ ] **Step 6: Create minimal index page to verify setup**

Create `src/pages/index.astro`:

```astro
---
---
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Make Nashville</title>
</head>
<body>
  <h1>Make Nashville</h1>
  <p>Like a gym, but with tools for making stuff.</p>
</body>
</html>
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on localhost, page shows "Make Nashville" heading.

- [ ] **Step 8: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes, static files in `dist/`.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json astro.config.mjs .gitignore src/pages/index.astro
git commit -m "feat: initialize Astro project for makenashville.org rebuild"
```

---

### Task 2: Global CSS and design tokens

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Create global.css with design tokens and base styles**

Create `src/styles/global.css`. Pull color values from the current site's dark theme:

```css
:root {
  --color-bg: #111111;
  --color-bg-alt: #1a1a2e;
  --color-bg-dark: #0d0d1a;
  --color-bg-footer: #0a0a14;
  --color-text: #ffffff;
  --color-text-secondary: #cccccc;
  --color-text-muted: #888888;
  --color-text-dim: #666666;
  --color-border: #222222;
  --color-accent: #ffffff;
  --color-link: #7c8aff;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --max-width: 1200px;
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 2rem;
  --spacing-lg: 3rem;
  --spacing-xl: 4rem;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
}

body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

a {
  color: var(--color-link);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: 2px;
}

.skip-nav {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-accent);
  color: var(--color-bg);
  font-weight: 600;
}

.skip-nav:focus {
  left: 0;
}

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

/* Responsive grid for shop cards */
.shop-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

@media (max-width: 900px) {
  .shop-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .shop-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Section spacing */
.section {
  padding: var(--spacing-lg) 0;
}

.section--alt {
  background-color: var(--color-bg-alt);
}

.section--dark {
  background-color: var(--color-bg-dark);
}

/* Button styles */
.btn {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: opacity 0.15s;
}

.btn:hover {
  text-decoration: none;
  opacity: 0.9;
}

.btn--primary {
  background: var(--color-accent);
  color: var(--color-bg);
}

/* Three-column layout */
.three-col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  text-align: center;
}

@media (max-width: 600px) {
  .three-col {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add global CSS with design tokens and base styles"
```

---

### Task 3: BaseLayout component

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create BaseLayout.astro**

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Make Nashville is a nonprofit makerspace offering 12,000 square feet of shops and endless possibility.' } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalURL} />
  <link rel="canonical" href={canonicalURL} />
  <link rel="icon" type="image/x-icon" href={`${import.meta.env.BASE_URL}favicon.ico`} />
  <title>{title}</title>
</head>
<body>
  <a class="skip-nav" href="#main-content">Skip to main content</a>
  <slot name="header" />
  <main id="main-content">
    <slot />
  </main>
  <slot name="footer" />
</body>
</html>

<style is:global>
  @import '../styles/global.css';
</style>
```

- [ ] **Step 2: Update index.astro to use BaseLayout**

Replace `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Make Nashville">
  <h1>Make Nashville</h1>
  <p>Like a gym, but with tools for making stuff.</p>
</BaseLayout>
```

- [ ] **Step 3: Verify dev server renders correctly**

```bash
npm run dev
```

Expected: Page renders with dark background, white text, correct meta tags in source.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro src/pages/index.astro
git commit -m "feat: add BaseLayout with meta tags and skip nav"
```

---

### Task 4: Header component

**Files:**
- Create: `src/components/Header.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create Header.astro**

```astro
---
const { pathname } = Astro.url;
const base = import.meta.env.BASE_URL;

const navLinks = [
  { href: `${base}our-space/`, label: 'Our Space' },
  { href: `${base}calendar/`, label: 'Calendar' },
  { href: `${base}get-involved/`, label: 'Get Involved' },
];
---
<header class="site-header">
  <nav class="site-nav container" aria-label="Main navigation">
    <a href={base} class="site-logo">Make Nashville</a>

    <input type="checkbox" id="nav-toggle" class="nav-toggle" aria-hidden="true" />
    <label for="nav-toggle" class="nav-toggle-label" aria-label="Toggle navigation menu">
      <span></span>
      <span></span>
      <span></span>
    </label>

    <ul class="nav-links" role="list">
      {navLinks.map(link => (
        <li>
          <a
            href={link.href}
            class:list={['nav-link', { active: pathname.includes(link.href.replace(base, '').replace('/', '')) }]}
          >
            {link.label}
          </a>
        </li>
      ))}
      <li>
        <a href="https://members.makenashville.org/civicrm/contribute/transact/?reset=1&id=19" class="btn btn--primary nav-cta">
          Join Us
        </a>
      </li>
    </ul>
  </nav>
</header>

<style>
  .site-header {
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .site-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--spacing-sm);
    padding-bottom: var(--spacing-sm);
  }

  .site-logo {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--color-text);
    text-decoration: none;
  }

  .site-logo:hover {
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    list-style: none;
  }

  .nav-link {
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    text-decoration: none;
  }

  .nav-link:hover,
  .nav-link.active {
    color: var(--color-text);
  }

  .nav-cta {
    font-size: 0.85rem;
  }

  /* CSS-only hamburger menu */
  .nav-toggle {
    display: none;
  }

  .nav-toggle-label {
    display: none;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
    padding: var(--spacing-xs);
  }

  .nav-toggle-label span {
    display: block;
    width: 24px;
    height: 2px;
    background: var(--color-text);
    transition: transform 0.2s, opacity 0.2s;
  }

  @media (max-width: 768px) {
    .nav-toggle-label {
      display: flex;
    }

    .nav-links {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      flex-direction: column;
      background: var(--color-bg);
      border-bottom: 1px solid var(--color-border);
      padding: var(--spacing-sm) var(--spacing-md);
      gap: var(--spacing-sm);
    }

    .nav-toggle:checked ~ .nav-links {
      display: flex;
    }

    .nav-toggle:checked ~ .nav-toggle-label span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .nav-toggle:checked ~ .nav-toggle-label span:nth-child(2) {
      opacity: 0;
    }

    .nav-toggle:checked ~ .nav-toggle-label span:nth-child(3) {
      transform: rotate(-45deg) translate(5px, -5px);
    }
  }
</style>
```

- [ ] **Step 2: Add Header to BaseLayout**

In `src/layouts/BaseLayout.astro`, add the import and replace the header slot:

```astro
---
import Header from '../components/Header.astro';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Make Nashville is a nonprofit makerspace offering 12,000 square feet of shops and endless possibility.' } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalURL} />
  <link rel="canonical" href={canonicalURL} />
  <link rel="icon" type="image/x-icon" href={`${import.meta.env.BASE_URL}favicon.ico`} />
  <title>{title}</title>
</head>
<body>
  <a class="skip-nav" href="#main-content">Skip to main content</a>
  <Header />
  <main id="main-content">
    <slot />
  </main>
  <slot name="footer" />
</body>
</html>

<style is:global>
  @import '../styles/global.css';
</style>
```

- [ ] **Step 3: Verify header renders with navigation**

```bash
npm run dev
```

Expected: Sticky header with logo, nav links, and "Join Us" button. On narrow viewport, hamburger menu toggles nav.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.astro src/layouts/BaseLayout.astro
git commit -m "feat: add Header component with CSS-only mobile menu"
```

---

### Task 5: Footer component

**Files:**
- Create: `src/components/Footer.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create Footer.astro**

```astro
---
const base = import.meta.env.BASE_URL;
---
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-info">
      <p class="footer-address">620b Davidson St, Nashville, TN 37213</p>
      <p><a href="mailto:info@makenashville.org">info@makenashville.org</a></p>
      <p class="footer-openhouse">Open House: Every other Friday at 6 PM</p>
    </div>

    <nav class="footer-nav" aria-label="Footer navigation">
      <ul role="list">
        <li><a href="https://www.eventbrite.com/o/make-nashville-9796500814">Classes</a></li>
        <li><a href={`${base}our-space/`}>Our Space</a></li>
        <li><a href={`${base}get-involved/`}>Pricing</a></li>
        <li><a href="https://makenashville.slack.com">Slack</a></li>
        <li><a href="https://go.makenashville.org/sustaining">Donate</a></li>
        <li><a href="mailto:info@makenashville.org">Contact</a></li>
      </ul>
    </nav>

    <div class="footer-social">
      <a href="https://www.instagram.com/makenashville/" aria-label="Make Nashville on Instagram">Instagram</a>
      <a href="https://github.com/MakeNashville/" aria-label="Make Nashville on GitHub">GitHub</a>
      <a href="https://venmo.com/makenashville" aria-label="Make Nashville on Venmo">Venmo</a>
    </div>
  </div>
</footer>

<style>
  .site-footer {
    background: var(--color-bg-footer);
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-lg) 0;
    font-size: 0.9rem;
  }

  .footer-grid {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .footer-info {
    color: var(--color-text-dim);
  }

  .footer-info p {
    margin-bottom: var(--spacing-xs);
  }

  .footer-openhouse {
    margin-top: var(--spacing-sm);
  }

  .footer-nav ul {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm) var(--spacing-md);
  }

  .footer-nav a {
    color: var(--color-text-muted);
  }

  .footer-nav a:hover {
    color: var(--color-text);
  }

  .footer-social {
    display: flex;
    gap: var(--spacing-sm);
  }

  .footer-social a {
    color: var(--color-text-muted);
  }

  .footer-social a:hover {
    color: var(--color-text);
  }

  @media (max-width: 768px) {
    .footer-grid {
      flex-direction: column;
      gap: var(--spacing-md);
    }
  }
</style>
```

- [ ] **Step 2: Add Footer to BaseLayout**

In `src/layouts/BaseLayout.astro`, import Footer and replace the footer slot:

Add to the imports:
```astro
import Footer from '../components/Footer.astro';
```

Replace `<slot name="footer" />` with:
```astro
<Footer />
```

- [ ] **Step 3: Verify footer renders**

```bash
npm run dev
```

Expected: Footer shows address, email, nav links, social links. Responsive on mobile.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.astro src/layouts/BaseLayout.astro
git commit -m "feat: add Footer component with links and socials"
```

---

### Task 6: Content collection schema and shop data

**Files:**
- Create: `src/content.config.ts`
- Create: `src/data/shops/3d-printing.md`
- Create: `src/data/shops/art-studio.md`
- Create: `src/data/shops/autoshop.md`
- Create: `src/data/shops/cnc.md`
- Create: `src/data/shops/ceramics.md`
- Create: `src/data/shops/darkroom.md`
- Create: `src/data/shops/electronics-lab.md`
- Create: `src/data/shops/laser.md`
- Create: `src/data/shops/metalshop.md`
- Create: `src/data/shops/photo-studio.md`
- Create: `src/data/shops/sewing.md`
- Create: `src/data/shops/woodshop.md`

- [ ] **Step 1: Create content.config.ts**

```typescript
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const shops = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/shops' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    image: z.string(),
    order: z.number(),
    orientationRequired: z.boolean(),
    equipment: z.array(z.string()),
  }),
});

export const collections = { shops };
```

- [ ] **Step 2: Create all 12 shop markdown files**

Create `src/data/shops/3d-printing.md`:

```markdown
---
title: "3D Printing"
tagline: "Modern FDM printers with finishing tools"
image: "/images/shops/3d-printing.webp"
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
---

Modern FDM printers including 4 Bambu Lab P1S units, Prusa XL with 5 toolheads, Prusa Mini+, and Sainsmart Belt Printer. Includes filament dryers, 3D scanner, and finishing tools.
```

Create `src/data/shops/art-studio.md`:

```markdown
---
title: "Art Studio"
tagline: "Easels and painting supplies"
image: "/images/shops/art-studio.webp"
order: 2
orientationRequired: false
equipment:
  - "Easels"
  - "Paint tools"
  - "Stamp press"
---

General-purpose painting space with easels, paint tools, and stamp press.
```

Create `src/data/shops/autoshop.md`:

```markdown
---
title: "Autoshop"
tagline: "Vehicle maintenance with lift"
image: "/images/shops/autoshop.webp"
order: 3
orientationRequired: true
equipment:
  - "40-inch lift"
  - "Socket sets"
  - "Wrenches"
  - "Oil disposal"
  - "Air tools"
---

Vehicle maintenance bay featuring 40-inch lift, socket sets, wrenches, oil disposal, and air tools. Direct vehicle entry for undercarriage access.
```

Create `src/data/shops/cnc.md`:

```markdown
---
title: "CNC"
tagline: "Mills with dust collection and CAD/CAM software"
image: "/images/shops/cnc.webp"
order: 4
orientationRequired: false
equipment:
  - "2'x2' Axiom"
  - "2'x4' Shapeoko Pro 5"
  - "5'x12' Philicam (10HP spindle)"
  - "CAM/CAD software"
  - "Oneida Dust Supercell"
---

Three CNC machines: 2'x2' Axiom, 2'x4' Shapeoko Pro 5, and 5'x12' Philicam with 10HP spindle. Includes CAM/CAD software and dust collection.
```

Create `src/data/shops/ceramics.md`:

```markdown
---
title: "Ceramics"
tagline: "Pottery wheels, kilns, and glazing"
image: "/images/shops/ceramics.webp"
order: 5
orientationRequired: false
equipment:
  - "15 pottery wheels"
  - "Slab roller"
  - "Giffin Grip"
  - "8 handbuilding stations"
  - "2 top-loading kilns"
  - "1 side-loading kiln"
  - "15 house-made glazes"
  - "Paid project shelving"
---

Complete pottery studio with 15 wheels, slab roller, Giffin Grip, 8 handbuilding stations, 3 kilns, and 15 house-made glazes.
```

Create `src/data/shops/darkroom.md`:

```markdown
---
title: "Darkroom"
tagline: "Film photography processing"
image: "/images/shops/darkroom.webp"
order: 6
orientationRequired: false
equipment:
  - "4 Beseler enlargers"
  - "2 Omega enlargers"
  - "Development trays"
  - "Film dryers"
  - "Patterson tanks"
  - "B&W chemicals"
---

Film processing facility with 4 Beseler and 2 Omega enlargers, development trays, film dryers, Patterson tanks, and B&W chemicals.
```

Create `src/data/shops/electronics-lab.md`:

```markdown
---
title: "Electronics Lab"
tagline: "Circuit building workbenches"
image: "/images/shops/electronics-lab.webp"
order: 7
orientationRequired: false
equipment:
  - "Oscilloscopes"
  - "Bench power supplies"
  - "Signal generators"
  - "Soldering tools"
  - "Breadboards"
  - "Through-hole components"
---

Workbenches with oscilloscopes, bench power supplies, signal generators, soldering tools, breadboards, and through-hole components.
```

Create `src/data/shops/laser.md`:

```markdown
---
title: "Laser"
tagline: "CO2 laser with Lightburn software"
image: "/images/shops/laser.webp"
order: 8
orientationRequired: false
equipment:
  - "20\"x28\" Omtech CO2 laser"
  - "Lightburn software"
  - "Ventilation system"
  - "Test scraps"
---

20"x28" Omtech CO2 laser with Lightburn software. Cuts wood, acrylic, cardboard, leather; engraves metal. Includes ventilation and test scraps.
```

Create `src/data/shops/metalshop.md`:

```markdown
---
title: "Metalshop"
tagline: "Welding and fabrication equipment"
image: "/images/shops/metalshop.webp"
order: 9
orientationRequired: true
equipment:
  - "TIG welder"
  - "MIG welder"
  - "Plasma cutter"
  - "3 welding bays"
  - "Vertical mill"
  - "Lathe"
  - "Hydraulic pipe bender"
  - "Sheet metal brake, slip roll, and shear"
  - "Spot welder"
  - "Grinders"
---

Welding (TIG, MIG), plasma cutter, 3 welding bays, vertical mill, lathe, hydraulic pipe bender, sheet metal brake/slip roll/shear, spot welder, and grinders.
```

Create `src/data/shops/photo-studio.md`:

```markdown
---
title: "Photo Studio"
tagline: "Controlled lighting setups"
image: "/images/shops/photo-studio.webp"
order: 10
orientationRequired: false
equipment:
  - "Colored backdrops"
  - "Godox studio lights"
  - "Tripods"
  - "C-stands"
  - "Modifiers"
  - "Reflectors"
---

Controlled lighting setup with colored backdrops, Godox studio lights, tripods, C-stands, modifiers, and reflectors.
```

Create `src/data/shops/sewing.md`:

```markdown
---
title: "Sewing"
tagline: "Industrial and household machines"
image: "/images/shops/sewing.webp"
order: 11
orientationRequired: false
equipment:
  - "14 Brother machines"
  - "8 Singer heavy-duty sergers"
  - "Mannequin"
  - "Irons"
  - "Drafting table"
  - "Thread library"
  - "Cutting tools"
---

14 Brother machines, 8 Singer heavy-duty sergers, mannequin, irons, drafting table, thread library, and cutting tools.
```

Create `src/data/shops/woodshop.md`:

```markdown
---
title: "Woodshop"
tagline: "Hand and power tools with dust collection"
image: "/images/shops/woodshop.webp"
order: 12
orientationRequired: true
equipment:
  - "SawStop table saw"
  - "Powermatic drum sander"
  - "Powermatic edge sander"
  - "Jointer"
  - "Planer"
  - "Jet mortiser"
  - "Jet bandsaw"
  - "Harvey bandsaw"
  - "18\" Jet lathe"
  - "2 Oneida Dust Gorillas"
---

Industrial equipment: SawStop table saw, Powermatic drum/edge sanders, jointer, planer, Jet mortiser/bandsaw, Harvey bandsaw, 18" Jet lathe, and dust collection with 2 Oneida Dust Gorillas.
```

- [ ] **Step 3: Verify content collection loads**

```bash
npm run dev
```

Expected: No errors on startup. Content collection is parsed successfully.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts src/data/shops/
git commit -m "feat: add shops content collection with all 12 shop entries"
```

---

### Task 7: ShopCard and Testimonial components

**Files:**
- Create: `src/components/ShopCard.astro`
- Create: `src/components/Testimonial.astro`

- [ ] **Step 1: Create ShopCard.astro**

```astro
---
interface Props {
  title: string;
  tagline: string;
  image: string;
  slug: string;
}

const { title, tagline, image, slug } = Astro.props;
const base = import.meta.env.BASE_URL;
---
<a href={`${base}our-space/#${slug}`} class="shop-card">
  <img src={`${base}${image.replace(/^\//, '')}`} alt={`${title} shop at Make Nashville`} loading="lazy" width="400" height="300" />
  <div class="shop-card-body">
    <h3>{title}</h3>
    <p>{tagline}</p>
  </div>
</a>

<style>
  .shop-card {
    background: var(--color-bg-alt);
    border-radius: 8px;
    overflow: hidden;
    text-decoration: none;
    color: var(--color-text);
    transition: transform 0.15s;
  }

  .shop-card:hover {
    transform: translateY(-2px);
    text-decoration: none;
  }

  .shop-card img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }

  .shop-card-body {
    padding: var(--spacing-sm);
  }

  .shop-card-body h3 {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .shop-card-body p {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 2: Create Testimonial.astro**

```astro
---
interface Props {
  quote: string;
  attribution: string;
}

const { quote, attribution } = Astro.props;
---
<blockquote class="testimonial">
  <p>"{quote}"</p>
  <cite>{attribution}</cite>
</blockquote>

<style>
  .testimonial {
    text-align: center;
    padding: var(--spacing-lg);
    background: var(--color-bg-dark);
  }

  .testimonial p {
    color: var(--color-text-secondary);
    font-style: italic;
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 700px;
    margin: 0 auto var(--spacing-sm);
  }

  .testimonial cite {
    color: var(--color-text-dim);
    font-size: 0.9rem;
    font-style: normal;
  }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ShopCard.astro src/components/Testimonial.astro
git commit -m "feat: add ShopCard and Testimonial components"
```

---

### Task 8: Homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Build the full homepage**

Replace `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ShopCard from '../components/ShopCard.astro';
import Testimonial from '../components/Testimonial.astro';
import { getCollection } from 'astro:content';

const shops = (await getCollection('shops')).sort((a, b) => a.data.order - b.data.order);
const base = import.meta.env.BASE_URL;
---
<BaseLayout title="Make Nashville">
  <section class="hero">
    <div class="container">
      <h1>Make Nashville</h1>
      <p class="hero-tagline">Like a gym, but with tools for making stuff.</p>
      <p class="hero-subtitle">12,000 square feet of shops and endless possibility.</p>
    </div>
  </section>

  <section class="section" aria-labelledby="shops-heading">
    <div class="container">
      <h2 id="shops-heading">Creative Spaces</h2>
      <div class="shop-grid">
        {shops.map(shop => (
          <ShopCard
            title={shop.data.title}
            tagline={shop.data.tagline}
            image={shop.data.image}
            slug={shop.id}
          />
        ))}
      </div>
    </div>
  </section>

  <Testimonial
    quote="The best thing about Make Nashville is the people there... creatives sharing knowledge and experiences."
    attribution="Make Nashville member"
  />

  <section class="section" aria-labelledby="pillars-heading">
    <div class="container">
      <h2 class="sr-only" id="pillars-heading">What we offer</h2>
      <div class="three-col">
        <div>
          <h3>Classes</h3>
          <p>Member-led classes through <a href="https://www.eventbrite.com/o/make-nashville-9796500814">Eventbrite</a></p>
        </div>
        <div>
          <h3>Community</h3>
          <p>Connect via <a href="https://makenashville.slack.com">Slack</a> (24/7) and in-person events</p>
        </div>
        <div>
          <h3>Access</h3>
          <p>24/7 facility access with tours available</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--alt membership-cta" aria-labelledby="membership-heading">
    <div class="container">
      <h2 id="membership-heading">$75/month</h2>
      <p>No contract. Cancel anytime. 18+ with valid photo ID.</p>
      <a href="https://members.makenashville.org/civicrm/contribute/transact/?reset=1&id=19" class="btn btn--primary">Join Us</a>
    </div>
  </section>
</BaseLayout>

<style>
  .hero {
    text-align: center;
    padding: var(--spacing-xl) 0;
  }

  .hero h1 {
    font-size: 3rem;
    margin-bottom: var(--spacing-sm);
  }

  .hero-tagline {
    font-size: 1.25rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xs);
  }

  .hero-subtitle {
    font-size: 1rem;
    color: var(--color-text-dim);
  }

  .section h2 {
    text-align: center;
    margin-bottom: var(--spacing-md);
    font-size: 1.5rem;
  }

  .three-col h3 {
    margin-bottom: var(--spacing-xs);
    font-size: 1.1rem;
  }

  .three-col p {
    color: var(--color-text-muted);
    font-size: 0.95rem;
  }

  .membership-cta {
    text-align: center;
    padding: var(--spacing-lg) 0;
  }

  .membership-cta h2 {
    font-size: 2rem;
  }

  .membership-cta p {
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-md);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  @media (max-width: 600px) {
    .hero h1 {
      font-size: 2rem;
    }
  }
</style>
```

- [ ] **Step 2: Verify homepage renders all sections**

```bash
npm run dev
```

Expected: Hero, shop grid (images will be broken until Task 10), testimonial, three pillars, membership CTA, all visible.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: build homepage with shop grid, testimonial, and membership CTA"
```

---

### Task 9: ShopDetail component and Our Space page

**Files:**
- Create: `src/components/ShopDetail.astro`
- Create: `src/pages/our-space.astro`

- [ ] **Step 1: Create ShopDetail.astro**

```astro
---
interface Props {
  id: string;
  title: string;
  tagline: string;
  image: string;
  equipment: string[];
  content: any;
}

const { id, title, tagline, image, equipment, content: Content } = Astro.props;
const base = import.meta.env.BASE_URL;
---
<article class="shop-detail" id={id}>
  <img src={`${base}${image.replace(/^\//, '')}`} alt={`${title} shop at Make Nashville`} loading="lazy" width="800" height="500" />
  <div class="shop-detail-body">
    <h3>{title}</h3>
    <p class="shop-detail-tagline">{tagline}</p>
    <div class="shop-detail-content">
      <Content />
    </div>
    <div class="shop-detail-equipment">
      <h4>Equipment</h4>
      <ul>
        {equipment.map(item => <li>{item}</li>)}
      </ul>
    </div>
  </div>
</article>

<style>
  .shop-detail {
    background: var(--color-bg-alt);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: var(--spacing-md);
  }

  .shop-detail img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }

  .shop-detail-body {
    padding: var(--spacing-md);
  }

  .shop-detail h3 {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-xs);
  }

  .shop-detail-tagline {
    color: var(--color-text-muted);
    font-size: 1rem;
    margin-bottom: var(--spacing-sm);
  }

  .shop-detail-content {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
    line-height: 1.7;
  }

  .shop-detail-equipment h4 {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--spacing-xs);
  }

  .shop-detail-equipment ul {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .shop-detail-equipment li {
    background: var(--color-bg);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }
</style>
```

- [ ] **Step 2: Create our-space.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ShopDetail from '../components/ShopDetail.astro';
import Testimonial from '../components/Testimonial.astro';
import { getCollection, render } from 'astro:content';

const shops = (await getCollection('shops')).sort((a, b) => a.data.order - b.data.order);
const base = import.meta.env.BASE_URL;

const shopsWithContent = await Promise.all(
  shops.map(async (shop) => {
    const { Content } = await render(shop);
    return { shop, Content };
  })
);
---
<BaseLayout title="Our Space - Make Nashville" description="Explore Make Nashville's 12 specialized shops, from woodworking and metalwork to ceramics, 3D printing, and more.">
  <section class="hero">
    <div class="container">
      <h1>Many specialized shops all under one roof</h1>
      <p class="hero-subtitle">From precision woodworking to experimental electronics</p>
    </div>
  </section>

  <nav class="shop-subnav" aria-label="Shop navigation">
    <div class="container">
      <ul role="list">
        {shops.map(shop => (
          <li><a href={`#${shop.id}`}>{shop.data.title}</a></li>
        ))}
      </ul>
    </div>
  </nav>

  <section class="section" aria-labelledby="shops-heading">
    <div class="container">
      <h2 class="sr-only" id="shops-heading">Our Shops</h2>
      {shopsWithContent.map(({ shop, Content }) => (
        <ShopDetail
          id={shop.id}
          title={shop.data.title}
          tagline={shop.data.tagline}
          image={shop.data.image}
          equipment={shop.data.equipment}
          content={Content}
        />
      ))}
    </div>
  </section>

  <Testimonial
    quote="From the moment I joined Make Nashville, the Slack channel immediately helped me feel like I was part of the community."
    attribution="Jenny, Make Nashville member"
  />
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

  .shop-subnav {
    padding: var(--spacing-sm) 0 var(--spacing-md);
  }

  .shop-subnav ul {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    justify-content: center;
  }

  .shop-subnav a {
    display: block;
    background: var(--color-bg-alt);
    color: var(--color-link);
    padding: 0.35rem 0.85rem;
    border-radius: 20px;
    font-size: 0.85rem;
    text-decoration: none;
  }

  .shop-subnav a:hover {
    background: var(--color-link);
    color: var(--color-text);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
```

- [ ] **Step 3: Verify /our-space page renders**

```bash
npm run dev
```

Navigate to `/our-space/`. Expected: Hero, shop pill nav, all 12 shop detail sections with equipment tags, testimonial at bottom.

- [ ] **Step 4: Commit**

```bash
git add src/components/ShopDetail.astro src/pages/our-space.astro
git commit -m "feat: add Our Space page with shop details and sub-navigation"
```

---

### Task 10: Calendar and Get Involved pages

**Files:**
- Create: `src/pages/calendar.astro`
- Create: `src/pages/get-involved.astro`

- [ ] **Step 1: Create calendar.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Calendar - Make Nashville" description="Upcoming classes, workshops, and open houses at Make Nashville.">
  <section class="hero">
    <div class="container">
      <h1>Upcoming Classes & Events</h1>
      <p class="hero-subtitle">Member-led workshops and open houses</p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="eventbrite-embed">
        <iframe
          src="https://www.eventbrite.com/o/make-nashville-9796500814"
          title="Make Nashville events on Eventbrite"
          loading="lazy"
        ></iframe>
        <p class="eventbrite-fallback">
          View our events on <a href="https://www.eventbrite.com/o/make-nashville-9796500814">Eventbrite</a>.
        </p>
      </div>
    </div>
  </section>
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

  .eventbrite-embed {
    border: 2px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
    min-height: 600px;
  }

  .eventbrite-embed iframe {
    width: 100%;
    height: 600px;
    border: none;
  }

  .eventbrite-fallback {
    text-align: center;
    padding: var(--spacing-sm);
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }
</style>
```

- [ ] **Step 2: Create get-involved.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

const shops = (await getCollection('shops')).sort((a, b) => a.data.order - b.data.order);
const orientationRequired = shops.filter(s => s.data.orientationRequired);
const openAccess = shops.filter(s => !s.data.orientationRequired);
---
<BaseLayout title="Get Involved - Make Nashville" description="Join Make Nashville for $75/month. Learn about membership, volunteering, donations, and policies.">
  <section class="hero">
    <div class="container">
      <h1>Membership</h1>
      <p class="price">$75/month</p>
      <p class="hero-subtitle">No contract. Cancel anytime. 18+ with valid photo ID.</p>
    </div>
  </section>

  <section class="section" aria-labelledby="includes-heading">
    <div class="container">
      <h2 id="includes-heading">What's Included</h2>
      <ul class="includes-list" role="list">
        <li>Key fob for 24/7 facility access</li>
        <li>Tool access after safety training</li>
        <li>Slack community membership</li>
        <li>Member-led shop orientations</li>
      </ul>
    </div>
  </section>

  <section class="section section--alt" aria-labelledby="join-heading">
    <div class="container">
      <h2 id="join-heading">How to Join</h2>
      <ol class="steps" role="list">
        <li>
          <span class="step-number">1</span>
          <div>
            <strong>Attend an Open House</strong>
            <p>Every other Friday at 6 PM. Tour the shops and meet members.</p>
            <a href="https://www.eventbrite.com/e/165415485169?aff=oddtdtcreator" class="btn btn--primary">RSVP on Eventbrite</a>
          </div>
        </li>
        <li>
          <span class="step-number">2</span>
          <div>
            <strong>Complete Paperwork & Payment</strong>
            <p>Sign the membership agreement and set up monthly payment.</p>
          </div>
        </li>
        <li>
          <span class="step-number">3</span>
          <div>
            <strong>Complete Orientations</strong>
            <p>Required before accessing equipment in certain shops.</p>
          </div>
        </li>
      </ol>
    </div>
  </section>

  <section class="section" aria-labelledby="access-heading">
    <div class="container">
      <h2 id="access-heading">Shop Access</h2>
      <div class="access-grid">
        <div class="access-card">
          <h3>Orientation Required</h3>
          <ul role="list">
            {orientationRequired.map(shop => <li>{shop.data.title}</li>)}
          </ul>
        </div>
        <div class="access-card">
          <h3>Open Access</h3>
          <ul role="list">
            {openAccess.map(shop => <li>{shop.data.title}</li>)}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--alt" aria-labelledby="contribute-heading">
    <div class="container">
      <h2 id="contribute-heading">Give Back</h2>
      <div class="contribute-grid">
        <div class="contribute-card">
          <h3>Volunteer</h3>
          <p>Make Nashville employs two paid staff members. The daily maintenance, care, and leadership of the space is volunteer-based.</p>
        </div>
        <div class="contribute-card">
          <h3>Donate</h3>
          <p>Support the space through monetary donations via our <a href="https://go.makenashville.org/sustaining">contribution page</a>, <a href="https://venmo.com/makenashville">Venmo</a>, or check. Physical item donations require shop captain approval.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="policies-heading">
    <div class="container">
      <h2 id="policies-heading">Policies & FAQ</h2>
      <dl class="faq">
        <div class="faq-item">
          <dt>Guests</dt>
          <dd>Guests are welcome with a signed liability waiver and must be accompanied by a member at all times.</dd>
        </div>
        <div class="faq-item">
          <dt>Children</dt>
          <dd>Children are permitted except in the woodshop, metalshop, and autoshop. A signed waiver is required.</dd>
        </div>
        <div class="faq-item">
          <dt>Dogs</dt>
          <dd>Dogs are allowed unless their behavior concerns other members.</dd>
        </div>
        <div class="faq-item">
          <dt>Parking</dt>
          <dd>Park in front of the building or in the gated side area (members only).</dd>
        </div>
      </dl>
    </div>
  </section>

  <section class="section section--alt cta-section">
    <div class="container">
      <h2>Ready to make something?</h2>
      <a href="https://members.makenashville.org/civicrm/contribute/transact/?reset=1&id=19" class="btn btn--primary">Join Us</a>
    </div>
  </section>
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

  .price {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: var(--spacing-xs);
  }

  .hero-subtitle {
    color: var(--color-text-dim);
  }

  .section h2 {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-md);
  }

  .includes-list {
    list-style: none;
    max-width: 500px;
    margin: 0 auto;
  }

  .includes-list li {
    padding: var(--spacing-xs) 0;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-secondary);
  }

  .includes-list li:last-child {
    border-bottom: none;
  }

  .steps {
    list-style: none;
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .steps li {
    display: flex;
    gap: var(--spacing-sm);
    align-items: flex-start;
  }

  .step-number {
    background: var(--color-link);
    color: var(--color-text);
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  .steps p {
    color: var(--color-text-muted);
    margin: 0.25rem 0 0.5rem;
    font-size: 0.95rem;
  }

  .access-grid,
  .contribute-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }

  .access-card,
  .contribute-card {
    background: var(--color-bg-alt);
    border-radius: 8px;
    padding: var(--spacing-md);
  }

  .access-card h3,
  .contribute-card h3 {
    font-size: 1.1rem;
    margin-bottom: var(--spacing-sm);
  }

  .access-card ul {
    list-style: none;
  }

  .access-card li {
    padding: 0.25rem 0;
    color: var(--color-text-secondary);
  }

  .contribute-card p {
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  .faq {
    max-width: 700px;
    margin: 0 auto;
  }

  .faq-item {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-sm) 0;
  }

  .faq-item:last-child {
    border-bottom: none;
  }

  .faq-item dt {
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .faq-item dd {
    color: var(--color-text-muted);
    margin-left: 0;
  }

  .cta-section {
    text-align: center;
    padding: var(--spacing-lg) 0;
  }

  .cta-section h2 {
    margin-bottom: var(--spacing-sm);
  }

  @media (max-width: 600px) {
    .access-grid,
    .contribute-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Step 3: Verify both pages render**

```bash
npm run dev
```

Navigate to `/calendar/` and `/get-involved/`. Expected: Calendar page shows Eventbrite embed area. Get Involved page shows membership info, steps, shop access, volunteering, donations, policies, and final CTA.

- [ ] **Step 4: Commit**

```bash
git add src/pages/calendar.astro src/pages/get-involved.astro
git commit -m "feat: add Calendar and Get Involved pages"
```

---

### Task 11: Pull images from current site

**Files:**
- Create: `public/images/shops/*.webp` (12 files)
- Create: `public/favicon.ico`

- [ ] **Step 1: Discover image URLs from the current site**

Fetch the current site's HTML and extract all shop image URLs:

```bash
curl -s https://makenashville.org/our-space | grep -oE 'https://[^"]+\.(jpg|jpeg|png|webp|avif)' | sort -u
```

Also check the homepage:

```bash
curl -s https://makenashville.org | grep -oE 'https://[^"]+\.(jpg|jpeg|png|webp|avif)' | sort -u
```

- [ ] **Step 2: Download shop images**

Create the directory and download each image. Convert to WebP if needed using `sips` (built into macOS):

```bash
mkdir -p public/images/shops
```

For each image URL found, download and convert. Example pattern:

```bash
curl -sL "<image-url>" -o public/images/shops/3d-printing.webp
```

If images are not WebP, convert with:

```bash
sips -s format webp public/images/shops/3d-printing.jpg --out public/images/shops/3d-printing.webp
```

Repeat for all 12 shops: `3d-printing`, `art-studio`, `autoshop`, `cnc`, `ceramics`, `darkroom`, `electronics-lab`, `laser`, `metalshop`, `photo-studio`, `sewing`, `woodshop`.

- [ ] **Step 3: Download favicon**

```bash
curl -sL https://makenashville.org/favicon.ico -o public/favicon.ico
```

- [ ] **Step 4: Verify images load in dev server**

```bash
npm run dev
```

Expected: Homepage shop grid shows all 12 images. Our Space page shows full-width images for each shop.

- [ ] **Step 5: Commit**

```bash
git add public/images/ public/favicon.ico
git commit -m "feat: add shop images and favicon from current site"
```

---

### Task 12: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create deploy.yml**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6
      - name: Install, build, and upload
        uses: withastro/action@v6

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: Verify build still passes**

```bash
npm run build
```

Expected: Build succeeds, static files output to `dist/`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions workflow for GitHub Pages deployment"
```

---

### Task 13: Final build verification and cleanup

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: Clean build, no warnings or errors.

- [ ] **Step 2: Preview the built site**

```bash
npm run preview
```

Navigate through all 4 pages. Verify:
- All navigation links work
- All images load
- Shop cards on homepage link to correct anchors on /our-space
- Skip nav link works
- Mobile hamburger menu works
- Footer links are correct
- External links (Join Us, Donate, Eventbrite, Slack, Instagram, GitHub, Venmo) open correctly

- [ ] **Step 3: Check accessibility basics**

- Tab through all pages with keyboard only; verify focus indicators are visible
- Verify heading hierarchy (h1 > h2 > h3) on each page
- Verify all images have alt text
- Verify skip nav link is first focusable element

- [ ] **Step 4: Add .superpowers to .gitignore if not already present**

Verify `.superpowers/` is in `.gitignore`.

- [ ] **Step 5: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup and build verification"
```
