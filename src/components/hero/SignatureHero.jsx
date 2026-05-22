import { useRef, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion';

// Pointer devices use Lenis which already interpolates scrollY between wheel
// events, so an extra spring just adds lag. Touch devices use native scroll
// and any spring is felt as the bottle "trailing" the finger — also lag.
// Skip the spring on touch entirely; on pointer, keep a very light spring
// to soak up any remaining micro-jumps.
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



export default function SignatureHero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const boundsRef  = useRef({ top: 0, height: 0 });
  // Cache the LARGEST window.innerHeight ever seen. On iOS Safari the URL bar
  // slides in/out and `window.innerHeight` swings ~100px during scroll —
  // recomputing progress against that moving denominator causes the bottles
  // to jolt mid scroll-back. Locking to lvh keeps the math stable.
  const vhRef = useRef(0);

  const { scrollY } = useScroll();
  const progressValue = useMotionValue(0);

  // On touch, drive transforms straight off the raw motion value — no spring,
  // no lag. On pointer, a very tight spring soaks up the small gaps between
  // wheel events (Lenis already does most of the work).
  const smooth = useSpring(progressValue, {
    stiffness: 400,
    damping: 50,
    mass: 0.1,
    restDelta: 0.0005,
  });
  const progress = IS_TOUCH ? progressValue : smooth;

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
    progressValue.set(p);
  });

  return (
    <section
      ref={sectionRef}
      aria-label="Signature perfumes"
      className="relative w-full"
      style={{ height: '320vh', background: BG }}
    >
      {/* Sticky stage — browser pins it natively. No JS position-flipping,
          which on iOS used to cause stacking-context flicker and a vertical
          jolt as the URL bar slid in during scroll-back. */}
      <div
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: '100dvh' }}
      >
        {SCENES.map((scene, i) => (
          <AtmosphereHaze key={`haze-${scene.id}`} scene={scene} index={i} progress={progress} />
        ))}
        {SCENES.map((scene, i) => (
          <Scene key={scene.id} scene={scene} index={i} progress={progress} reduced={reduced} />
        ))}
        {!reduced && <ScrollHint progress={progress} />}
      </div>
    </section>
  );
}

// ─── Sub-components (unchanged) ───────────────────────────────────────────────

