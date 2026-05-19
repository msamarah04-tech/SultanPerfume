# Hero Section — Technical Documentation

**File:** `src/pages/Home.jsx` (lines 57–335)  
**Project:** Al Sultan Perfumes — Jordan  
**Language:** React (JSX) + Framer Motion + Tailwind CSS

---

## Overview

The hero section is a full-screen, scroll-driven experience that combines:

1. A **scrubbing background video** whose playback position is controlled by the user's scroll position
2. A **rotating text panel** that switches content as the user scrolls through three stages
3. A **cinematic intro animation** overlay that plays once per session before the hero is visible

It is deliberately split into two layers — the video on the right and the text on the left — following the RTL (Arabic/right-to-left) layout of the site.

---

## Architecture: Scroll Runway + Sticky Pin

```
┌─────────────────────────────────────────┐
│  <div ref={heroRef}  h-[300vh]>          │  ← 300vh scroll runway
│  ┌───────────────────────────────────┐  │
│  │  <section sticky top-0 h-screen>  │  │  ← pinned viewport
│  │  ┌──────────┐  ┌──────────────┐  │  │
│  │  │  VIDEO   │  │  TEXT PANEL  │  │  │
│  │  │ (right)  │  │   (left)     │  │  │
│  │  └──────────┘  └──────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

The outer `div` is 300vh tall and holds a `ref` for Framer Motion's `useScroll`. The inner `<section>` is `sticky top-0 h-screen`, so it stays visible in the viewport while the user scrolls through the full 300vh of the runway. This is what makes the "scrubbing" effect work without any JavaScript scroll listeners.

**Exception:** When a poster fallback is active (`showPoster = true`), the outer div collapses to `h-[100svh]` — no scroll runway is needed since there is no video to scrub.

---

## Scroll Progress & Spring Smoothing

```js
const { scrollYProgress } = useScroll({
  target: heroRef,
  offset: ['start start', 'end start'],
});

const smoothProgress = useSpring(scrollYProgress, {
  stiffness: 80,
  damping: 20,
  restDelta: 0.001,
});
```

- `scrollYProgress` is a Framer Motion value in `[0, 1]` where `0` = top of hero, `1` = hero fully scrolled past
- `useSpring` wraps it to add physical easing — without this, `video.currentTime` would jump on every scroll tick and look choppy
- `stiffness: 80` / `damping: 20` produces a slightly laggy but smooth follow — feels like the video is "breathing" with the scroll

---

## Video Scrubbing

### How it works

```js
const SCRUB_START = 0.3; // seconds — skips the black first frame

useMotionValueEvent(smoothProgress, 'change', (latest) => {
  if (showPoster) return;
  const video = videoRef.current;
  if (!video || video.readyState < 2 || !video.duration) return;

  const t = SCRUB_START + latest * (video.duration - SCRUB_START);
  if (Math.abs(video.currentTime - t) > 0.01) {
    video.currentTime = t;
  }
});
```

- The spring value (`latest`, range `[0,1]`) is mapped to `[SCRUB_START, video.duration]`
- `SCRUB_START = 0.3s` prevents the video from ever showing its black first frame
- `readyState < 2` guard prevents errors when the video hasn't buffered enough to seek
- The `0.01` threshold prevents redundant seeks that would interrupt buffering

### Video element

```jsx
<video
  ref={videoRef}
  muted
  playsInline
  preload="auto"
  poster="/hero-poster.jpg"
  onLoadedMetadata={(e) => { e.target.currentTime = 0.3; }}
  onError={() => setVideoError(true)}
  className="w-full h-full object-cover object-center"
>
  <source src="/hero-scrub.mp4" type="video/mp4" />
