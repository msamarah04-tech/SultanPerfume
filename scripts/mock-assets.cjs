const fs = require('fs');
const path = require('path');
const outDir = path.resolve('public', 'generated', 'animations');

const ensure = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
ensure(outDir);

// Minimal 1x1 transparent PNG
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

const files = [
  'black-marble-texture.png', 'light-leak-warm.png', 'radial-glow-gold.png', 'radial-glow-ivory.png', 'vignette-overlay.png',
  'home-hero.png', 'home-hero-mobile.png', 'about-banner.png', 'shop-banner.png', 'contact-banner.png', 'order-confirmed-bg.png',
  'loading-shimmer.png', 'empty-cart.png', 'empty-orders.png', 'not-found-404.png'
];

files.forEach(f => {
  const p = path.join(outDir, f);
  if (!fs.existsSync(p)) fs.writeFileSync(p, pixel);
});

['mist-disperse', 'gold-shimmer-sweep', 'gold-dust-drift'].forEach(dir => {
  ensure(path.join(outDir, dir));
  for(let i=1; i<=12; i++) {
    const p = path.join(outDir, dir, `frame-${i.toString().padStart(2, '0')}.png`);
    if (!fs.existsSync(p)) fs.writeFileSync(p, pixel);
  }
});
console.log('Placeholders created');
