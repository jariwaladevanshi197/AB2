/* ═══════════════════════════════════════════════
   ORIGINS PAGE — SphereGeometry globe
   Country dots + animated connection lines to India
═══════════════════════════════════════════════ */
(function () {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030506);
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 0.3, 5.5);

  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  scene.add(new THREE.AmbientLight(0x080e18, 3));
  const starLight = new THREE.PointLight(0x4466aa, 3, 20);
  starLight.position.set(-4, 3, 4);
  scene.add(starLight);
  const indiaGlow = new THREE.PointLight(0xFFB300, 0, 8);
  scene.add(indiaGlow);

  // ── Globe (wireframe sphere)
  const globeR = 1.4;
  const globeGeo = new THREE.SphereGeometry(globeR, 28, 18);
  const globeWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(globeGeo),
    new THREE.LineBasicMaterial({ color: 0x1a3355, transparent: true, opacity: 0.3 })
  );
  scene.add(globeWire);

  // lat/lng → 3D point on sphere surface
  function ll2v(lat, lng, r) {
    const phi   = (90 - lat)  * Math.PI / 180;
    const theta = (lng + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  const GLOBE_R = globeR + 0.05;

  const SOURCES = [
    { name: 'INDONESIA',    lat:   0, lng: 113, col: 0xF57C00 },
    { name: 'SOUTH AFRICA', lat: -30, lng:  25, col: 0xFFB300 },
    { name: 'KENYA',        lat:   1, lng:  37, col: 0xF57C00 },
    { name: 'ZIMBABWE',     lat: -20, lng:  30, col: 0xFFAA00 }
  ];
  const INDIA = { lat: 23, lng: 80 };
  const indiaPos = ll2v(INDIA.lat, INDIA.lng, GLOBE_R);

  // India marker (larger, gold)
  const indiaDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xFFB300 })
  );
  indiaDot.position.copy(indiaPos);
  scene.add(indiaDot);
  indiaGlow.position.copy(indiaPos);

  // Source markers + connection lines
  const connections = SOURCES.map(s => {
    const srcPos = ll2v(s.lat, s.lng, GLOBE_R);

    // Dot
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshBasicMaterial({ color: s.col })
    );
    dot.position.copy(srcPos);
    scene.add(dot);

    // Arc line (bezier via midpoint pulled outward)
    const mid = new THREE.Vector3().addVectors(srcPos, indiaPos).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(GLOBE_R * 1.6);
    const curve = new THREE.QuadraticBezierCurve3(srcPos, mid, indiaPos);
    const pts = curve.getPoints(40);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineBasicMaterial({ color: s.col, transparent: true, opacity: 0 });
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);

    return { lineMat, dot, srcPos };
  });

  // Stars background
  const starPts = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) {
    starPts[i*3]   = (Math.random()-0.5)*60;
    starPts[i*3+1] = (Math.random()-0.5)*60;
    starPts[i*3+2] = (Math.random()-0.5)*60;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPts, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaabbcc, size: 0.05, transparent: true, opacity: 0.5 })));

  let scroll = 0, mx = 0, my = 0, clock = 0;
  window.addEventListener('scroll', () => {
    scroll = window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  }, { passive: true });
  document.addEventListener('mousemove', e => { mx=(e.clientX/innerWidth-.5)*2; my=(e.clientY/innerHeight-.5)*2; });

  const lerp = (a,b,t)=>a+(b-a)*t;
  const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const smooth = t=>t*t*(3-2*t);
  const phase = (p,s,e)=>smooth(clamp((p-s)/(e-s),0,1));

  const phaseLabel = document.getElementById('phaseLabel');

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.006;

    // Globe slow rotation
    globeWire.rotation.y += 0.003;
    indiaDot.rotation.copy(globeWire.rotation);
    connections.forEach(c => {
      c.dot.rotation.copy(globeWire.rotation);
    });

    // Each source appears sequentially as scroll progresses
    // 0-0.2: globe alone, 0.2-1.0: each connection appears at 0.2 increments
    connections.forEach((c, i) => {
      const start = 0.15 + i * 0.18;
      const opacity = smooth(clamp((scroll - start) / 0.12, 0, 1));
      c.lineMat.opacity = opacity * 0.85;
    });

    // India glow ramps up
    indiaGlow.intensity = lerp(0, 5, smooth(clamp((scroll - 0.1) / 0.15, 0, 1)));

    // Globe wireframe warms
    const globeWarmth = smooth(clamp((scroll - 0.1) / 0.4, 0, 1));
    globeWire.material.color.lerpColors(new THREE.Color(0x1a3355), new THREE.Color(0x2244aa), globeWarmth);
    globeWire.material.opacity = lerp(0.3, 0.5, globeWarmth);
    starLight.intensity = lerp(3, 1, globeWarmth);

    scene.background = new THREE.Color().lerpColors(new THREE.Color(0x030506), new THREE.Color(0x050810), globeWarmth);

    // Gentle camera drift + mouse parallax
    const autoX = Math.sin(clock*0.3)*0.4 + mx*0.3;
    const autoY = Math.cos(clock*0.2)*0.2 + (-my*0.2);
    camera.position.x += (autoX - camera.position.x)*0.03;
    camera.position.y += (autoY - camera.position.y)*0.03;
    camera.lookAt(0,0.3,0);

    if (phaseLabel) {
      const connected = connections.filter(c => c.lineMat.opacity > 0.1).length;
      phaseLabel.textContent = connected === 0 ? 'GLOBE · SCAN' : `${connected} SOURCE${connected>1?'S':''} · ACTIVE`;
    }

    renderer.render(scene, camera);
  }
  animate();
})();
