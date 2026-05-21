import { motion, useReducedMotion } from 'framer-motion';

const SCENES = [
  {
    id: 'bella',
    name: 'Bella',
    tagline: 'هدوءٌ من اللافندر',
    image: '/bella.png',
    gradient: 'linear-gradient(160deg, #3B0A4A 0%, #1A0820 60%, #0A0410 100%)',
    accent: '#C9A8E0',
    particleColor: '#E5C9F0',
  },
  {
    id: 'alsultan',
    name: 'Al Sultan',
    tagline: 'فخامة لا تُنسى',
    image: '/alsultan.png',
    gradient: 'linear-gradient(160deg, #4A2E0A 0%, #2A1A05 60%, #160C02 100%)',
    accent: '#D4AF37',
    particleColor: '#E8C77E',
  },
  {
    id: 'pantera',
    name: 'Pantera',
    tagline: 'ياسمين بنعومة الحرير',
    image: '/pantera.png',
    gradient: 'linear-gradient(160deg, #5A3540 0%, #2A1A1F 60%, #14080C 100%)',
    accent: '#E8B8C5',
    particleColor: '#F5D8DD',
  },
];

export default function SignatureHero() {
  const reduced = useReducedMotion();

  return (
    <section
      aria-label="Signature perfumes"
      className="snap-y snap-mandatory overflow-y-auto h-[100dvh] scroll-smooth"
    >
      {SCENES.map((scene) => (
        <Scene key={scene.id} scene={scene} reduced={reduced} />
      ))}
    </section>
  );
}

function Scene({ scene, reduced }) {
  return (
    <div
      className="snap-center relative w-full h-[100dvh] flex items-center justify-center overflow-hidden"
      style={{ background: scene.gradient }}
    >
      <Filigree color={scene.accent} reduced={reduced} />
      <Particles color={scene.particleColor} reduced={reduced} />

      <motion.img
        src={scene.image}
        alt={`${scene.name} perfume bottle`}
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-h-[70vh] w-auto drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)] will-change-transform"
        style={!reduced ? { animation: 'heroFloat 6s ease-in-out infinite' } : {}}
      />

      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-0 bottom-16 sm:bottom-20 z-20 text-center px-6 pointer-events-none"
      >
        <h2
          className="font-serif text-4xl sm:text-6xl tracking-wide"
          style={{ color: scene.accent }}
        >
          {scene.name}
        </h2>
        <p className="mt-3 text-base sm:text-lg text-white/80">
          {scene.tagline}
        </p>
      </motion.div>

      {scene.id === 'bella' && !reduced && <ScrollHint />}
    </div>
  );
}

function Filigree({ color, reduced }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
    >
      <svg
        viewBox="0 0 600 600"
        className="w-[80vmin] h-[80vmin] opacity-[0.12]"
        style={!reduced ? { animation: 'heroSpin 60s linear infinite' } : {}}
      >
        <g stroke={color} strokeWidth="1" fill="none">
          <circle cx="300" cy="300" r="280" />
          <circle cx="300" cy="300" r="220" strokeDasharray="2 6" />
          <circle cx="300" cy="300" r="160" />
          <circle cx="300" cy="300" r="100" strokeDasharray="1 4" />
          {Array.from({ length: 8 }).map((_, i) => (
            <path
              key={i}
              d="M300,40 Q330,150 300,260 Q270,150 300,40 Z"
              transform={`rotate(${i * 45} 300 300)`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function Particles({ color, reduced }) {
  if (reduced) return null;
  const particles = Array.from({ length: 10 }).map((_, i) => ({
    left: `${(i * 37) % 100}%`,
    size: 4 + (i % 4) * 2,
    delay: `${(i * 0.7) % 6}s`,
    duration: `${8 + (i % 5)}s`,
  }));
  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: color,
            opacity: 0.5,
            animation: `heroDrift ${p.duration} linear ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

function ScrollHint() {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
    >
      <div
        className="w-6 h-10 rounded-full border border-white/60 flex items-start justify-center pt-2"
        style={{ animation: 'heroBounce 2.2s ease-in-out infinite' }}
      >
        <span className="block w-1 h-2 rounded-full bg-white/80" />
      </div>
    </div>
  );
}
