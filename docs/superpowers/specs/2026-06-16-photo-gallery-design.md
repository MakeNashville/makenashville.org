# Photo gallery design

**Status**: Approved, awaiting implementation plan
**Date**: 2026-06-16
**Author**: Kevin (with Claude)

## Goal

A `/gallery/` page on makenashville.org that staff and board members can populate by dropping photos into a shared Google Drive folder. No code, no PRs, no CMS to maintain.

## Constraints

- Static Astro site, deployed to GitHub Pages. No runtime server.
- Zero client-side JS is the site convention; allow CSS-only or minimal inline-script solutions only when there's no equivalent.
- Every image must have meaningful alt text (CLAUDE.md / WCAG AA).
- Build-time fetch only — Drive availability must not block normal deploys.

## Out of scope (v1)

- Albums, per-event grouping, per-shop tagging.
- Pagination — single feed at low volumes.
- Visible captions under thumbnails (alt text only).
- Moderation / draft state — anyone with Drive folder write access can publish.
- HEIC support in CI — staff upload JPEG/PNG/WebP; HEIC is skipped with a warning.

## User-facing workflow

1. Staff member opens the shared Drive folder ("Make Nashville Site Gallery").
2. Drags a photo in.
3. Right-clicks the file → File information → Details → fills in the **Description** field with descriptive alt text (e.g., "Volunteers pouring concrete in the wood shop, April 2026").
4. When ready to publish, someone with repo write access runs the "Sync gallery" workflow from the GitHub Actions tab. The workflow pulls, optimizes, commits any changes, and pushes — the existing deploy workflow ships the new photos.

A photo without a Description is skipped at sync time. The workflow log lists skipped files so a quick post-sync glance reveals missing alt text.

## Architecture

### Source

- One Google Drive folder.
- Shared read-only with a Google Cloud service account (`Reader` access).
- Folder ID stored as GitHub repo variable `GALLERY_FOLDER_ID`.
- Service account JSON stored as GitHub Secret `GOOGLE_SERVICE_ACCOUNT_KEY`.

### Sync script

`scripts/sync-gallery.mjs` — Node ESM script. Dependencies (new, dev-only):

- `googleapis` — Drive API v3 client
- `sharp` — image resize / WebP encode

Behavior:

1. If `GOOGLE_SERVICE_ACCOUNT_KEY` or `GALLERY_FOLDER_ID` is missing, log a clear message and exit 0 (no-op). Lets local builds run without secrets.
2. Authenticate to Drive with the service account.
3. List files in the folder. Filter to `image/jpeg`, `image/png`, `image/webp`. Skip `image/heic` and `image/heif` with a warning naming the file (HEIC libs are heavy in CI). Skip any non-image MIME type silently.
4. For each remaining file:
   - If `description` is empty or whitespace, skip and log a warning.
   - Download the original bytes via Drive API.
   - Use `sharp`:
     - `.rotate()` (auto-orient from EXIF)
     - Two outputs: `<file-id>-thumb.webp` (max 600px on the long edge, quality 75) and `<file-id>-large.webp` (max 1600px on the long edge, quality 80).
   - Write both to `public/images/gallery/`.
5. Build manifest array `[{ id, alt, thumb, large, createdTime, width, height }]`, sorted newest-first by `createdTime`. (`width`/`height` are the LARGE image dimensions — used to set the `<img>` intrinsic ratio.)
6. Write the manifest to `src/data/gallery.json`.
7. Clean up: any file in `public/images/gallery/` whose `<file-id>` is not in the current manifest is deleted (so removing a photo from Drive removes it from the site).

### Storage decision

Generated assets ARE committed to the repo. Rationale:

- Deploys remain deterministic — no dependence on Drive at deploy time.
- The existing deploy workflow needs no Drive credentials.
- Storage cost is small (WebP @ 1600px ≈ 200–500 KB / photo; a year of moderate use ≈ 50–100 MB in git history). Acceptable for this repo.

### Page: `src/pages/gallery.astro`

- Reads `src/data/gallery.json` at build time.
- Renders a responsive CSS grid:
  - `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));`
  - `gap: var(--spacing-sm);`
  - Each thumbnail is square (`aspect-ratio: 1; object-fit: cover;`).
  - Thumbnails are `<img loading="lazy">` with explicit `width`/`height` (or `aspect-ratio`) to prevent layout shift.