</video>
```

| Attribute | Purpose |
|-----------|---------|
| `muted` | Required for autoplay in browsers |
| `playsInline` | Prevents fullscreen takeover on iOS |
| `preload="auto"` | Loads the full file so scrubbing is instant |
| `poster="/hero-poster.jpg"` | Shown before metadata loads |
| `onLoadedMetadata` | Seeks to `0.3s` immediately so no black frame flashes |
| `onError` | Falls back to poster image on failure |

### Fade out at end of scroll

```js
const videoOpacity = useTransform(scrollYProgress, [0.75, 1], [1, 0.45]);
```

As the user reaches the last 25% of the scroll runway, the video dims from full opacity to 45%, preparing for the transition into the next section.

---

## Poster / Fallback Mode

```js
const showPoster = prefersReducedMotion || videoError || isTouchFallback;
```

| Condition | Trigger |
|-----------|---------|
| `prefersReducedMotion` | User has OS-level "reduce motion" setting enabled |
| `videoError` | The video file failed to load or decode |
| `isTouchFallback` | `DISABLE_SCRUB_ON_TOUCH = true` AND device has touch input (disabled by default) |

When `showPoster` is true:
- The outer div becomes `h-[100svh]` (no scroll runway)
- A static background image is shown: `url(/hero-poster.jpg)`
- All scrubbing logic is skipped

**To enable touch fallback (if iOS scrubbing stutters):** Set `DISABLE_SCRUB_ON_TOUCH = true` on line 66.

---

## Text Panel System

The text area shows one of three panels, switching as the user scrolls through the hero.

### Panel switching logic

```js
useMotionValueEvent(scrollYProgress, 'change', (v) => {
  const next = v < 0.33 ? 0 : v < 0.66 ? 1 : 2;
  setHeroPanel(prev => prev !== next ? next : prev);
});
```

| Scroll range | Panel |
|-------------|-------|
| 0% – 33% | Panel 0 — Brand / Collection |
| 33% – 66% | Panel 1 — Bundle Offer |
| 66% – 100% | Panel 2 — Product Count |

### Panel content

```js
const heroPanels = [
  {
    tagline: CONFIG.tagline,               // "فنّ الرائحة"
    words: ["عطور", "تروي", "حكاية"],
    subtitle: "من قلب الأردن — عبق الشرق وأناقة الغرب",
    cta: { label: "مجموعتنا المميزة", to: "/shop" },
  },
  {
    tagline: "العروض الخاصة",
    words: ["عروض", "لا", "تُفوَّت"],
    subtitle: `اختر ${activeBundleOffer.perfumeCount} عطور بـ ${activeBundleOffer.price} دينار مع توصيل مجاني`,
    cta: { label: "اكتشف العروض", to: `/offer/${activeBundleOffer.id}` },
  },
  {
    tagline: "مجموعتنا الحصرية",
    words: ["أكثر", "من", "300 عطر"],
    subtitle: "تشكيلة فاخرة من أرقى العطور الشرقية والغربية",
    cta: { label: "تسوّق الآن", to: "/shop" },
  },
];
```

Panel 1's subtitle and CTA link are **dynamic** — they read from `activeBundleOffer`, which is pulled from `localStorage` on mount (falls back to the default summer offer if nothing is stored).

### Panel animation

Each panel uses `AnimatePresence mode="wait"` so the exiting panel fully leaves before the new one enters:

```jsx
<motion.div
  key={heroPanel}
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
>
```

The headline **words** animate individually with a stagger and blur effect:

```jsx
initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
transition={{ duration: 0.8, delay: 0.1 + i * 0.15, ease: [0.25, 1, 0.5, 1] }}
```

- Word 0: delay `0.10s`
- Word 1: delay `0.25s`
- Word 2: delay `0.40s`

### Progress dots

Three dots at the bottom of the text panel indicate which panel is active:

```jsx
<div className={`h-[2px] rounded-full transition-all duration-500 
  ${heroPanel === i ? 'w-6 bg-gold' : 'w-2 bg-white/25'}`}
/>
```

Active dot: `w-6` (wide gold bar). Inactive: `w-2` (small white dot).

---

## Text Panel Layout (RTL)

On desktop, the section uses `flex` row layout. Because `dir="rtl"` is set at the document level:

- The **video** (`md:flex-1`) is placed first in the DOM → renders on the **right**
- The **text panel** (`md:w-[44%]`) is placed second in the DOM → renders on the **left**

This is intentional RTL-first design — no `flex-row-reverse` tricks needed.

On mobile, both panels are `absolute inset-0` and stack on top of each other. The text is centered over the video with a dark overlay effect from `bg-jet bg-opacity` via Tailwind.

---

## Scroll Indicator

```jsx
<motion.div
  style={{ opacity: prefersReducedMotion ? 0 : scrollIndicatorOpacity }}
  className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-2 z-30 pointer-events-none"
