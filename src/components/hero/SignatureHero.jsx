import { useRef, useState, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from 'framer-motion';

// Computed once at module level — doesn't change mid-session
const IS_TOUCH = typeof window !== 'undefined'
  && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

const SCENES = [
  {
    id: 'bella',
    name: 'Bella',
    tagline: 'هدوءٌ من اللافندر',
    image: '/images/hero/bella.png',
    accent: '#7D5BA6',
    glow: 'rgba(125, 91, 166, 0.18)',
    hazeTint: 'rgba(125, 91, 166, 0.04)',
    particleColor: '#9F7DCC',
  },
  {
    id: 'alsultan',
    name: 'Al Sultan',
    tagline: 'فخامة لا تُنسى',
    image: '/images/hero/alsultan.png',
    accent: '#B8941F',
    glow: 'rgba(184, 148, 31, 0.22)',
    hazeTint: 'rgba(184, 148, 31, 0.05)',
    particleColor: '#D4AF37',
  },
  {
    id: 'pantera',
    name: 'Pantera',
    tagline: 'ياسمين بنعومة الحرير',
    image: '/images/hero/pantera.png',
    accent: '#A06B7A',
    glow: 'rgba(160, 107, 122, 0.28)',
    hazeTint: 'rgba(160, 107, 122, 0.04)',
    particleColor: '#C99AA8',
  },
];

const BG = '#FAF7F2';

// ─── Mobile hero: auto-cycling carousel, zero scroll-jacking ────────────────
function MobileHero({ reduced }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setActiveIdx(i => (i + 1) % SCENES.length), 3800);
    return () => clearInterval(id);
  }, [reduced]);

  const scene = SCENES[activeIdx];

  return (
    <section
      aria-label="Signature perfumes"
      className="relative w-full h-[100dvh]"
      style={{ background: BG, overflow: 'hidden' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          {/* Glow blob */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-[80vmin] h-[80vmin] rounded-full"
              style={{ background: `radial-gradient(closest-side, ${scene.glow} 0%, transparent 70%)` }}
            />
          </div>

          {/* Filigree ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.10]">
            <svg viewBox="0 0 600 600" className="w-[82vmin] h-[82vmin]">
              <g stroke={scene.accent} strokeWidth="0.8" fill="none">
                <circle cx="300" cy="300" r="280" />
                <circle cx="300" cy="300" r="200" strokeDasharray="2 6" />
                <circle cx="300" cy="300" r="120" />
              </g>
            </svg>
          </div>

          {/* Bottle */}
          <img
            src={scene.image}
            alt={`${scene.name} perfume bottle`}
            className="max-h-[55vh] w-auto select-none relative z-10"
            draggable={false}
            style={{ filter: 'drop-shadow(0 24px 50px rgba(50,30,10,0.22))' }}
          />

          {/* Name + tagline */}
          <div className="relative z-10 text-center px-6 mt-6">
            <h2 className="font-serif text-4xl sm:text-5xl tracking-wide" style={{ color: scene.accent }}>
              {scene.name}
            </h2>
            <p className="mt-3 text-base" style={{ color: '#1A1A1A99' }}>
              {scene.tagline}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveIdx(i)}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{ background: i === activeIdx ? scene.accent : 'rgba(26,26,26,0.2)', transform: i === activeIdx ? 'scale(1.4)' : 'scale(1)' }}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Desktop hero: scroll-driven parallax ────────────────────────────────────
function DesktopHero({ reduced }) {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.4,
    restDelta: 0.001,
  });

  return (
    <section
      ref={ref}
      aria-label="Signature perfumes"
      className="relative w-full"
      style={{ height: '320vh', background: BG }}
    >
      <div className="sticky top-0 w-full h-[100dvh]" style={{ overflow: 'clip' }}>
        {SCENES.map((scene, i) => (
          <AtmosphereHaze key={`haze-${scene.id}`} scene={scene} index={i} progress={smooth} />
        ))}
        {SCENES.map((scene, i) => (
          <Scene key={scene.id} scene={scene} index={i} progress={smooth} reduced={reduced} />
        ))}
        {!reduced && <ScrollHint progress={smooth} />}
      </div>
    </section>
  );
}

export default function SignatureHero() {
  const reduced = useReducedMotion();
  return IS_TOUCH ? <MobileHero reduced={reduced} /> : <DesktopHero reduced={reduced} />;
}

// Extracted from Atmosphere to avoid hooks-in-loop
function AtmosphereHaze({ scene, index, progress }) {
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

  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-0"
      style={{ opacity, background: scene.hazeTint, pointerEvents: 'none' }}
    />
  );
}