function AtmosphereHaze({ scene, index, progress }) {
  const slot = index / (SCENES.length - 1);
  const isFirst = index === 0;
  const isLast  = index === SCENES.length - 1;
  const W = 0.20;
  const input  = isFirst ? [0, Math.min(1, slot + W), Math.min(1, slot + W * 2)]
               : isLast  ? [Math.max(0, slot - W * 2), Math.max(0, slot - W), 1]
               :            [slot - W * 2, slot - W, slot + W, slot + W * 2];
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
  const slot    = index / (nScenes - 1);
  const isFirst = index === 0;
  const isLast  = index === nScenes - 1;
  const W = 0.20;

  const opInput  = isFirst ? [0, Math.min(1, slot + W), Math.min(1, slot + W * 2)]
                 : isLast  ? [Math.max(0, slot - W * 2), Math.max(0, slot - W), 1]
                 :            [slot - W * 2, slot - W, slot + W, slot + W * 2];
  const opOutput = isFirst ? [1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0];
  const sceneOpacity = useTransform(progress, opInput, opOutput);

  const pStart = isFirst ? 0 : Math.max(0, slot - 0.30);
  const pEnd   = isLast  ? 1 : Math.min(1, slot + 0.30);

  const filigreeY     = useTransform(progress, [pStart, pEnd], reduced ? ['0%','0%']    : [isFirst ? '0%'  : '8%',   isLast ? '0%'  : '-8%']);
  const filigreeScale = useTransform(progress, [pStart, pEnd], reduced ? [1,1]          : [isFirst ? 1     : 0.92,   isLast ? 1     : 1.08]);
  const glowY         = useTransform(progress, [pStart, pEnd], reduced ? ['0%','0%']    : [isFirst ? '0%'  : '20%',  isLast ? '0%'  : '-20%']);
  const glowScale     = useTransform(progress, [pStart, pEnd], reduced ? [1,1]          : [isFirst ? 1     : 0.85,   isLast ? 1     : 1.15]);
  const bottleY       = useTransform(progress, [pStart, pEnd], reduced ? ['0%','0%']    : [isFirst ? '0%'  : '30%',  isLast ? '0%'  : '-30%']);
  const bottleScale   = useTransform(progress, [pStart, pEnd], reduced ? [1,1]          : [isFirst ? 1     : 0.75,   isLast ? 1     : 1.25]);

  const tMid  = isFirst ? 0.15 : isLast ? pEnd - 0.15 : slot;
  const textY = useTransform(progress, [pStart, tMid, pEnd], reduced ? ['0px','0px','0px'] : [isFirst ? '0px' : '16px', '0px', isLast ? '0px' : '-16px']);

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: sceneOpacity, willChange: 'opacity' }}
    >
      <motion.div aria-hidden="true" className="absolute inset-0 flex items-center justify-center"
        style={{ y: filigreeY, scale: filigreeScale, willChange: 'transform' }}>
        <svg viewBox="0 0 600 600" className="w-[88vmin] h-[88vmin] opacity-[0.12]"
          style={!reduced ? { animation: 'heroSpin 90s linear infinite' } : {}}>
          <g stroke={scene.accent} strokeWidth="0.8" fill="none">
            <circle cx="300" cy="300" r="280" />
            <circle cx="300" cy="300" r="220" strokeDasharray="2 6" />
            <circle cx="300" cy="300" r="160" />
            <circle cx="300" cy="300" r="100" strokeDasharray="1 4" />
            {Array.from({ length: 12 }).map((_, j) => (
              <path key={j} d="M300,40 Q320,150 300,260 Q280,150 300,40 Z"
                transform={`rotate(${(j * 360) / 12} 300 300)`} />
            ))}
          </g>
        </svg>
      </motion.div>

      <motion.div aria-hidden="true" className="absolute inset-0 flex items-center justify-center"
        style={{ y: glowY, scale: glowScale, willChange: 'transform' }}>
        <div className="w-[80vmin] h-[80vmin] rounded-full"
          style={{ background: `radial-gradient(closest-side, ${scene.glow} 0%, transparent 70%)` }} />
      </motion.div>

      <motion.div className="absolute inset-0 flex items-center justify-center"
        style={{ y: bottleY, scale: bottleScale, willChange: 'transform' }}>
        <img src={scene.image} alt={`${scene.name} perfume bottle`}
          className="max-h-[70vh] w-auto select-none" draggable={false}
          style={{ filter: 'drop-shadow(0 24px 50px rgba(50, 30, 10, 0.22))' }} />
      </motion.div>

      {!reduced && (
        <Particles color={scene.particleColor} progress={progress} isFirst={isFirst} isLast={isLast} slot={slot} />
      )}

      <motion.div className="absolute inset-x-0 bottom-16 sm:bottom-20 z-20 text-center px-6"
        style={{ y: textY }}>
        <h2 className="font-serif text-4xl sm:text-6xl tracking-wide" style={{ color: scene.accent }}>
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
  const pStart   = isFirst ? 0 : Math.max(0, slot - 0.30);
  const pEnd     = isLast  ? 1 : Math.min(1, slot + 0.30);
  const wrapperY = useTransform(progress, [pStart, pEnd], [isFirst ? '0%' : '40%', isLast ? '0%' : '-40%']);

  const particles = Array.from({ length: 14 }).map((_, i) => ({
    left: `${(i * 23) % 100}%`,
    size: 2 + (i % 3) * 2,
    delay: `${(i * 0.4) % 8}s`,
    duration: `${10 + (i % 5)}s`,
  }));

  return (
    <motion.div aria-hidden="true" className="absolute inset-0 hero-particles"
      style={{ y: wrapperY, willChange: 'transform' }}>
      {particles.map((p, i) => (
        <span key={i} className="absolute bottom-0 rounded-full"
          style={{ left: p.left, width: p.size, height: p.size, background: color,
                   opacity: 0.55, animation: `heroDrift ${p.duration} linear ${p.delay} infinite` }} />
      ))}
    </motion.div>
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
