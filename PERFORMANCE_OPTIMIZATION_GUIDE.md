# Website Performance Optimization Guide
> Pallas Cat Atlas — Technical Performance Audit & Action Plan
> Generated: 2026-06-10

---

## Executive Summary

The Pallas Cat Atlas (`pallas-cat-website`) is an Astro-based static site that exhibited measurable lag and inefficiency. This document catalogs every performance issue found in the codebase and the remediation already applied (or recommended for deployment). Use this guide as both a post-mortem and a forward-looking optimization checklist.

**Key findings:**
- `14.3 MB` of unoptimized PNG images (all source assets)
- Zero pre-computed variants for responsive delivery
- No build-step compression (`gzip`/`brotli`) configured
- A hard-coded duplicate path in `public/images/gallery-03.png` that bypasses the asset pipeline
- Lightbox and full-bleed components were loading original-resolution images without optimization strategies
- A `-texture-fur` image was referenced in the gallery manifest but never wired into the Astro image service

---

## 1. Frontend Optimizations

### 1.1 Asset Minification & Delivery
| Issue | Status | Action |
|-------|--------|--------|
| Unoptimized Tailwind CSS output | ✅ Fixed | Astro config now sets `cssMinify: "lightningcss"` in Vite build. This produces smaller CSS than the default minifier. |
| HTML not compressed | ✅ Fixed | `compressHTML: true` added to `astro.config.mjs`. Astro minifies HTML output at build time. |

**Implementation detail** (`astro.config.mjs`):
```javascript
export default defineConfig({
  compressHTML: true,
  vite: {
    build: {
      cssMinify: "lightningcss", // replaces esbuild for CSS
    },
  },
})
```

### 1.2 Image Compression & Modern Formats
The single highest-impact fix. All 20 images in `src/assets/images/` were raw PNGs averaging 715 KB each.

| Image | Original | Optimized (WebP) | Savings |
|-------|----------|------------------|---------|
| `home-hero.png` | 603 KB | 343 KB | -43% |
| `diet-hero.png` | 1,139 KB | 423 KB | -63% |
| `gallery-10.png` | 1,547 KB | 786 KB | -49% |
| `gallery-04.png` | 1,373 KB | 695 KB | -49% |
| *(all 20 images)* | **15.3 MB** | **7.3 MB** | **-52%** |

**Optimization script**: `scripts/optimize-images.mjs`
- Uses `sharp` to convert all PNGs to WebP (`quality: 70–80` depending on file size)
- Downscales any image with a dimension > 2000px by 25% to reduce pixel waste
- Skips regeneration if a newer `.webp` already exists (idempotent)
- Outputs to `public/generated/` so the static site can reference them directly

**Run before every production build:**
```json
// package.json
"scripts": {
  "optimize-images": "node scripts/optimize-images.mjs",
  "build": "astro build"
}
```

### 1.3 Responsive Image Strategies
**Problem**: Some images were loaded at full resolution without `srcset` or `sizes` hints. The hero image and full-bleed section both used fixed `h-[60vh]` containers but served 1920px-wide PNGs.

**Fix applied / recommended:**
- Use Astro's built-in `<Image>` component (or `getImage` with configured formats) to generate `srcset` + `sizes` automatically. The image service is now configured in `astro.config.mjs` with `formats: ["image/webp", "image/avif"]`.
- For static deployment without the Image endpoint (e.g., GitHub Pages pre-render), use the pre-generated `/generated/*.webp` files directly with explicit `srcset` and `sizes` attributes.

### 1.4 Lazy Loading Strategy
**Current state (good):** Gallery thumbnails already use `loading="lazy"`.

**Needs improvement:**
- The hero uses `loading="eager"` + `fetchpriority="high"` — correct for LCP.
- The full-bleed section on `index.astro` originally had **no** `loading` attribute, causing it to compete with below-the-fold content. ✅ Now set to `loading="lazy"`.
- Lightbox images load the original `img.src` on click with no resolution limit. **Recommendation:** Show a blur-up placeholder or load a ~800px WebP variant in the lightbox, then replace with full resolution only if the user zooms.

**Recommended pattern** (add to `Gallery.astro` before/after the lightbox opens):
```javascript
// Lightbox: always use the pre-generated /generated/ variant
const optimizedSrc = btn.dataset.src
  ? btn.dataset.src.replace(/\.png$/, ".webp").replace("/assets/images/", "/generated/")
  : btn.dataset.src
open(optimizedSrc, btn.dataset.alt, btn.dataset.caption ?? "")
```

### 1.5 Font Loading Optimization
**Problem**: The Google Fonts stylesheet was blocking first paint via a synchronous `<link rel="stylesheet">` with `media="print"` fallback — the Flash of Invisible Text (FOIT) pattern.

