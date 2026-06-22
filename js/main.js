/* ═══════════════════════════════════════════════
   CURSOR
═══════════════════════════════════════════════ */
if (window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--cx', e.clientX + 'px');
    document.documentElement.style.setProperty('--cy', e.clientY + 'px');
  });
}

/* ═══════════════════════════════════════════════
   THREE.JS — COAL CRYSTAL
═══════════════════════════════════════════════ */
(function () {
  if (typeof THREE === 'undefined') return;

  // ── Renderer
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // ── Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 0, 5.2);

  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  // ── Lights
  const ambient = new THREE.AmbientLight(0x0d1020, 3);
  scene.add(ambient);

  const blueKey = new THREE.PointLight(0x4488cc, 5, 14);
  blueKey.position.set(-3, 2.5, 3);
  scene.add(blueKey);

  const orangeKey = new THREE.PointLight(0xF57C00, 0, 16);
  orangeKey.position.set(0, 0, 2.5);
  scene.add(orangeKey);

  const fillLight = new THREE.DirectionalLight(0x224466, 0.8);
  fillLight.position.set(1, -1, -2);
  scene.add(fillLight);

  // ── Geometry: Icosahedron crystal (detail 0 = 20 raw facets)
  const icoGeo = new THREE.IcosahedronGeometry(1.25, 0);

  // Wireframe crystal (phase 1)
  const edges = new THREE.EdgesGeometry(icoGeo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 1 });
  const wireMesh = new THREE.LineSegments(edges, wireMat);
  scene.add(wireMesh);

  // Outer shell — larger icosahedron, counter-spin
  const outerGeo = new THREE.IcosahedronGeometry(1.9, 1);
  const outerEdges = new THREE.EdgesGeometry(outerGeo);
  const outerMat = new THREE.LineBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.25 });
  const outerMesh = new THREE.LineSegments(outerEdges, outerMat);
  scene.add(outerMesh);

  // Solid coal mesh (phase 2)
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0x191410,
    roughness: 0.9,
    metalness: 0.1,
    emissive: new THREE.Color(0xF57C00),
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0
  });
  const solidMesh = new THREE.Mesh(icoGeo, solidMat);
  scene.add(solidMesh);

  // ── Particles
  const PC = 480;
  const pPos  = new Float32Array(PC * 3); // current positions
  const pOrig = new Float32Array(PC * 3); // resting positions
  const pVel  = new Float32Array(PC * 3); // explosion velocities
  const pPhi  = new Float32Array(PC);     // per-particle drift phase

  const PHI = Math.PI * (3 - Math.sqrt(5)); // golden angle
  for (let i = 0; i < PC; i++) {
    // Fibonacci sphere distribution for even spread
    const y   = 1 - (i / (PC - 1)) * 2;
    const r   = Math.sqrt(1 - y * y);
    const th  = PHI * i;
    const rad = 2.4 + Math.random() * 2.2;
    const x = Math.cos(th) * r * rad;
    const z = Math.sin(th) * r * rad;
    const yy = y * rad;
    pOrig[i*3] = pPos[i*3] = x;
    pOrig[i*3+1] = pPos[i*3+1] = yy;
    pOrig[i*3+2] = pPos[i*3+2] = z;
    const len = Math.sqrt(x*x + yy*yy + z*z);
    pVel[i*3]   = (x / len) * (0.6 + Math.random() * 0.8);
    pVel[i*3+1] = (yy / len + 0.3) * (0.6 + Math.random() * 0.8);
    pVel[i*3+2] = (z / len) * (0.6 + Math.random() * 0.8);
    pPhi[i] = Math.random() * Math.PI * 2;
  }

  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const partMat = new THREE.PointsMaterial({
    color: 0x88aacc,
    size: 0.022,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true
  });
  const points = new THREE.Points(partGeo, partMat);
  scene.add(points);

  // Background plane colours
  const BG_WIRE  = new THREE.Color(0x050503);
  const BG_SOLID = new THREE.Color(0x0d0800);
  const BG_EMBER = new THREE.Color(0x1c0600);
  const COL_COOL = new THREE.Color(0x88aacc);
  const COL_HOT  = new THREE.Color(0xFF6622);

  // ── Scroll progress
  let scrollProg = 0;
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollProg = max > 0 ? scrollY / max : 0;
  }, { passive: true });

  // ── Mouse → camera nudge
  let mx = 0, my = 0, camDX = 0, camDY = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / innerWidth  - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
  });

  // Helpers
  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smooth = t => t * t * (3 - 2 * t);
  const phase  = (p, s, e) => smooth(clamp((p - s) / (e - s), 0, 1));

  // Phase label element
  const phaseLabel = document.getElementById('phaseLabel');
  const PHASE_NAMES = ['WIREFRAME', 'COAL · SOLID', 'EMBER · STORM'];

  let clock = 0;

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.01;

    const p = scrollProg;

    // Transition progress values (smooth)
    const toSolid = phase(p, 0.28, 0.48); // wireframe → solid
    const toEmber = phase(p, 0.64, 0.84); // solid → embers

    // ── Crystal rotation (always spinning)
    const speed = lerp(0.004, 0.0012, toEmber);
    wireMesh.rotation.y  += speed;
    wireMesh.rotation.x  += speed * 0.38;
    outerMesh.rotation.y -= speed * 0.55;
    outerMesh.rotation.z += speed * 0.35;
    solidMesh.rotation.copy(wireMesh.rotation);

    // ── Opacity crossfade: wireframe ↔ solid ↔ ember
    wireMat.opacity   = lerp(1, 0, toSolid);
    outerMat.opacity  = lerp(0.25, 0, toSolid);
    solidMat.opacity  = lerp(0, 1, toSolid) * lerp(1, 0, toEmber);
    solidMat.emissiveIntensity = lerp(0, 1.8, toSolid) * lerp(1, 0.1, toEmber);

    // ── Crystal shrinks then vanishes in ember phase
    const crystalScale = lerp(1, 0.04, toEmber);
    wireMesh.scale.setScalar(crystalScale);
    outerMesh.scale.setScalar(crystalScale);
    solidMesh.scale.setScalar(crystalScale);

    // ── Lights
    blueKey.intensity   = lerp(5, 0, toSolid);
    orangeKey.intensity = lerp(0, 10, toSolid) * lerp(1, 0.4, toEmber);
    orangeKey.position.x = Math.sin(clock * 0.6) * 2.2;
    orangeKey.position.y = Math.cos(clock * 0.4) * 1.8;

    const ambCol = new THREE.Color().lerpColors(
      new THREE.Color(0x0d1020),
      new THREE.Color(0x2a0e00),
      toSolid
    );
    ambCol.lerp(new THREE.Color(0x3a0800), toEmber * 0.6);
    ambient.color.copy(ambCol);
    ambient.intensity = lerp(3, 5, toEmber);

    // ── Particles
    const pos = partGeo.attributes.position.array;
    for (let i = 0; i < PC; i++) {
      if (toEmber > 0) {
        // Explosion — fly outward + upward drift
        pos[i*3]   = pOrig[i*3]   + pVel[i*3]   * toEmber * 9;
        pos[i*3+1] = pOrig[i*3+1] + pVel[i*3+1] * toEmber * 9 + clock * toEmber * 0.4;
        pos[i*3+2] = pOrig[i*3+2] + pVel[i*3+2] * toEmber * 9;
      } else {
        // Gentle ambient drift around crystal
        const drift = Math.sin(clock * 0.7 + pPhi[i]) * 0.14;
        const rise  = Math.cos(clock * 0.5 + pPhi[i] * 1.3) * 0.09;
        pos[i*3]   = pOrig[i*3]   + drift;
        pos[i*3+1] = pOrig[i*3+1] + rise;
        pos[i*3+2] = pOrig[i*3+2] + drift * 0.7;
      }
    }
    partGeo.attributes.position.needsUpdate = true;

    const t01 = clamp(toSolid + toEmber, 0, 1);
    partMat.color.lerpColors(COL_COOL, COL_HOT, t01);
    partMat.opacity = lerp(0.5, 0.95, toEmber);
    partMat.size    = lerp(0.022, 0.048, toEmber);

    // ── Background colour
    const bg = new THREE.Color().lerpColors(BG_WIRE, BG_SOLID, toSolid);
    bg.lerp(BG_EMBER, toEmber);
    scene.background = bg;

    // ── Camera — gentle mouse parallax + zoom back during embers
    camDX += (mx * 0.38 - camDX) * 0.04;
    camDY += (-my * 0.28 - camDY) * 0.04;
    camera.position.x = camDX;
    camera.position.y = camDY;
    camera.position.z = lerp(5.2, 6.5, toEmber);
    camera.lookAt(0, 0, 0);

    // ── Phase label
    if (phaseLabel) {
      const idx = toEmber > 0.5 ? 2 : toSolid > 0.5 ? 1 : 0;
      phaseLabel.textContent = PHASE_NAMES[idx];
    }

    // ── Progress bar
    const pf = document.getElementById('progFill');
    const pl = document.getElementById('progLabel');
    if (pf) pf.style.width = (p * 100).toFixed(1) + '%';
    if (pl) pl.textContent = `// ${String(Math.round(p * 100)).padStart(2, '0')}%`;

    // ── Scroll cue fades after hero
    const cue = document.getElementById('scrollCue');
    if (cue) cue.style.opacity = String(1 - clamp(p / 0.07, 0, 1));

    renderer.render(scene, camera);
  }
  animate();
})();