- **CSS-only lightbox via `:target`**:
  - Each thumbnail is `<a href="#photo-{id}">`.
  - Sibling overlay `<div class="lightbox" id="photo-{id}">` containing the large image and a close link `<a href="#gallery" class="lightbox-close" aria-label="Close photo viewer">`.
  - Default `.lightbox { display: none; }`. `.lightbox:target { display: flex; }` (positioned fixed, full viewport, dark backdrop).
  - Esc-to-close: a tiny inline `<script>` (~10 LOC) listens for Esc and navigates to `#gallery` if any `.lightbox:target` is present. This is the single deliberate exception to the zero-JS rule; the lightbox still functions without it (close button + back button work).
  - Focus management: when the lightbox opens (via `:target`), the close link is auto-focused via `tabindex` + `:target` ordering; trapping focus inside the lightbox is best-effort with HTML structure.
- **Empty state**: when the manifest is empty (no synced photos yet, or local dev without secrets), the page renders a short message: "Photos coming soon. Check back after the next sync."

### Trigger: `.github/workflows/sync-gallery.yml`

- `on: workflow_dispatch` only.
- Permissions: `contents: write` (needed to commit + push).
- Steps:
  1. `actions/checkout@v6`
  2. `actions/setup-node@v5` with Node 22
  3. `npm ci`
  4. `npm run sync-gallery` — runs `node scripts/sync-gallery.mjs`. Env: `GOOGLE_SERVICE_ACCOUNT_KEY`, `GALLERY_FOLDER_ID`.
  5. If `git status --porcelain` is non-empty: `git config` user, `git add public/images/gallery src/data/gallery.json`, commit "sync gallery from Drive" (Co-Authored-By the workflow), push to `main`.
  6. If nothing changed, log "no gallery changes" and exit 0.

The push to `main` triggers the existing `.github/workflows/deploy.yml`. No changes to `deploy.yml`.

### Nav placement

Add a "Gallery" link to the main nav in `src/components/Header.astro`. Position: between "Our Space" and "Calendar" (or wherever fits visually; settle during implementation).

## Accessibility

- Each `<img>` has `alt` = Drive Description.
- Lightbox uses semantic close link with `aria-label`.
- Grid items are keyboard-navigable; thumbnails have visible `:focus-visible` outline matching the site convention.
- Lightbox backdrop click closes (via wrapping the backdrop in the close link).
- Color contrast on lightbox UI must meet AA — checked during implementation.
- `prefers-reduced-motion`: no entrance animation by default; if added, gate it on `(prefers-reduced-motion: no-preference)`.

## Edge cases

- **Missing Description**: skip + log. Surface in workflow log under "Skipped:".
- **Duplicate or weird filenames**: not an issue — we key by Drive file ID, not filename.
- **EXIF rotation**: `sharp.rotate()` handles.
- **File deleted from Drive**: cleanup step in sync removes orphan assets and the manifest entry.
- **Drive API error**: sync exits non-zero, workflow fails, no commit is made — last-good state stays live.
- **Local dev**: sync no-ops without secrets; page shows empty state.
- **Photo count grows large** (>200): no v1 mitigation. Revisit with pagination or a "Load more" pattern.

## One-time setup checklist (Kevin)

1. Google Cloud project: create or reuse one for makenashville.org.
2. Enable the Google Drive API for the project.
3. Create a service account, role: none needed (Drive permission comes from sharing the folder, not IAM).
4. Generate + download a JSON key for the service account.
5. Create the Drive folder. Share with the service account's email, role "Reader".
6. Copy the folder ID from the Drive URL.
7. Add GitHub repo secrets:
   - `GOOGLE_SERVICE_ACCOUNT_KEY` → paste JSON contents
   - `GALLERY_FOLDER_ID` → the folder ID
8. Optionally document the upload workflow on the Outline wiki for staff onboarding.

## Open follow-ups (not v1)

- Visible captions on thumbnails (would also come from Drive Description, splitting alt vs. visible would need a convention).
- Per-photo "shop" tag for cross-linking to /our-space.
- Moderation / draft state (likely a "Pending" subfolder).
- Pagination once photo count grows.
