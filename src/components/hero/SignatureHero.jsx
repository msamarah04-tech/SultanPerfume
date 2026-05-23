import { useRef, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion';

const SCENES = [
  {
    id: 'bella',
    name: 'Bella',
    tagline: 'هدوءٌ من اللافندر',
    image: '/images/hero/bella.png',
    accent: '#7D5BA6',
    accent2: '#C1A8E0',
    glow: 'rgba(125, 91, 166, 0.32)',
  },
  {
    id: 'alsultan',
    name: 'Al Sultan',
    tagline: 'فخامة لا تُنسى',
    image: '/images/hero/alsultan.png',
    accent: '#B8941F',
    accent2: '#F0D979',
    glow: 'rgba(184, 148, 31, 0.38)',
  },
  {
    id: 'pantera',
    name: 'Pantera',
    tagline: 'ياسمين بنعومة الحرير',
    image: '/images/hero/pantera.png',
    accent: '#A06B7A',
    accent2: '#E7B9C5',
    glow: 'rgba(160, 107, 122, 0.36)',
  },
];

const BG = '#FAF7F2';

export default function SignatureHero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const boundsRef = useRef({ top: 0, height: 0 });
  const vhRef = useRef(0);

  const { scrollY } = useScroll();
  const progress = useMotionValue(0);

  useEffect(() => {
    const measure = () => {
      const el = sectionRef.current;
      if (!el) return;
      boundsRef.current = { top: el.offsetTop, height: el.offsetHeight };
      if (window.innerHeight > vhRef.current) vhRef.current = window.innerHeight;
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    return () => window.removeEventListener('resize', measure);
  }, []);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const { top, height } = boundsRef.current;
    if (window.innerHeight > vhRef.current) vhRef.current = window.innerHeight;
    const vh = vhRef.current || window.innerHeight;
    const scrollable = height - vh;
    const p = scrollable > 0 ? Math.max(0, Math.min(1, (y - top) / scrollable)) : 0;
    progress.set(p);
  });

  return (
    <section
      ref={sectionRef}
      aria-label="Signature perfumes"
      className="relative w-full"
      style={{ height: '320vh', background: BG }}
    >
      <div
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: '100dvh' }}
      >
        <CreativeBackdrop progress={progress} reduced={reduced} />

        {/* Bottles — pure crossfade, zero transform animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {SCENES.map((scene, i) => (
            <BottleStill key={scene.id} scene={scene} index={i} progress={progress} />
          ))}
        </div>

        {/* Labels — crossfade only */}
        <div className="absolute inset-x-0 bottom-16 sm:bottom-20 z-30 text-center px-6 pointer-events-none">
          {SCENES.map((scene, i) => (
            <SceneLabel key={scene.id} scene={scene} index={i} progress={progress} />
          ))}
        </div>

        {!reduced && <ScrollHint progress={progress} />}
      </div>
    </section>
  );
}

// ── Bottle: just an image, crossfade tied to scroll, no transform ──────────
function BottleStill({ scene, index, progress }) {
  const slot = index / (SCENES.length - 1);
  const isFirst = index === 0;
  const isLast = index === SCENES.length - 1;
  const W = 0.20;

  const input = isFirst
    ? [0, Math.min(1, slot + W), Math.min(1, slot + W * 2)]
    : isLast
      ? [Math.max(0, slot - W * 2), Math.max(0, slot - W), 1]
      : [slot - W * 2, slot - W, slot + W, slot + W * 2];
  const output = isFirst ? [1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0];

  const opacity = useTransform(progress, input, output);
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? 'hidden' : 'visible'));

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity, visibility, willChange: 'opacity' }}
    >
      <div className="relative">
        <img
          src={scene.image}
          alt={`${scene.name} perfume bottle`}
          className="max-h-[68vh] w-auto block select-none"
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <div
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            bottom: '-12px',
            width: '70%',
            height: '26px',
            background:
              'radial-gradient(ellipse closest-side, rgba(40, 25, 10, 0.34) 0%, transparent 70%)',
          }}
        />
      </div>
    </motion.div>
  );
}

function SceneLabel({ scene, index, progress }) {
  const slot = index / (SCENES.length - 1);
  const isFirst = index === 0;
  const isLast = index === SCENES.length - 1;
  const W = 0.20;

  const input = isFirst
    ? [0, Math.min(1, slot + W), Math.min(1, slot + W * 2)]
    : isLast
      ? [Math.max(0, slot - W * 2), Math.max(0, slot - W), 1]
      : [slot - W * 2, slot - W, slot + W, slot + W * 2];
  const output = isFirst ? [1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0];
  const opacity = useTransform(progress, input, output);
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? 'hidden' : 'visible'));

  return (
    <motion.div className="absolute inset-x-0 bottom-0" style={{ opacity, visibility }}>
      <h2 className="font-serif text-4xl sm:text-6xl tracking-wide" style={{ color: scene.accent }}>
        {scene.name}
      </h2>
      <p className="mt-3 text-base sm:text-lg" style={{ color: '#1A1A1A99' }}>
        {scene.tagline}
      </p>
    </motion.div>
  );
}