/* ═══════════════════════════════════════════════
   SOUND — Web Audio industrial drone
═══════════════════════════════════════════════ */
let audioCtx = null, gainMaster = null, soundOn = false;

function buildSound() {
  if (audioCtx) return;
  audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
  gainMaster = audioCtx.createGain();
  gainMaster.gain.value = 0;
  gainMaster.connect(audioCtx.destination);

  // Brown noise
  const bufLen = audioCtx.sampleRate * 4;
  const buf    = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
  const data   = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufLen; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    data[i] = last * 3.5;
  }
  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buf; noiseNode.loop = true;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.045;
  noiseNode.connect(noiseGain);
  noiseGain.connect(gainMaster);
  noiseNode.start();

  // Low rumble oscillators
  [55, 82.5, 110].forEach((freq, i) => {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.024 / (i + 1);
    osc.connect(gain); gain.connect(gainMaster);
    osc.start();
  });
}

const soundBtn   = document.getElementById('soundBtn');
const soundState = document.getElementById('soundState');
if (soundBtn) {
  soundBtn.addEventListener('click', () => {
    buildSound();
    soundOn = !soundOn;
    gainMaster.gain.setTargetAtTime(soundOn ? 1 : 0, audioCtx.currentTime, 0.5);
    soundState.textContent = soundOn ? 'ON' : 'OFF';
    soundBtn.classList.toggle('active', soundOn);
    if (soundOn && audioCtx.state === 'suspended') audioCtx.resume();
  });
}

