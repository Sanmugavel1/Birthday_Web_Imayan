// ══════════════════════════════════════════════
//  CONFETTI ENGINE — Splash Screen
// ══════════════════════════════════════════════

(function() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], animId;

  const COLORS = ['#1A6BFF','#00D4FF','#FFFFFF','#FFD020','#FF4F9A','#7EB3FF','#2DFF8C','#3D85FF'];
  const SHAPES = ['circle','rect','triangle'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function randBetween(a,b){ return a + Math.random()*(b-a); }

  function makeParticle() {
    return {
      x: randBetween(0, W),
      y: randBetween(-H, 0),
      vx: randBetween(-1.5, 1.5),
      vy: randBetween(1.5, 4),
      size: randBetween(6, 14),
      color: COLORS[Math.floor(Math.random()*COLORS.length)],
      shape: SHAPES[Math.floor(Math.random()*SHAPES.length)],
      rot: randBetween(0, Math.PI*2),
      rotV: randBetween(-0.08, 0.08),
      alpha: 1,
      wobble: randBetween(0, Math.PI*2),
      wobbleSpeed: randBetween(0.03, 0.08)
    };
  }

  for (let i = 0; i < 120; i++) particles.push(makeParticle());

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.size/2, 0, Math.PI*2);
      ctx.fill();
    } else if (p.shape === 'rect') {
      ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -p.size/2);
      ctx.lineTo(p.size/2, p.size/2);
      ctx.lineTo(-p.size/2, p.size/2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      p.wobble += p.wobbleSpeed;
      p.x  += p.vx + Math.sin(p.wobble) * 0.8;
      p.y  += p.vy;
      p.rot += p.rotV;

      if (p.y > H + 20) {
        particles[i] = makeParticle();
        particles[i].y = -20;
      }
      drawParticle(p);
    });
    animId = requestAnimationFrame(animate);
  }
  animate();

  // Stop confetti when site is entered to save resources
  document.body.addEventListener('siteEntered', () => {
    cancelAnimationFrame(animId);
  });
})();