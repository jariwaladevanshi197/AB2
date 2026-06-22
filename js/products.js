/* ═══════════════════════════════════════════════
   PRODUCTS PAGE — 5 OctahedronGeometry crystals
   Pentagon formation. Scroll activates each.
═══════════════════════════════════════════════ */
(function () {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050503);
  const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 0, 5.5);

  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  // Lights
  scene.add(new THREE.AmbientLight(0x111111, 2));
  const keyLight = new THREE.PointLight(0xffffff, 3, 16);
  keyLight.position.set(0, 3, 4);
  scene.add(keyLight);

  // Product definitions
  const PRODUCTS = [
    { col: 0x4499cc, em: 0x2266aa, name: 'STEAM COAL',    light: 0x4499cc },
    { col: 0x888899, em: 0x556677, name: 'COKING COAL',   light: 0x7788aa },
    { col: 0xaa44cc, em: 0x661188, name: 'MANGANESE ORE', light: 0xaa44cc },
    { col: 0x44cc88, em: 0x226644, name: 'CHROME ORE',    light: 0x44cc88 },
    { col: 0xdddddd, em: 0x8899aa, name: 'SILICA ORE',    light: 0xaabbcc }
  ];

  const crystalGeo = new THREE.OctahedronGeometry(0.6, 0);
  const edgeGeo    = new THREE.EdgesGeometry(crystalGeo);

  const prodLight = new THREE.PointLight(0xffffff, 0, 12);
  scene.add(prodLight);

  const crystals = PRODUCTS.map((p, i) => {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const r = 2.1;
    const pos = new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r * 0.65, 0);

    const mat = new THREE.MeshStandardMaterial({
      color: p.col, roughness: 0.35, metalness: 0.65,
      emissive: new THREE.Color(p.em), emissiveIntensity: 0.4
    });
    const mesh = new THREE.Mesh(crystalGeo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);

    const wireMat = new THREE.LineBasicMaterial({ color: p.col, transparent: true, opacity: 0.5 });
    const wire = new THREE.LineSegments(edgeGeo, wireMat);
    wire.position.copy(pos);
    scene.add(wire);

    return { mesh, wire, mat, wireMat, pos, lightCol: p.light };
  });

  // Centre glow sphere (very subtle)
  const centreGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const centreMat = new THREE.MeshBasicMaterial({ color: 0xF57C00, transparent: true, opacity: 0 });
  const centreMesh = new THREE.Mesh(centreGeo, centreMat);
  scene.add(centreMesh);

  let scroll = 0, mx = 0, my = 0, camX = 0, camY = 0, clock = 0;
  window.addEventListener('scroll', () => {
    scroll = window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  }, { passive: true });
  document.addEventListener('mousemove', e => { mx=(e.clientX/innerWidth-.5)*2; my=(e.clientY/innerHeight-.5)*2; });

  const lerp = (a,b,t) => a+(b-a)*t;
  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
  const smooth = t => t*t*(3-2*t);

  // Hero phase label
  const phaseLabel = document.getElementById('phaseLabel');

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.009;

    // Active crystal: 0-0.2=steam, 0.2-0.4=coking, 0.4-0.6=manganese, 0.6-0.8=chrome, 0.8-1=silica
    const activeFloat = scroll * 5;
    const activeIdx = Math.min(4, Math.floor(activeFloat));
    const blend = smooth(clamp(activeFloat - activeIdx, 0, 1));

    crystals.forEach((c, i) => {
      const isActive = i === activeIdx;
      const isNext   = i === (activeIdx + 1) % 5;
      let targetScale = 0.65;
      if (isActive) targetScale = lerp(1.6, 1.6, blend);
      if (isNext && activeIdx < 4) targetScale = lerp(0.65, 1.6, blend);

      const curScale = c.mesh.scale.x;
      const newScale = lerp(curScale, targetScale, 0.06);
      c.mesh.scale.setScalar(newScale);
      c.wire.scale.setScalar(newScale);
      c.wire.position.copy(c.pos);
      c.mesh.position.copy(c.pos);

      const emI = isActive ? 1.4 : 0.3;
      c.mat.emissiveIntensity = lerp(c.mat.emissiveIntensity, emI, 0.05);

      const wOpacity = isActive ? 0.9 : 0.3;
      c.wireMat.opacity = lerp(c.wireMat.opacity, wOpacity, 0.05);

      // Rotate each crystal independently
      c.mesh.rotation.y += 0.006 * (isActive ? 1.5 : 0.8);
      c.mesh.rotation.x += 0.003 * (isActive ? 1.2 : 0.5);
      c.wire.rotation.copy(c.mesh.rotation);
    });

    // Move prodLight to active crystal
    const ac = crystals[activeIdx];
    prodLight.position.lerp(ac.pos, 0.06);
    prodLight.color.setHex(ac.lightCol);
    prodLight.intensity = lerp(prodLight.intensity, 6, 0.05);

    centreMat.opacity = lerp(centreMat.opacity, 0.4, 0.03);

    // BG: subtly tinted toward active crystal colour
    const activeBGHex = [0x040508, 0x050507, 0x08040a, 0x040a06, 0x060607];
    scene.background = new THREE.Color(activeBGHex[activeIdx]);

    // Camera
    camX += (mx*0.5 - camX)*0.04; camY += (-my*0.3 - camY)*0.04;
    camera.position.set(camX, camY, 5.5);
    camera.lookAt(0, 0, 0);

    if (phaseLabel) phaseLabel.textContent = PRODUCTS[activeIdx].name;

    renderer.render(scene, camera);
  }

  // Sync active label with scroll on load
  const PRODUCTS_NAMES = PRODUCTS.map(p=>p.name);
  if (phaseLabel) phaseLabel.textContent = PRODUCTS_NAMES[0];

  animate();
})();
