/* ═══════════════════════════════════════════════
   SERVICES PAGE — TorusKnotGeometry "Endless Chain"
   Phases: teal wireframe → glowing solid → pulsing service
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
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 0, 5.5);

  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  const ambient = new THREE.AmbientLight(0x0a1510, 3);
  scene.add(ambient);
  const tealKey = new THREE.PointLight(0x44ccaa, 4, 14);
  tealKey.position.set(-3, 2, 3);
  scene.add(tealKey);
  const orangeKey = new THREE.PointLight(0xF57C00, 0, 14);
  orangeKey.position.set(2, -1, 3);
  scene.add(orangeKey);

  // Torus knot: 2 winds, 3 coils — represents endless service loop
  const knotGeo = new THREE.TorusKnotGeometry(1.1, 0.3, 120, 16, 2, 3);
  const knotEdges = new THREE.EdgesGeometry(knotGeo);

  const wireMat = new THREE.LineBasicMaterial({ color: 0x44ccaa, transparent: true, opacity: 0.85 });
  const wireMesh = new THREE.LineSegments(knotEdges, wireMat);
  scene.add(wireMesh);

  const solidMat = new THREE.MeshStandardMaterial({
    color: 0x0e1a18, roughness: 0.65, metalness: 0.35,
    emissive: new THREE.Color(0x44ccaa), emissiveIntensity: 0,
    transparent: true, opacity: 0
  });
  const solidMesh = new THREE.Mesh(knotGeo, solidMat);
  scene.add(solidMesh);

  // Particles: scattered in service-loop style
  const PC = 300;
  const pPos = new Float32Array(PC*3), pPhi = new Float32Array(PC);
  for (let i = 0; i < PC; i++) {
    const th = Math.random()*Math.PI*2, ph = Math.random()*Math.PI*2;
    const r = 2.5 + Math.random()*2;
    pPos[i*3]   = Math.sin(ph)*Math.cos(th)*r;
    pPos[i*3+1] = Math.cos(ph)*r*0.7;
    pPos[i*3+2] = Math.sin(ph)*Math.sin(th)*r;
    pPhi[i] = Math.random()*Math.PI*2;
  }
  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute('position', new THREE.BufferAttribute(pPos.slice(), 3));
  const partMat = new THREE.PointsMaterial({ color: 0x44ccaa, size: 0.02, transparent: true, opacity: 0.4, sizeAttenuation: true });
  scene.add(new THREE.Points(partGeo, partMat));

  const BG1 = new THREE.Color(0x040807), BG2 = new THREE.Color(0x060a09), BG3 = new THREE.Color(0x080800);
  let scroll = 0, mx = 0, my = 0, camX = 0, camY = 0, clock = 0;

  window.addEventListener('scroll', () => {
    scroll = window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  }, { passive: true });
  document.addEventListener('mousemove', e => { mx=(e.clientX/innerWidth-.5)*2; my=(e.clientY/innerHeight-.5)*2; });

  const lerp = (a,b,t)=>a+(b-a)*t;
  const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const smooth = t=>t*t*(3-2*t);
  const phase = (p,s,e)=>smooth(clamp((p-s)/(e-s),0,1));

  const phaseLabel = document.getElementById('phaseLabel');
  const PHASES = ['TEAL · WIRE', 'SOLID · CHAIN', 'ORANGE · PULSE'];

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.007;

    const toSolid = phase(scroll, 0.2, 0.42);
    const toOrange = phase(scroll, 0.58, 0.82);

    // Rotation — knot tumbles slowly
    wireMesh.rotation.y  += 0.004;
    wireMesh.rotation.x  += 0.0025;
    solidMesh.rotation.copy(wireMesh.rotation);

    wireMat.opacity  = lerp(0.85, 0, toSolid);
    solidMat.opacity = lerp(0, 1, toSolid);

    // Colour interpolation: teal → warm orange on solidToOrange
    const emColour = new THREE.Color().lerpColors(new THREE.Color(0x44ccaa), new THREE.Color(0xF57C00), toOrange);
    solidMat.emissive.copy(emColour);
    solidMat.emissiveIntensity = lerp(0, 0.4, toSolid) + lerp(0, 1.2, toOrange);
    solidMat.color.lerpColors(new THREE.Color(0x0e1a18), new THREE.Color(0x1a0e00), toOrange);

    tealKey.intensity  = lerp(4, 0, toOrange);
    orangeKey.intensity = lerp(0, 8, toOrange);
    orangeKey.position.x = Math.sin(clock*0.5)*2.5;

    // Knot pulses slightly in orange phase
    const pulse = 1 + Math.sin(clock*3)*0.04*toOrange;
    wireMesh.scale.setScalar(pulse);
    solidMesh.scale.setScalar(pulse);

    const pos = partGeo.attributes.position.array;
    const orig = pPos;
    for (let i=0; i<PC; i++) {
      pos[i*3]   = orig[i*3]   + Math.sin(clock*0.6 + pPhi[i])*0.1;
      pos[i*3+1] = orig[i*3+1] + Math.cos(clock*0.4 + pPhi[i]*1.2)*0.08;
      pos[i*3+2] = orig[i*3+2] + Math.sin(clock*0.5 + pPhi[i]*0.9)*0.09;
    }
    partGeo.attributes.position.needsUpdate = true;
    partMat.color.lerpColors(new THREE.Color(0x44ccaa), new THREE.Color(0xF57C00), toOrange);

    scene.background = new THREE.Color().lerpColors(BG1, BG2, toSolid).lerp(BG3, toOrange);

    camX += (mx*0.4-camX)*0.04; camY += (-my*0.28-camY)*0.04;
    camera.position.set(camX, camY, 5.5);
    camera.lookAt(0,0,0);

    if (phaseLabel) phaseLabel.textContent = PHASES[toOrange>0.5?2:toSolid>0.5?1:0];

    renderer.render(scene, camera);
  }
  animate();
})();