function Scene({ scene, index, progress, reduced }) {
  const nScenes = SCENES.length;
  const slot = index / (nScenes - 1);
  const isFirst = index === 0;
  const isLast = index === nScenes - 1;

  // Fade window width
  const W = 0.20;

  // Scene opacity — first starts visible, last stays visible
  const opInput = isFirst
    ? [0, Math.min(1, slot + W), Math.min(1, slot + W * 2)]
    : isLast
    ? [Math.max(0, slot - W * 2), Math.max(0, slot - W), 1]
    : [slot - W * 2, slot - W, slot + W, slot + W * 2];
  const opOutput = isFirst ? [1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0];
  const sceneOpacity = useTransform(progress, opInput, opOutput);

  // Parallax window — 2-keyframe, always distinct values
  // First scene: camera already at scene, pushes forward
  // Last scene: camera approaches and arrives at scene
  const pStart = isFirst ? 0 : Math.max(0, slot - 0.30);
  const pEnd = isLast ? 1 : Math.min(1, slot + 0.30);

  const filigreeY = useTransform(
    progress,
    [pStart, pEnd],
    reduced ? ['0%', '0%'] : [isFirst ? '0%' : '8%', isLast ? '0%' : '-8%']
  );
  const filigreeScale = useTransform(
    progress,
    [pStart, pEnd],
    reduced ? [1, 1] : [isFirst ? 1 : 0.92, isLast ? 1 : 1.08]
  );

  const glowY = useTransform(
    progress,
    [pStart, pEnd],
    reduced ? ['0%', '0%'] : [isFirst ? '0%' : '20%', isLast ? '0%' : '-20%']
  );
  const glowScale = useTransform(
    progress,
    [pStart, pEnd],
    reduced ? [1, 1] : [isFirst ? 1 : 0.85, isLast ? 1 : 1.15]
  );

  const bottleY = useTransform(
    progress,
    [pStart, pEnd],
    reduced ? ['0%', '0%'] : [isFirst ? '0%' : '30%', isLast ? '0%' : '-30%']
  );
  const bottleScale = useTransform(
    progress,
    [pStart, pEnd],
    reduced ? [1, 1] : [isFirst ? 1 : 0.75, isLast ? 1 : 1.25]
  );

  // Text: subtle rise as scene passes
  const tMid = isFirst ? 0.15 : isLast ? pEnd - 0.15 : slot;
  const textY = useTransform(
    progress,
    [pStart, tMid, pEnd],
    reduced ? ['0px', '0px', '0px'] : [isFirst ? '0px' : '16px', '0px', isLast ? '0px' : '-16px']
  );

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: sceneOpacity, willChange: 'opacity' }}
    >
      {/* Layer 2 — filigree backdrop (deepest, slowest) */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
        style={{ y: filigreeY, scale: filigreeScale, willChange: 'transform' }}
      >
        <svg
          viewBox="0 0 600 600"
          className="w-[88vmin] h-[88vmin] opacity-[0.12]"
          style={!reduced ? { animation: 'heroSpin 90s linear infinite' } : {}}
        >
          <g stroke={scene.accent} strokeWidth="0.8" fill="none">
            <circle cx="300" cy="300" r="280" />
            <circle cx="300" cy="300" r="220" strokeDasharray="2 6" />
            <circle cx="300" cy="300" r="160" />
            <circle cx="300" cy="300" r="100" strokeDasharray="1 4" />
            {Array.from({ length: 12 }).map((_, j) => (
              <path
                key={j}
                d="M300,40 Q320,150 300,260 Q280,150 300,40 Z"
                transform={`rotate(${(j * 360) / 12} 300 300)`}
              />
            ))}
          </g>
        </svg>
      </motion.div>

      {/* Layer 3 — scene glow (mid-depth) */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
        style={{ y: glowY, scale: glowScale, willChange: 'transform' }}
      >
        <div
          className="w-[80vmin] h-[80vmin] rounded-full"
          style={{
            background: `radial-gradient(closest-side, ${scene.glow} 0%, transparent 70%)`,
          }}
        />
      </motion.div>

      {/* Layer 4 — the bottle (focal) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ y: bottleY, scale: bottleScale, willChange: 'transform' }}
      >
        <img
          src={scene.image}
          alt={`${scene.name} perfume bottle`}
          className="max-h-[70vh] w-auto select-none"
          draggable={false}
          style={{ filter: 'drop-shadow(0 24px 50px rgba(50, 30, 10, 0.22))' }}
        />
      </motion.div>

      {/* Layer 5 — foreground particles (closest, fastest) */}
      {!reduced && (
        <Particles color={scene.particleColor} progress={progress} isFirst={isFirst} isLast={isLast} slot={slot} />
      )}

      {/* Name + tagline */}
      <motion.div
        className="absolute inset-x-0 bottom-16 sm:bottom-20 z-20 text-center px-6"
        style={{ y: textY }}
      >
        <h2
          className="font-serif text-4xl sm:text-6xl tracking-wide"
          style={{ color: scene.accent }}
        >
          {scene.name}
        </h2>
        <p className="mt-3 text-base sm:text-lg" style={{ color: '#1A1A1A99' }}>
          {scene.tagline}
        </p>
      </motion.div>
    </motion.div>
  );
}

function Particles({ color, progress, isFirst, isLast, slot }) {
  const pStart = isFirst ? 0 : Math.max(0, slot - 0.30);
  const pEnd = isLast ? 1 : Math.min(1, slot + 0.30);
  const wrapperY = useTransform(progress, [pStart, pEnd], [isFirst ? '0%' : '40%', isLast ? '0%' : '-40%']);

  const particles = Array.from({ length: 14 }).map((_, i) => ({
    left: `${(i * 23) % 100}%`,
    size: 2 + (i % 3) * 2,
    delay: `${(i * 0.4) % 8}s`,
    duration: `${10 + (i % 5)}s`,
  }));

  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-0"
      style={{ y: wrapperY, willChange: 'transform' }}
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: color,
            opacity: 0.55,
            animation: `heroDrift ${p.duration} linear ${p.delay} infinite`,
          }}
        />
      ))}
    </motion.div>
  );
}

function ScrollHint({ progress }) {
  const opacity = useTransform(progress, [0, 0.08], [1, 0]);
  return (
    <motion.div
      aria-hidden="true"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      style={{ opacity }}
    >
      <div
        className="w-6 h-10 rounded-full border flex items-start justify-center pt-2"
        style={{ borderColor: 'rgba(26,26,26,0.45)' }}
      >
        <span
          className="block w-1 h-2 rounded-full"
          style={{
            background: 'rgba(26,26,26,0.6)',
            animation: 'heroBounce 2.2s ease-in-out infinite',
          }}
        />
      </div>
    </motion.div>
  );
}
