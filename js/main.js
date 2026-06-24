// Header scroll
const siteHeader = document.getElementById('site-header');
if (siteHeader) {
  window.addEventListener('scroll', () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// Mobile nav
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    if (open) {
      navLinks.style.cssText = 'display:flex;flex-direction:column;position:fixed;top:68px;left:0;right:0;background:#fff;padding:12px 20px 20px;border-bottom:1px solid rgba(0,0,0,.07);gap:2px;z-index:198;box-shadow:0 8px 24px rgba(0,0,0,.08)';
    } else {
      navLinks.style.cssText = '';
    }
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

document.querySelectorAll('a, button, .mag-btn, .tab-v2, [data-hover]').forEach(el => {
  el.addEventListener('mouseenter', () => {
    if (cur) { cur.style.width = '20px'; cur.style.height = '20px'; }
    if (ring) { ring.style.width = '56px'; ring.style.height = '56px'; ring.style.borderColor = 'rgba(255,107,0,.8)'; }
  });
  el.addEventListener('mouseleave', () => {
    if (cur) { cur.style.width = '10px'; cur.style.height = '10px'; }
    if (ring) { ring.style.width = '36px'; ring.style.height = '36px'; ring.style.borderColor = 'rgba(255,107,0,.5)'; }
  });
});

/* ─── Scroll Progress ─── */
const prog = document.getElementById('scroll-prog');
window.addEventListener('scroll', () => {
  if (!prog) return;
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  prog.style.width = pct + '%';
}, { passive: true });

/* ─── Loader ─── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hide');
    setTimeout(() => { if (loader) loader.style.display = 'none'; }, 900);
  }, 1800);
});

/* ─── Nav scroll ─── */
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* ─── Reveal Observer ─── */
const rvEls = document.querySelectorAll('.rv, .rv-l, .rv-r, .rv-s');
const clipEls = document.querySelectorAll('.clip-inner');

const rvObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('vis'); rvObs.unobserve(e.target); }
  });
}, { threshold: .12, rootMargin: '0px 0px -40px 0px' });

rvEls.forEach(el => rvObs.observe(el));
clipEls.forEach(el => rvObs.observe(el));

/* ─── Counter Animation ─── */
const counters = document.querySelectorAll('.ctr');
const ctrObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = +el.dataset.t;
    const dur = 2000;
    const step = dur / 60;
    let current = 0;
    const inc = target / (dur / step);
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) { el.textContent = target; clearInterval(timer); }
      else { el.textContent = Math.floor(current); }
    }, step);
    ctrObs.unobserve(el);
  });
}, { threshold: .5 });
counters.forEach(c => ctrObs.observe(c));

/* ─── Magnetic Buttons ─── */
document.querySelectorAll('.mag-btn').forEach(btn => {
  const inner = btn.querySelector('.mag-btn-inner');
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    if (inner) { inner.style.transform = `translate(${x * .35}px, ${y * .35}px)`; }
    btn.style.transform = `translate(${x * .12}px, ${y * .12}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    if (inner) inner.style.transform = 'translate(0,0)';
    btn.style.transform = 'translate(0,0)';
  });
});

/* ─── Tab Switcher ─── */
window.switchTabV2 = function(cat, btn) {
  document.querySelectorAll('.tab-v2').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.panel-v2').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('pv2-' + cat);
  if (panel) {
    panel.classList.add('active');
    panel.querySelectorAll('.rv,.rv-l,.rv-r,.rv-s').forEach(el => {
      el.classList.remove('vis');
      setTimeout(() => el.classList.add('vis'), 60);
    });
    panel.querySelectorAll('.clip-inner').forEach(el => {
      el.classList.remove('vis');
      setTimeout(() => el.classList.add('vis'), 80);
    });
  }
};

/* ─── Ember Particle Canvas ─── */
function initEmbers(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.offsetWidth, H = canvas.offsetHeight;
  canvas.width = W; canvas.height = H;

  const resize = () => {
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
  };
  window.addEventListener('resize', resize);

  const embers = [];
  const N = 80;

  class Ember {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = H + Math.random() * 60;
      this.vx = (Math.random() - .5) * .8;
      this.vy = -(Math.random() * 1.2 + .4);
      this.r = Math.random() * 2.5 + .5;
      this.alpha = Math.random() * .7 + .2;
      this.life = 1;
      this.decay = Math.random() * .003 + .001;
      this.hue = Math.random() * 20 + 10;
    }
    update() {
      this.x += this.vx + Math.sin(Date.now() * .001 + this.y) * .3;
      this.y += this.vy;
      this.vx += (Math.random() - .5) * .04;
      this.life -= this.decay;
      if (this.life <= 0 || this.y < -20) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.life * this.alpha;
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3);
      grad.addColorStop(0, `hsl(${this.hue}, 100%, 80%)`);
      grad.addColorStop(.5, `hsl(${this.hue + 5}, 100%, 50%)`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < N; i++) {
    const e = new Ember();
    e.y = Math.random() * H;
    e.life = Math.random();
    embers.push(e);
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    embers.forEach(e => { e.update(); e.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
}

/* ─── Text Scramble ─── */
const chars = '!<>-_\\/[]{}—=+*^?#ABCDEFGX01';
function scramble(el, finalText, dur = 1200) {
  let iteration = 0;
  const total = dur / 30;
  const timer = setInterval(() => {
    el.textContent = finalText.split('').map((ch, i) => {
      if (ch === ' ') return ' ';
      if (i < iteration / total * finalText.length) return finalText[i];
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    iteration++;
    if (iteration > total) { el.textContent = finalText; clearInterval(timer); }
  }, 30);
}

const scrambles = document.querySelectorAll('[data-scramble]');
const scrObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      scramble(e.target, e.target.dataset.scramble);
      scrObs.unobserve(e.target);
    }
  });
}, { threshold: .8 });
scrambles.forEach(s => { s.textContent = '...'; scrObs.observe(s); });

/* ─── Stagger children ─── */
document.querySelectorAll('[data-stagger]').forEach(parent => {
  const children = parent.children;
  const delay = +(parent.dataset.stagger || 80);
  Array.from(children).forEach((child, i) => {
    child.style.transitionDelay = (i * delay) + 'ms';
  });
});