// ── The creative background: mesh + arabesque + constellation + spotlight ──
function CreativeBackdrop({ progress, reduced }) {
  // Smoothly interpolate accent + glow color through the scenes.
  const accents = SCENES.map(s => s.accent);
  const accents2 = SCENES.map(s => s.accent2);
  const glows = SCENES.map(s => s.glow);
  const stops = SCENES.map((_, i) => i / (SCENES.length - 1));

  const accent = useTransform(progress, stops, accents);
  const accent2 = useTransform(progress, stops, accents2);
  const glow = useTransform(progress, stops, glows);

  // Spotlight position drifts horizontally as you scroll (purely scroll-driven).
  const spotX = useTransform(progress, [0, 0.5, 1], ['28%', '50%', '72%']);
  const spotY = useTransform(progress, [0, 0.5, 1], ['38%', '46%', '40%']);

  const spotlight = useTransform(
    [spotX, spotY, glow],
    ([x, y, g]) => `radial-gradient(circle at ${x} ${y}, ${g} 0%, transparent 55%)`,
  );

  const meshBg = useTransform(
    [accent, accent2],
    ([a, b]) => `
      radial-gradient(at 15% 20%, ${a}22 0%, transparent 50%),
      radial-gradient(at 85% 25%, ${b}28 0%, transparent 55%),
      radial-gradient(at 75% 85%, ${a}1f 0%, transparent 50%),
      radial-gradient(at 25% 80%, ${b}1a 0%, transparent 55%)
    `,
  );

  const bottomHaze = useTransform(glow, (g) => `linear-gradient(to top, ${g} 0%, transparent 100%)`);

  // Static brand-gold for all the ornamental layers. Tying their stroke /
  // fill colors to scroll meant every wheel event wrote inline style to 30+
  // DOM nodes (ring strokes, constellation dots, light shafts, frame),
  // which paint-bombed each frame. The mesh + spotlight + bottom haze still
  // morph through the scene's accent — that's enough color story.
  const ORNAMENT_GOLD = '#B8941F';

  return (
    <>
      {/* Soft mesh gradient that morphs with scroll */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: meshBg }}
      />

      {/* Color-shifting spotlight follows the scene */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: spotlight }}
      />

      {/* Slow drifting arabesque tile pattern — pure CSS animation, not scroll-driven */}
      {!reduced && <ArabesquePattern color={ORNAMENT_GOLD} />}

      {/* Concentric ornament rings — gentle independent spin */}
      {!reduced && <OrnamentRings color={ORNAMENT_GOLD} />}

      {/* Constellation of dots, gently twinkling */}
      {!reduced && <Constellation color={ORNAMENT_GOLD} />}

      {/* Vertical scanlines of light */}
      {!reduced && <LightShafts color={ORNAMENT_GOLD} />}

      {/* Inner gold frame — static color */}
      <div
        aria-hidden="true"
        className="absolute inset-6 sm:inset-10 pointer-events-none border"
        style={{ borderColor: `${ORNAMENT_GOLD}55` }}
      />

      {/* Bottom haze rising */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
        style={{ background: bottomHaze }}
      />

      <style>{`
        @keyframes heroPatternDrift {
          0%   { transform: translate3d(0,0,0); }
          100% { transform: translate3d(-220px, -220px, 0); }
        }
        @keyframes heroSlowSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes heroReverseSpin {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }
        @keyframes heroTwinkle {
          0%,100% { opacity: 0.15; transform: scale(0.85); }
          50%     { opacity: 0.85; transform: scale(1.15); }
        }
        @keyframes heroShaft {
          0%   { transform: translateY(-100%); opacity: 0; }
          15%  { opacity: 0.9; }
          85%  { opacity: 0.9; }
          100% { transform: translateY(120%); opacity: 0; }
        }
        @media (max-width: 768px) {
          .hero-constellation span:nth-child(n+14) { display: none; }
        }
      `}</style>
    </>
  );
}

