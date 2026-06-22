/* ═══════════════════════════════════════════════
   CONTACT PAGE — Concentric pulse rings
   Signal/transmission aesthetic
═══════════════════════════════════════════════ */
(function () {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050503);
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 0, 5.5);

  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  scene.add(new THREE.AmbientLight(0x111108, 2));
  const centerLight = new THREE.PointLight(0xF57C00, 3, 10);
  scene.add(centerLight);

  // ── Concentric rings (face the camera)
  const RING_RADII = [1.1, 1.8, 2.6, 3.5, 4.5];
  const rings = RING_RADII.map((r, i) => {
    const geo = new THREE.TorusGeometry(r, 0.008, 6, 128);
    const mat = new THREE.LineBasicMaterial({
      color: 0xF57C00,
      transparent: true,
      opacity: 0.06 + (5-i)*0.03
    });
    const mesh = new THREE.Line(new THREE.EdgesGeometry(geo), mat);
    scene.add(mesh);
    return { mesh, mat, r, phase: i * 0.72 };
  });

  // ── Small crystal at centre
  const cGeo = new THREE.IcosahedronGeometry(0.38, 0);
  const cWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(cGeo),
    new THREE.LineBasicMaterial({ color: 0xF57C00, transparent: true, opacity: 0.7 })
  );
  scene.add(cWire);

  const cSolid = new THREE.Mesh(
    cGeo,
    new THREE.MeshStandardMaterial({ color: 0x1a0800, emissive: new THREE.Color(0xF57C00), emissiveIntensity: 1.2, roughness: 0.8, metalness: 0.2 })
  );
  scene.add(cSolid);

  // ── Outer star dust
  const starPts = new Float32Array(400*3);
  for (let i=0; i<400; i++) {
    starPts[i*3]   = (Math.random()-.5)*30;
    starPts[i*3+1] = (Math.random()-.5)*30;
    starPts[i*3+2] = (Math.random()-.5)*30;
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(starPts, 3));
  scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0x886644, size: 0.04, transparent: true, opacity: 0.35 })));

  let scroll = 0, mx = 0, my = 0, camX = 0, camY = 0, clock = 0;
  window.addEventListener('scroll', () => {
    scroll = window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  }, { passive: true });
  document.addEventListener('mousemove', e => { mx=(e.clientX/innerWidth-.5)*2; my=(e.clientY/innerHeight-.5)*2; });

  const lerp = (a,b,t)=>a+(b-a)*t;

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.012;

    // Rings pulse outward with staggered phase
    rings.forEach((ring, i) => {
      const pulse = Math.sin(clock*1.4 + ring.phase) * 0.5 + 0.5; // 0..1
      ring.mesh.scale.setScalar(1 + pulse * 0.06);
      ring.mat.opacity = (0.06 + (5-i)*0.03) * (0.6 + pulse * 0.4);

      // On scroll, rings spread wider and brighten
      ring.mat.opacity = lerp(ring.mat.opacity, ring.mat.opacity * (1 + scroll * 0.8), 0.05);
    });

    // Crystal spins
    cWire.rotation.y += 0.005;
    cWire.rotation.x += 0.003;
    cSolid.rotation.copy(cWire.rotation);

    // Pulse the centre glow
    const gPulse = Math.sin(clock * 2) * 0.5 + 0.5;
    centerLight.intensity = 3 + gPulse * 2;
    cSolid.material.emissiveIntensity = 1.0 + gPulse * 0.6;

    // Subtle transmission rings expand outward on scroll
    const expandScale = 1 + scroll * 0.3;
    rings.forEach((r, i) => {
      const s = expandScale + i * 0.04;
      r.mesh.scale.setScalar(s + Math.sin(clock*1.4 + r.phase)*0.04);
    });

    camX += (mx*0.3 - camX)*0.04;
    camY += (-my*0.2 - camY)*0.04;
    camera.position.set(camX, camY, 5.5);
    camera.lookAt(0,0,0);

    const pl = document.getElementById('phaseLabel');
    if (pl) pl.textContent = 'TRANSMIT · SIGNAL';

    renderer.render(scene, camera);
  }
  animate();
})();
