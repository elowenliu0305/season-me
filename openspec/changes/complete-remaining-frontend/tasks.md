## 1. Image Compatibility Fix

- [x] 1.1 Rename `images/IMG_0925.PNG` to `images/IMG_0925.jpg`
- [x] 1.2 Update quiz image reference in `QUIZ_DATA` from `.PNG` to `.jpg`

## 2. localStorage Storage Monitor

- [x] 2.1 Add `smse.getUsage()` method returning total bytes of all `smse_` keys
- [x] 2.2 Enhance `smse.set` / `smse.setJSON` to catch `QuotaExceededError` and show toast
- [x] 2.3 Add size estimate check before photo save (>3MB triggers warning toast)

## 3. SEO Meta Tags

- [x] 3.1 Add `<meta name="description">` tag in `<head>`
- [x] 3.2 Add Open Graph meta tags (og:title, og:description, og:image, og:url, og:type)
- [x] 3.3 Add JSON-LD structured data for WebApplication schema

## 4. PWA Support

- [x] 4.1 Create `manifest.json` with app name, icons, theme color, standalone display
- [x] 4.2 Add `<link rel="manifest">` and apple-mobile-web-app meta tags in `<head>`
- [x] 4.3 Create `sw.js` service worker with cache-first strategy for app shell
- [x] 4.4 Add quiz image caching in service worker (fetch + cache on first use, 30-day expiry)
- [x] 4.5 Register service worker in `app.js` on DOMContentLoaded

## 5. Dark Mode

- [x] 5.1 Add dark mode CSS variables under `[data-theme="dark"]` in `style.css` (base-bg, text-main, text-secondary only — no season overrides)
- [x] 5.2 Add dark mode overrides for Cover page, Quiz page, Identity page, Story page, Export page backgrounds
- [x] 5.3 Add dark mode toggle button (sun/moon icon) on Cover page
- [x] 5.4 Add dark mode init logic in `app.js`: check `localStorage smse_theme` → fall back to `prefers-color-scheme` → apply `data-theme`
- [x] 5.5 Persist dark mode toggle to `localStorage smse_theme` on change
- [x] 5.6 Verify share card is NOT affected by dark mode (force season theme colors)

## 6. Share Card Ratio Fix

- [x] 6.1 Verify `#share-card` maintains 3:4 aspect ratio using `aspect-ratio: 3/4` CSS property
- [x] 6.2 Add `text-overflow: ellipsis` and max-width constraints for long nicknames in share card
- [x] 6.3 Verify html2canvas output has correct 3:4 ratio (test via `canvas.toDataURL` dimensions)

## 7. Analytics (Plausible)

- [x] 7.1 Add Plausible `<script defer>` in `<head>` (placeholder domain, to be updated on deploy)
- [x] 7.2 Add `QuizStarted` event tracking when user navigates from Identity to Quiz
- [x] 7.3 Add `QuizCompleted` event tracking when Darkroom analysis completes
- [x] 7.4 Add `ShareCardGenerated` event tracking when user navigates to Export page
- [x] 7.5 Add `ImageSaved` event tracking when user clicks Save or Publish button
