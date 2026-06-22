/* ═══════════════════════════════════════════════
   ABOUT PAGE — DodecahedronGeometry "The Gem"
   Phases: wireframe → solid mineral → inner glow
═══════════════════════════════════════════════ */
(function () {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 0, 5.5);

  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  // Lights
  const ambient = new THREE.AmbientLight(0x0a0f1a, 3);
  scene.add(ambient);
  const blueKey = new THREE.PointLight(0x4466cc, 5, 14);
  blueKey.position.set(-3, 3, 3);
  scene.add(blueKey);
  const innerGlow = new THREE.PointLight(0x2244ff, 0, 10);
  scene.add(innerGlow);

  // Dodecahedron geometry (12 pentagonal faces — rare gem look)
  const dodGeo = new THREE.DodecahedronGeometry(1.25, 0);

  // Wireframe
  const edges = new THREE.EdgesGeometry(dodGeo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x6688bb, transparent: true, opacity: 1 });
  const wireMesh = new THREE.LineSegments(edges, wireMat);
  scene.add(wireMesh);

  // Outer orbiting rings
  const ring1 = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.TorusGeometry(2.4, 0.006, 4, 80)),
    new THREE.LineBasicMaterial({ color: 0x223355, transparent: true, opacity: 0.4 })
  );
  ring1.rotation.x = Math.PI / 3;
  scene.add(ring1);

  const ring2 = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.TorusGeometry(1.9, 0.005, 4, 80)),
    new THREE.LineBasicMaterial({ color: 0x1a2a44, transparent: true, opacity: 0.3 })
  );
  ring2.rotation.x = -Math.PI / 5;
  ring2.rotation.y = Math.PI / 4;
  scene.add(ring2);

  // Solid mineral mesh
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0x100e1a,
    roughness: 0.8,
    metalness: 0.3,
    emissive: new THREE.Color(0x2244cc),
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0
  });
  const solidMesh = new THREE.Mesh(dodGeo, solidMat);
  scene.add(solidMesh);

  // Floating particles
  const PC = 380;
  const pPos = new Float32Array(PC * 3), pOrig = new Float32Array(PC * 3), pPhi = new Float32Array(PC);
  const PHI = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < PC; i++) {
    const y = 1 - (i / (PC - 1)) * 2, r = Math.sqrt(1 - y * y);
    const th = PHI * i, rad = 2.6 + Math.random() * 2;
    pOrig[i*3] = pPos[i*3] = Math.cos(th) * r * rad;
    pOrig[i*3+1] = pPos[i*3+1] = y * rad;
    pOrig[i*3+2] = pPos[i*3+2] = Math.sin(th) * r * rad;
    pPhi[i] = Math.random() * Math.PI * 2;
  }
  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const partMat = new THREE.PointsMaterial({ color: 0x6688bb, size: 0.02, transparent: true, opacity: 0.45, sizeAttenuation: true });
  scene.add(new THREE.Points(partGeo, partMat));

  const BG1 = new THREE.Color(0x050508), BG2 = new THREE.Color(0x080812), BG3 = new THREE.Color(0x050a18);
  let scroll = 0, mx = 0, my = 0, camX = 0, camY = 0, clock = 0;

  window.addEventListener('scroll', () => {
    scroll = window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  }, { passive: true });
  document.addEventListener('mousemove', e => { mx = (e.clientX/innerWidth - 0.5)*2; my = (e.clientY/innerHeight - 0.5)*2; });

  const lerp = (a, b, t) => a + (b-a)*t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smooth = t => t*t*(3-2*t);
  const phase = (p, s, e) => smooth(clamp((p-s)/(e-s), 0, 1));

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.008;

    const toSolid = phase(scroll, 0.25, 0.45);
    const toGlow  = phase(scroll, 0.60, 0.82);

    const spd = lerp(0.003, 0.006, toGlow);
    wireMesh.rotation.y += spd; wireMesh.rotation.x += spd * 0.42;
    ring1.rotation.z += 0.002; ring2.rotation.z -= 0.0015;
    solidMesh.rotation.copy(wireMesh.rotation);

    wireMat.opacity = lerp(1, 0, toSolid);
    solidMat.opacity = lerp(0, 1, toSolid) * lerp(1, 1, toGlow);
    solidMat.emissiveIntensity = lerp(0, 0.5, toSolid) + lerp(0, 2.2, toGlow);

    const s = lerp(1, lerp(1, 1.15, toGlow), 1);
    wireMesh.scale.setScalar(s); solidMesh.scale.setScalar(s);

    innerGlow.intensity = lerp(0, 12, toGlow);
    innerGlow.color.lerpColors(new THREE.Color(0x2244ff), new THREE.Color(0x88aaff), toGlow);
    blueKey.intensity = lerp(5, 2, toSolid);

    const pos = partGeo.attributes.position.array;
    for (let i = 0; i < PC; i++) {
      pos[i*3]   = pOrig[i*3]   + Math.sin(clock*0.7 + pPhi[i]) * 0.12;
      pos[i*3+1] = pOrig[i*3+1] + Math.cos(clock*0.5 + pPhi[i]*1.3) * 0.09;
      pos[i*3+2] = pOrig[i*3+2] + Math.sin(clock*0.6 + pPhi[i]*0.8) * 0.1;
    }
    partGeo.attributes.position.needsUpdate = true;
    partMat.color.lerpColors(new THREE.Color(0x6688bb), new THREE.Color(0x8899ff), toGlow);
    partMat.opacity = lerp(0.45, 0.7, toGlow);

    scene.background = new THREE.Color().lerpColors(BG1, BG2, toSolid).lerp(BG3, toGlow);
    camX += (mx*0.4 - camX)*0.04; camY += (-my*0.28 - camY)*0.04;
    camera.position.set(camX, camY, 5.5);
    camera.lookAt(0, 0, 0);

    const pl = document.getElementById('phaseLabel');
    if (pl) pl.textContent = toGlow>0.5 ? 'INNER · LIGHT' : toSolid>0.5 ? 'MINERAL · SOLID' : 'GEM · WIRE';

    renderer.render(scene, camera);
  }
  animate();
})();
