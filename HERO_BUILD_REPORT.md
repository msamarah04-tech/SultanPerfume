# Cinematic Parallax Hero — Build Report

Branch: `hero/cinematic-parallax` (created from `main` at `e622677`).

## 1. Prerequisites

All three bottle PNGs are present in `public/images/hero/`:

| File | Size |
|---|---|
| `bella.png` | 145 KB |
| `alsultan.png` | 295 KB |
| `pantera.png` | 162 KB |

Baseline build: clean. Baseline lint: **3 pre-existing errors + 1
warning**, all in files unrelated to this task (see §8). Confirmed with
user that gap-fill should proceed; no new lint issues were introduced.

## 2. Lenis configuration

Mounted in `src/App.jsx` inside the root `App` component's `useEffect`.
Configuration:

```js
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: false,
  wheelMultiplier: 1,
  touchMultiplier: 1.2,
});
```

The Lenis `raf` loop runs through `gsap.ticker` rather than a plain
`requestAnimationFrame`. This is an intentional divergence from the
prompt (confirmed with user) because the Home page below the hero
relies on GSAP `ScrollTrigger` animations — sharing the ticker keeps
them in sync with Lenis-driven scroll. `lenis.on('scroll',
ScrollTrigger.update)` is wired so ScrollTrigger reads Lenis scroll
position on every frame.

Also confirmed with user: the existing `if (isTouch) return;` guard at
the top of the effect is kept. Touch devices skip Lenis entirely and
use native iOS/Android scroll. The prompt's spec achieves the same
outcome via `smoothTouch: false`; the early-return is a stricter
version that avoids even Lenis's wheel listeners on touch.

`window.__lenis` is exposed for `ScrollToTop` (which already uses it).

## 3. `smoothTouch`

`smoothTouch: false`, set explicitly in the Lenis config above.

## 4. Cursor spotlight removal

- `enableCursorSpotlight` in `src/config.js` is now `false`.
- No `<CursorSpotlight />` JSX usage exists anywhere in the codebase
  (verified via `grep -rn "CursorSpotlight" src/`). The component file
  `src/components/ui/CursorSpotlight.jsx` is left on disk per the
  prompt's instruction, but it has no callers and the only remaining
  reference is its own self-import in version history.
- No imports of `CursorSpotlight` were found to remove.

## 5. Frame-rate measurements

Not collected — the harness ran code edits + build/lint only; there was
no live browser session or DevTools Performance recording. The hero is
GPU-accelerated (only `y` / `scale` / `opacity` motion values; `willChange:
'transform'` set on the moving layers; mobile particle count throttled
from 14 to 7 via the new `.hero-particles span:nth-child(n+8)`
media-query rule). Real-device measurement is a manual step left for
the user.

## 6. Pantera contrast

The Pantera glow alpha is **already `0.28`** in `SCENES[2].glow`
(`rgba(160, 107, 122, 0.28)`) — between the spec's default 0.20 and
the suggested boost of 0.32. This was set in prior work, not as part
of this task. No further tuning applied; if Pantera still reads thin
in browser, bump to `0.32` as the prompt instructs.

## 7. Hero implementation note

`src/components/hero/SignatureHero.jsx` is a refined version of the
prompt's spec, not a verbatim copy. Differences (all kept intentionally
per user direction):

- Uses window `scrollY` + manual `top`/`bottom` measurement +
  `useMotionValueEvent` rather than `useScroll({ target: ref, offset })`.
- Directly mutates the stage's `position` between `absolute` / `fixed`
  to avoid iOS Safari's well-known `position: sticky` jank under
  the dynamic URL bar.
- Branches off `IS_TOUCH` to bypass spring smoothing on touch (Framer
  Motion springs add input latency the user can feel).
- Already uses three-stop opacity ramps for first/last scenes so Bella
  is visible at scroll-top and Pantera doesn't fade out before
  the section ends.

`hero-particles` class added in this task to the `<Particles>` wrapper
so the new mobile-throttle CSS rule bites.

## 8. Unreferenced files (left in place per spec)

- `src/components/ui/SpriteSequence.jsx` — no importers (`grep`
  confirms only self-export).
- `src/components/ui/CursorSpotlight.jsx` — no JSX callers.
- `public/hero.mp4` — no references in src/.

Pre-existing lint baseline (not introduced by this task, not fixed):

| File | Line | Issue |
|---|---|---|
| `server/src/app.js` | 44 | unused var `e` |
| `src/components/product/ProductCard.jsx` | 5 | unused import `useReducedMotion` |
| `src/pages/Home.jsx` | 4 | unused import `EASE` |
| `src/pages/OfferSelection.jsx` | 72 | exhaustive-deps warning |

## 9. Other-route verification

Not exercised in a live browser. The changes that could affect
non-Home routes are limited to: (a) Lenis adding `touchMultiplier:
1.2` (no-op when `smoothTouch:false`), (b) flipping
`enableCursorSpotlight` to `false` (no-op — no renderers), and (c) a
mobile-only CSS rule scoped to `.hero-particles` (only present in
SignatureHero). No route-affecting code was touched.

## Diff summary

| File | Change |
|---|---|
| `src/config.js` | `enableCursorSpotlight: true` → `false` |
| `src/App.jsx` | Added `touchMultiplier: 1.2` to Lenis config |
| `src/components/hero/SignatureHero.jsx` | Added `hero-particles` class to Particles wrapper |
| `src/index.css` | Added `@media (max-width: 768px) { .hero-particles span:nth-child(n+8) { display: none; } }` |