function ArabesquePattern({ color }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ animation: 'heroPatternDrift 80s linear infinite', willChange: 'transform' }}
    >
      <svg
        className="absolute -inset-[15%] w-[130%] h-[130%]"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="arabesque-tile" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
            <g fill="none" stroke={color} strokeWidth="0.7" opacity={0.18}>
              <path d="M80 10 L96 64 L150 64 L106 96 L122 150 L80 118 L38 150 L54 96 L10 64 L64 64 Z" />
              <path d="M80 35 L92 70 L130 70 L100 92 L112 128 L80 106 L48 128 L60 92 L30 70 L68 70 Z" />
              <circle cx="80" cy="80" r="6" />
              <circle cx="80" cy="80" r="22" />
              <line x1="0" y1="80" x2="160" y2="80" />
              <line x1="80" y1="0" x2="80" y2="160" />
              <line x1="0" y1="0" x2="160" y2="160" />
              <line x1="160" y1="0" x2="0" y2="160" />
            </g>
          </pattern>
        </defs>
        <rect width="800" height="800" fill="url(#arabesque-tile)" />
      </svg>
    </div>
  );
}

function OrnamentRings({ color }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Outer slow ring */}
      <div className="absolute" style={{ animation: 'heroSlowSpin 120s linear infinite', willChange: 'transform' }}>
        <svg viewBox="0 0 600 600" className="w-[95vmin] h-[95vmin] opacity-[0.18]">
          <g fill="none" stroke={color} strokeWidth="0.6">
            <circle cx="300" cy="300" r="290" />
            <circle cx="300" cy="300" r="270" strokeDasharray="2 8" />
            {Array.from({ length: 24 }).map((_, i) => (
              <line key={i} x1="300" y1="20" x2="300" y2="40"
                transform={`rotate(${(i * 360) / 24} 300 300)`} />
            ))}
          </g>
        </svg>
      </div>

      {/* Mid medallion, opposite direction */}
      <div className="absolute" style={{ animation: 'heroReverseSpin 90s linear infinite', willChange: 'transform' }}>
        <svg viewBox="0 0 600 600" className="w-[72vmin] h-[72vmin] opacity-[0.15]">
          <g fill="none" stroke={color} strokeWidth="0.8">
            <circle cx="300" cy="300" r="220" strokeDasharray="1 4" />
            <circle cx="300" cy="300" r="180" />
            {Array.from({ length: 16 }).map((_, j) => (
              <path key={j} d="M300,120 Q314,210 300,300 Q286,210 300,120 Z"
                transform={`rotate(${(j * 360) / 16} 300 300)`} />
            ))}
          </g>
        </svg>
      </div>

      {/* Inner ornament ring */}
      <div className="absolute" style={{ animation: 'heroSlowSpin 60s linear infinite', willChange: 'transform' }}>
        <svg viewBox="0 0 600 600" className="w-[52vmin] h-[52vmin] opacity-[0.10]">
          <g fill="none" stroke={color} strokeWidth="0.6">
            <circle cx="300" cy="300" r="140" strokeDasharray="3 3" />
            <circle cx="300" cy="300" r="110" />
            {Array.from({ length: 8 }).map((_, j) => (
              <circle key={j} cx="300" cy="180" r="3"
                transform={`rotate(${(j * 360) / 8} 300 300)`} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

function Constellation({ color }) {
  const dots = Array.from({ length: 14 }).map((_, i) => ({
    left: `${(i * 41 + 7) % 100}%`,
    top: `${(i * 23 + 11) % 100}%`,
    size: 2 + (i % 3),
    delay: `${(i * 0.7) % 9}s`,
    duration: `${4 + (i % 5)}s`,
  }));
  return (
    <div aria-hidden="true" className="absolute inset-0 hero-constellation pointer-events-none">
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            background: color,
            boxShadow: `0 0 8px ${color}`,
            animation: `heroTwinkle ${d.duration} ease-in-out ${d.delay} infinite`,
            willChange: 'opacity, transform',
          }}
        />
      ))}
    </div>
  );
}

function LightShafts({ color }) {
  const gradient = `linear-gradient(to bottom, transparent, ${color}40, transparent)`;
  const cols = [12, 28, 48, 64, 82];
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      {cols.map((c, i) => (
        <span
          key={i}
          className="absolute top-0 h-full w-[1px]"
          style={{
            left: `${c}%`,
            background: gradient,
            animation: `heroShaft ${10 + i * 2}s ease-in-out ${i * 1.4}s infinite`,
            opacity: 0.4,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}

function ScrollHint({ progress }) {
  const opacity = useTransform(progress, [0, 0.08], [1, 0]);
  return (
    <motion.div aria-hidden="true"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      style={{ opacity }}>
      <div className="w-6 h-10 rounded-full border flex items-start justify-center pt-2"
        style={{ borderColor: 'rgba(26,26,26,0.45)' }}>
        <span className="block w-1 h-2 rounded-full"
          style={{ background: 'rgba(26,26,26,0.6)', animation: 'heroBounce 2.2s ease-in-out infinite' }} />
      </div>
    </motion.div>
  );
}