/* ═══════════════════════════════════════════════
   STICKY NAV
═══════════════════════════════════════════════ */
const stickyNav = document.getElementById('stickyNav');
const heroSec   = document.getElementById('s0');
if (stickyNav && heroSec) {
  new IntersectionObserver(([e]) => {
    stickyNav.classList.toggle('visible', !e.isIntersecting);
  }, { threshold: 0.1 }).observe(heroSec);
}

/* ═══════════════════════════════════════════════
   PANEL REVEAL
═══════════════════════════════════════════════ */
document.querySelectorAll('.ss-panel').forEach(el => {
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) el.classList.add('visible');
  }, { threshold: 0.1 }).observe(el);
});

/* ═══════════════════════════════════════════════
   ORIGINS BAR FILL
═══════════════════════════════════════════════ */
document.querySelectorAll('.or-row').forEach(el => {
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) el.classList.add('visible');
  }, { threshold: 0.4 }).observe(el);
});

/* ═══════════════════════════════════════════════
   COUNTER
═══════════════════════════════════════════════ */
document.querySelectorAll('.counter').forEach(el => {
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    let cur = 0;
    const step = target / 55;
    const iv = setInterval(() => {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(iv); }
      el.textContent = Math.floor(cur) + suffix;
    }, 22);
  }, { threshold: 0.5 }).observe(el);
});

/* ═══════════════════════════════════════════════
   PRODUCT LIST HOVER
═══════════════════════════════════════════════ */
const plDetail = document.getElementById('plDetail');
document.querySelectorAll('.pl-row').forEach(row => {
  row.addEventListener('mouseenter', () => {
    if (plDetail) plDetail.textContent = '// ' + (row.dataset.detail || '');
  });
  row.addEventListener('mouseleave', () => {
    if (plDetail) plDetail.textContent = '// Hover a product for specifications';
  });
});

/* ═══════════════════════════════════════════════
   MAGNETIC BUTTONS
═══════════════════════════════════════════════ */
document.querySelectorAll('.cf-btn, .sound-btn, .sn-links a, .ft-right a').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r  = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width  / 2)) * 0.3;
    const dy = (e.clientY - (r.top  + r.height / 2)) * 0.3;
    el.style.transition = 'transform 0.08s ease';
    el.style.transform  = `translate(${dx}px,${dy}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1)';
    el.style.transform  = '';
  });
});

/* ═══════════════════════════════════════════════
   TEXT SCRAMBLE on section headings
═══════════════════════════════════════════════ */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%';
function scramble(el) {
  const html  = el.innerHTML;
  const plain = el.textContent;
  let revealed = 0;
  const total  = plain.replace(/\s/g, '').length;
  const iv = setInterval(() => {
    let ci = 0;
    el.innerHTML = html.replace(/[A-Z0-9]/g, ch => {
      ci++;
      return ci <= revealed ? ch : CHARS[Math.floor(Math.random() * CHARS.length)];
    });
    if (++revealed > total) { el.innerHTML = html; clearInterval(iv); }
  }, 30);
}
document.querySelectorAll('.ss-title').forEach(el => {
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !el.dataset.sc) {
      el.dataset.sc = '1';
      setTimeout(() => scramble(el), 200);
    }
  }, { threshold: 0.5 }).observe(el);
});

/* ═══════════════════════════════════════════════
   SMOOTH SCROLL
═══════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ═══════════════════════════════════════════════
   CONTACT FORM
═══════════════════════════════════════════════ */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.cf-btn');
    btn.innerHTML = 'ENQUIRY SENT ✓';
    btn.style.background = '#16a34a';
    btn.style.color = '#fff';
    btn.style.borderColor = '#16a34a';
    setTimeout(() => {
      btn.innerHTML = '<span class="cf-btn-text">SEND ENQUIRY</span><span class="cf-btn-arr">→</span>';
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
      form.reset();
    }, 3500);
  });
}