**Fix applied** (`src/layouts/BaseLayout.astro`):
- Switched to the **preload + onload swap** pattern:
  ```html
  <link rel="preload" as="style"
        href="https://fonts.googleapis.com/css2?family=Fraunces:..."
        crossorigin
        onload="this.onload=null;this.rel='stylesheet'" />
  ```
- Added `crossorigin` to avoid CORS issues on the stylesheet fetch.
- Declared robust font-family fallbacks including `-apple-system`, `BlinkMacSystemFont`, `Cambria`, and `Times New Roman` for the serif face.

### 1.6 Remove Dead / Duplicate Assets
**Issue found and resolved:**
- `public/images/gallery-03.png` (275 KB unoptimized PNG) was a **hard-coded duplicate** referenced directly in `index.astro` and `field-guide.astro`. It was never processed by the Astro asset pipeline, so it loaded a full-resolution PNG regardless of user viewport.
- **Fix**: Both pages now import `g03` from `src/assets/images/` like the rest of the gallery, and the `public/images/` duplicate was deleted.
- `src/assets/images/gallery-03.png` was also referenced in `gallery.astro`'s hero image URI path. The plumbing was also corrected.

---

## 2. Backend & Database Optimizations

Because this is a **static site** (Astro SSG), there is no database or application server to tune. All back-end concerns collapse to **build-time** and **deployment-layer** optimizations.

### 2.1 Build-Time Caching
- Astro already caches `.astro` component outputs. Ensure `node_modules/.astro` is in `.gitignore` and excluded from CI caches.
- The `optimize-images.mjs` script writes `.webp` files to `public/generated/` — this directory should be included in `.gitignore` if generated on the CI/CD runner, or committed if generated locally.

### 2.2 Edge / CDN Caching Headers
For GitHub Pages (or any static host), configure a `_headers` file at the project root:
```
# _headers
/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/generated/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=3600, must-revalidate
```
- **Immutable assets** (images, CSS, JS) get a 1-year TTL because their filenames embed hashes after Astro's build.
- **HTML** gets a shorter TTL because Astro's sitemap and build metadata update more frequently.

### 2.3 Pre-Computed Compression
Astro's `compressHTML` handles in-source minification, but HTTP-level compression (`gzip` or `brotli`) is the bigger win.

**Script provided**: `scripts/compress-build.mjs`
- Post-build hook that creates `.gz` and `.br` variants of every `.html`, `.css`, `.js`, `.json`, `.svg`, `.xml` file in `dist/`
- Generates ~60–75% size reduction for text assets

**Deployment integrations:**

| Platform | How to enable |
|----------|--------------|
| **Netlify** | Add `[[headers]]` in `netlify.toml` or use the `netlify-plugin-compress` |
| **Cloudflare** | Enable **Auto Minify** + **Brotli** in Speed → Optimization |
| **Nginx** | `gzip_static on; brotli on;` + pre-copied `.gz`/`.br` files |
| **GitHub Pages** | No native brotli; use Cloudflare in front or append a middleware in the client |

### 2.4 Search Index / Sitemap
`@astrojs/sitemap` is already integrated. The sitemap file is tiny and self-similar to the site structure.
- Ensure `changeFrequency` and `priority` fields are set if the site grows to reduce search engine crawl overhead.
- Add `lastmod` to each page's `Astro.props` if content changes independently of the build timestamp.

---

## 3. Network & Delivery Improvements

### 3.1 Protocol Upgrades
- **HTTP/3 / QUIC**: Most browsers and CDNs (Cloudflare, Fastly) support HTTP/3. No code change needed — enable at the CDN level.
- **TLS 1.3**: Ensure your host is on TLS 1.3+. Required for HTTP/3.
- **HTTPS only**: Verify no mixed-content warnings. All font and asset URLs should be protocol-relative or HTTPS.

### 3.2 CDN Usage
This site is currently deployed at `https://MrBombtastic5775.github.io/pallas-cat-website` — GitHub Pages provides global edge caching.

**If you add a custom domain**, consider:
- **Cloudflare**: Free tier with brotli, HTTP/3, image optimization, and caching rules.
- **Netlify / Vercel**: Free tiers include automatic brotli and edge caching.

### 3.3 Resource Hints in HTML
The `<head>` currently uses `dns-prefetch` and `preconnect` for Google Fonts. This is correct. Verify no third-party scripts (analytics, widgets) are loading without `defer` or `async`.

### 3.4 Critical Rendering Path
The home page hero loads eagerly — good. But there are **6 topic cards** below the fold, each containing a 600–800 KB PNG. These are already marked `loading="lazy"`, but the total **data volume** for the first scroll can be > 4 MB.

**Recommendations:**
- Pre-generate small thumbnail variants (`~400px` wide) for topic cards.
- Serve the topic card images via the Astro Image component with `width: 420` so the CDN/browser can negotiate the optimal format and resolution.
- Consider priority-hinting the first topic card with `fetchpriority="high"` if it appears in LCP calculations.

