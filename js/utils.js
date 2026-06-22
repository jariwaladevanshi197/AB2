/* ═══════════════════════════════════════════════
   SHARED UTILITIES — loaded on every page
═══════════════════════════════════════════════ */

/* ── Cursor ── */
if (window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--cx', e.clientX + 'px');
    document.documentElement.style.setProperty('--cy', e.clientY + 'px');
  });
}

/* ── Sound ── */
window.buildSound = function () {
  if (window._audioCtx) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  window._audioCtx = ctx;
  const gm = ctx.createGain(); gm.gain.value = 0; gm.connect(ctx.destination);
  window._gainMaster = gm;
  const bl = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, bl, ctx.sampleRate);
  const d = buf.getChannelData(0); let last = 0;
  for (let i = 0; i < bl; i++) { const w = Math.random()*2-1; last=(last+0.02*w)/1.02; d[i]=last*3.5; }
  const nb = ctx.createBufferSource(); nb.buffer=buf; nb.loop=true;
  const ng = ctx.createGain(); ng.gain.value=0.04;
  nb.connect(ng); ng.connect(gm); nb.start();
  [55,82.5,110].forEach((f,i)=>{
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sine'; o.frequency.value=f; g.gain.value=0.022/(i+1);
    o.connect(g); g.connect(gm); o.start();
  });
};
let _soundOn = false;
const _soundBtn   = document.getElementById('soundBtn');
const _soundState = document.getElementById('soundState');
if (_soundBtn) {
  _soundBtn.addEventListener('click', () => {
    window.buildSound();
    _soundOn = !_soundOn;
    window._gainMaster.gain.setTargetAtTime(_soundOn ? 1 : 0, window._audioCtx.currentTime, 0.5);
    if (_soundState) _soundState.textContent = _soundOn ? 'ON' : 'OFF';
    _soundBtn.classList.toggle('active', _soundOn);
    if (_soundOn && window._audioCtx.state === 'suspended') window._audioCtx.resume();
  });
}

/* ── Sticky nav ── */
(function () {
  const nav = document.getElementById('stickyNav');
  if (!nav) return;
  if (document.body.classList.contains('subpage')) {
    nav.classList.add('visible');
    return;
  }
  const hero = document.getElementById('s0') || document.getElementById('hero');
  if (hero) new IntersectionObserver(([e]) => nav.classList.toggle('visible', !e.isIntersecting), { threshold: 0.1 }).observe(hero);
})();

/* ── Panel reveal ── */
document.querySelectorAll('.ss-panel').forEach(el =>
  new IntersectionObserver(([e]) => { if (e.isIntersecting) el.classList.add('visible'); }, { threshold: 0.1 }).observe(el)
);

/* ── Origin bar fills ── */
document.querySelectorAll('.or-row').forEach(el =>
  new IntersectionObserver(([e]) => { if (e.isIntersecting) el.classList.add('visible'); }, { threshold: 0.35 }).observe(el)
);

/* ── Counter animation ── */
document.querySelectorAll('.counter').forEach(el =>
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    const target = parseInt(el.dataset.target), suffix = el.dataset.suffix || '';
    let cur = 0;
    const iv = setInterval(() => {
      cur += target / 55;
      if (cur >= target) { cur = target; clearInterval(iv); }
      el.textContent = Math.floor(cur) + suffix;
    }, 22);
  }, { threshold: 0.5 }).observe(el)
);

/* ── Text scramble on .ss-title ── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%';
function scramble(el) {
  const html = el.innerHTML, plain = el.textContent;
  let rev = 0; const total = plain.replace(/\s/g,'').length;
  const iv = setInterval(() => {
    let ci = 0;
    el.innerHTML = html.replace(/[A-Z0-9]/g, ch => { ci++; return ci<=rev ? ch : CHARS[Math.floor(Math.random()*CHARS.length)]; });
    if (++rev > total) { el.innerHTML = html; clearInterval(iv); }
  }, 30);
}
document.querySelectorAll('.ss-title').forEach(el =>
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !el.dataset.sc) { el.dataset.sc='1'; setTimeout(()=>scramble(el),180); }
  }, { threshold: 0.5 }).observe(el)
);

/* ── Smooth scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a =>
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  })
);

/* ── Contact form ── */
const _form = document.getElementById('contactForm');
if (_form) {
  _form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = _form.querySelector('.cf-btn');
    btn.innerHTML = 'ENQUIRY SENT ✓';
    btn.style.cssText = 'background:#16a34a;color:#fff;border-color:#16a34a';
    setTimeout(() => {
      btn.innerHTML = '<span class="cf-btn-text">SEND ENQUIRY</span><span class="cf-btn-arr">→</span>';
      btn.style.cssText = '';
      _form.reset();
    }, 3500);
  });
}

/* ── Magnetic buttons ── */
document.querySelectorAll('.cf-btn,.sound-btn,.sn-links a,.ft-right a,.nav-pill').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    el.style.transition = 'transform 0.08s ease';
    el.style.transform = `translate(${(e.clientX-(r.left+r.width/2))*.3}px,${(e.clientY-(r.top+r.height/2))*.3}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1)';
    el.style.transform = '';
  });
});

/* ── Product list hover (if present) ── */
const _plDetail = document.getElementById('plDetail');
document.querySelectorAll('.pl-row').forEach(row => {
  row.addEventListener('mouseenter', () => { if (_plDetail) _plDetail.textContent = '// ' + (row.dataset.detail||''); });
  row.addEventListener('mouseleave', () => { if (_plDetail) _plDetail.textContent = '// Hover a product for specifications'; });
});

/* ── Progress bar (if present) ── */
window.addEventListener('scroll', () => {
  const pf = document.getElementById('progFill');
  const pl = document.getElementById('progLabel');
  if (!pf && !pl) return;
  const p = window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  if (pf) pf.style.width = (p*100).toFixed(1)+'%';
  if (pl) pl.textContent = `// ${String(Math.round(p*100)).padStart(2,'0')}%`;
  const cue = document.getElementById('scrollCue');
  if (cue) cue.style.opacity = String(1 - Math.min(1, p/0.07));
}, { passive: true });