>
  <span>اسحب للأسفل</span>
  <div className="relative h-12 w-[1px] overflow-hidden bg-white/10">
    <motion.div
      animate={{ y: ["-100%", "250%"] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeIn", repeatDelay: 0.6 }}
      className="absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-gold to-transparent"
    />
  </div>
</motion.div>
```

- A gold shimmer travels down a thin vertical line on a 1.6s repeating loop
- Fades out when scroll reaches 8%: `useTransform(scrollYProgress, [0, 0.08], [1, 0])`
- Hidden entirely when `prefersReducedMotion` is true

---

## Intro Animation (Pre-Hero Overlay)

**File:** `src/components/intro/IntroAnimation.jsx`

Before the hero renders, a fullscreen black overlay plays a cinematic intro video once per browser session:

```js
const [isVisible] = useState(() => {
  return sessionStorage.getItem('introSeen') !== 'true';
});
```

- Uses `sessionStorage` — plays once per tab session, never on navigation back to home
- Video source: `public/intro.mov`
- 6-second safety timeout in case the video fails to fire `onEnded`
- Has a "تخطّى / Skip" button (`top-6 end-8`)
- Exit animation: `opacity: 0, scale: 1.05` over 0.8s

When `introSeen` is already `true`, the component returns `null` immediately — zero DOM, zero cost.

---

## Public Assets

| File | Description |
|------|-------------|
| `public/hero-scrub.mp4` | The scroll-scrubbed video. Should be optimized for seek performance (keyframe every ~0.5s) |
| `public/hero-poster.jpg` | Static fallback shown when video can't play |
| `public/intro.mov` | Cinematic intro overlay played once per session |
| `public/hero-desktop.mp4` | Alternative video (not currently used in scrub logic) |
| `public/hero-desktop.jpg` | Alternative still (not currently used) |
| `src/assets/hero.png` | Static asset in source, not used in the hero section |

---

## Key Dependencies

| Package | Usage |
|---------|-------|
| `framer-motion` | `useScroll`, `useSpring`, `useTransform`, `useMotionValueEvent`, `motion`, `AnimatePresence` |
| `react-router-dom` | `Link` for CTA buttons |
| `../lib/motion.js` | `EASE`, `DURATION`, `useReducedMotion`, `isRTL` |
| `../components/intro/IntroAnimation` | Pre-hero cinematic intro overlay |
| `../config.js` | `CONFIG.tagline` used in panel 0 |

---

## `src/lib/motion.js` — Shared Animation Constants

```js
export const EASE = {
  standard: [0.22, 1, 0.36, 1],   // snappy settle
  cinematic: [0.65, 0, 0.35, 1],  // slow in, slow out
  gentle:    [0.4, 0, 0.2, 1],    // smooth material-style
};

export const DURATION = {
  micro:    0.2,
  standard: 0.45,
  cinematic: 0.9,
};
```

These are used throughout the site for consistency. The hero uses `EASE.standard` for the video fade-in and `[0.25, 1, 0.5, 1]` (custom) for panel transitions.

---

## State Reference

| State variable | Type | Purpose |
|----------------|------|---------|
| `heroPanel` | `0 | 1 | 2` | Which text panel is currently shown |
| `videoError` | `boolean` | Switches to poster mode if video fails |
| `isTouchFallback` | `boolean` | Poster mode for touch devices (opt-in) |
| `activeBundleOffers` | `array` | List of active bundle offers from localStorage |
| `currentOfferIndex` | `number` | Currently shown offer (always 0 for hero) |
| `activeBundleOffer` | `object` | Resolved offer object used in panel 1 |

---

## Bundle Offer Loading (for Panel 1)

On mount, the component reads `localStorage.getItem('offers')`, filters for `active: true` and `type: 'bundle'`, and stores the results in `activeBundleOffers`. If nothing is stored or no active bundle offers exist, it falls back to the hardcoded default:

```js
{
  id: 'summer-5-for-25',
  titleAr: 'عرض الصيف الاستثنائي',
  perfumeCount: 5,
  price: 25,
  image: '/offer.png'
}
```

The `price` and `perfumeCount` from this object are what appear in the panel 1 subtitle. To update the offer shown in the hero, update it through the Admin → Offers panel, which writes to `localStorage`.

---

## How to Modify

### Change the hero video
Replace `public/hero-scrub.mp4`. For best scrubbing performance:
- Encode with frequent keyframes (every 0.5s or less): `-g 15` in ffmpeg
- Keep file small — aim for under 8MB
- Recommended: H.264, 1080p max, CRF 28

### Add a 4th panel
Add an object to the `heroPanels` array. The panel switching logic in `useMotionValueEvent` uses thirds — update it to quarters:
```js
const next = v < 0.25 ? 0 : v < 0.5 ? 1 : v < 0.75 ? 2 : 3;
```
Also update the outer `div` height if needed (currently `300vh`, roughly 100vh per panel).

### Disable the scrubbing video entirely
Set `const DISABLE_SCRUB_ON_TOUCH = true` to enable poster-only on touch devices, or set `videoError` to always be `true` to force poster everywhere.

### Edit panel copy
All text is in the `heroPanels` array at lines 196–215. Panel 1's subtitle is dynamic from localStorage.

### Adjust scroll-to-panel breakpoints
Edit the thresholds in the `useMotionValueEvent` for `scrollYProgress`:
```js
const next = v < 0.33 ? 0 : v < 0.66 ? 1 : 2;
//                ^^^^               ^^^^   ← change these
```

---

## Visual Layout Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    IntroAnimation                        │
│            (fixed, z-9999, plays once/session)          │
└─────────────────────────────────────────────────────────┘
                           ↓ exits after video ends

┌─────────────────────────────────────────────────────────┐
│  Hero Section  (sticky, 100vh)                          │
│  ┌──────────────────────┬──────────────────────────┐   │
│  │   TEXT PANEL (44%)   │    VIDEO PANEL (flex-1)  │   │
│  │   z-20, left         │    z-0, right            │   │
│  │                      │                          │   │
│  │  [tagline]           │  hero-scrub.mp4          │   │
│  │  [H1 words]          │  (scrubbed by scroll)    │   │
│  │  [gold divider]      │                          │   │
│  │  [subtitle]          │  OR                      │   │
│  │  [CTA button]        │                          │   │
│  │  [progress dots]     │  hero-poster.jpg         │   │
│  │                      │  (when no video)         │   │
│  └──────────────────────┴──────────────────────────┘   │
│                                                         │
│  [scroll indicator — z-30, bottom-10, fades at 8%]      │
└─────────────────────────────────────────────────────────┘
```