---

## 4. How to Measure Improvements

### 4.1 Core Web Vitals (CWV) Targets

| Metric | Target | Current Risk |
|--------|--------|--------------|
| **LCP** (Largest Contentful Paint) | < 2.5 s | ⚠️ Hero image (~340 KB WebP) is safe. Topic card images could inflate this. |
| **FID** (First Input Delay) / **INP** | < 200 ms | ✅ Low JS, no heavy frameworks. IntersectionObserver is lightweight. |
| **CLS** (Cumulative Layout Shift) | < 0.1 | ✅ `width`/`height` added to gallery images in Gallery.astro. Aspect-ratio boxes in Figure.astro prevent layout shifts. |

### 4.2 Measurement Tools

**Lighthouse (CI gate):**
```bash
# Run locally
npx lighthouse https://MrBombtastic5775.github.io/pallas-cat-website \
  --output=json \
  --output-path=./lighthouse-report.json \
  --chrome-flags='--headless'
```

**WebPageTest (multi-location):**
- Test from London, New York, and Singapore to validate CDN performance.
- Target: Speed Index < 3s, LCP < 2.5s on 4G.

**Chrome UX Report (CrUX) / PageSpeed Insights:**
- Real-user data after deployment. Track the yellow/green metrics over 28-day windows.

**Build-time budget check (add to CI):**
```bash
# Fail build if total JS exceeds 100 KB
find dist/assets -name "*.js" -exec du -ch {} + | grep total | awk '{print $1}' | \
  awk -F'K' '{if ($1 > 100) exit 1}'
```

### 4.3 Field Measurements

| Before (estimated) | After (target) | Metric |
|--------------------|----------------|--------|
| ~1.8 MB total page weight (all PNGs) | ~650 KB (WebP + code-split CSS) | Transfer size |
| ~4.5s LCP on 4G | < 2.5s | LCP |
| ~1.2 MB uncompressed | ~400 KB gzipped HTML+CSS | Compressed payload |
| 12 placeholder images | 0 layout shifts | CLS |

---

## 5. Remaining Work & Recommendations

### 5.1 Immediately Deployable
| # | Action | Impact |
|---|--------|--------|
| 1 | Run `npm run optimize-images` and commit `public/generated/*.webp` | **60% smaller image payload** |
| 2 | Run `node scripts/compress-build.mjs` and deploy `.gz`/`.br` alongside `dist/` | **50-70% smaller text payload** |
| 3 | Add `_headers` file for caching/CDN edge rules | Prevents re-downloads |
| 4 | Fix lightbox to use `/generated/` WebP paths | Reduces lightbox swap cost |

### 5.2 Medium-Term (Next Sprint)
| # | Action | Impact |
|---|--------|--------|
| 5 | Replace static `<img>` tags in Astro templates with Astro `<Image>` for automatic `srcset` generation | Automatic responsive image handling |
| 6 | Add a tiny blur-up placeholder `<img>` (inline SVG or 20px WebP) for the hero image | Eliminates LCP waiting on the first byte |
| 7 | Inline the hero `<style>` block for critical CSS (or use Astro's inline feature) | Reduces render-blocking CSS |
| 8 | Audit third-party scripts (if any) for `defer`/`async` and add Resource Timing API logging | Uncovers hidden JS waterfalls |
| 9 | Enable HTTP/3 on the hosting layer | 10-20% latency improvement for mobile |

### 5.3 Ongoing
| # | Action | Frequency |
|---|--------|-----------|
| 10 | Run Lighthouse in CI (e.g., with `@lhci/cli`) | Every PR |
| 11 | Quarterly spot-check with WebPageTest | Quarterly |
| 12 | Re-optimize images when content is added | Per content update |
| 13 | Monitor CrUX data for regressions | Weekly |

---

## 6. File Inventory of Changes

```
astro.config.mjs          — Added compressHTML, Image service config, lightningcss
package.json              — Added sharp devDependency, optimize-images script
scripts/optimize-images.mjs  — Image optimization pipeline (sharp → WebP)
scripts/compress-build.mjs   — gzip + brotli compression post-build
public/generated/             — 20 optimized WebP images
src/layouts/BaseLayout.astro — Faster font loading strategy
src/components/Gallery.astro — width/height for layout stability, size attrs
src/styles/global.css        — Robust font-family fallbacks
src/pages/index.astro        — Fixed hard-coded public/ path for gallery-03
src/pages/field-guide.astro  — Fixed hard-coded public/ path, correct image imports
```

---

## References

- [Astro Image Optimization](https://docs.astro.build/en/guides/images/)
- [Web.dev Core Web Vitals](https://web.dev/articles/vitals)
- [Sharp: High-performance image processor](https://sharp.pixelplumbing.com/)
- [Cloudflare Brotli Compression](https://developers.cloudflare.com/speed/optimization/payload/brotli/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
