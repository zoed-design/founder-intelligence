// The site crew: a low-poly Australian animal in a hard hat and hi-vis for every
// agent, in the same art style as SFIA Agent Studio's menagerie.
//   portrait(id, size) → cached dataURL still
//   mascot(container)  → Digger, live on a building site: say(text), dance(), setSound(on)
// Falls back quietly (no portraits, text-only mascot) if WebGL is unavailable.

export const CREW = {
  router:     { name: 'Digger', species: 'wombat',     role: 'Site Manager', plan: 'quad', o: { base: 0x7d6a58, belly: 0xb3a28c, ears: 'stub', muzzle: 'broad', stocky: 1.25 }, hat: 0xf4f4ef, vest: 0xff7a1a },
  capture:    { name: 'Lyra',   species: 'lyrebird',   role: 'Collect & organize', plan: 'bird', o: { base: 0x6b5d52, belly: 0x9c8a76, beak: 0.3, tail: 'lyre' }, hat: 0xf2c14e, vest: 0xc6ef2a },
  curator:    { name: 'Bower',  species: 'bowerbird',  role: 'Find, reference & allocate tasks', plan: 'bird', o: { base: 0x3d55a8, belly: 0x5f79cc, beak: 0.32, tail: 'flat', blueBits: 1 }, hat: 0xf2c14e, vest: 0xff7a1a },
  teamwork:   { name: 'Roo',    species: 'kangaroo',   role: 'Employee Coach', plan: 'roo', o: { base: 0xa97f52, belly: 0xdec09a, tape: 1 }, hat: 0xf2c14e, vest: 0xff7a1a },
  commercial: { name: 'Tally', species: 'mum', role: 'Client', plan: 'human', o: { base: 0xe3b08f, belly: 0xf3ccb1 }, hat: null, vest: null },
  content:    { name: 'Kooka',  species: 'kookaburra', role: 'Brand Stories', plan: 'bird', o: { base: 0x8a7a68, belly: 0xe8dcc8, beak: 0.5, headBig: 1, tail: 'flat', camera: 1 }, hat: 0xf2c14e, vest: 0xff7a1a },
};

const T = () => window.THREE;
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function build(id) {
  const THREE = T();
  const c = CREW[id];
  const { o } = c;
  const mat = (col, extra = {}) => new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: 0.85, ...extra });
  const DK = new THREE.MeshStandardMaterial({ color: 0x17100c, roughness: 0.3 });
  const base = mat(o.base); const belly = mat(o.belly); const dark = mat(0x5a4636);
  const hatM = mat(c.hat, { roughness: 0.45 }); const vestM = mat(c.vest, { roughness: 0.6 });
  const stripeM = new THREE.MeshStandardMaterial({ color: 0xeef3f6, roughness: 0.25, metalness: 0.35, emissive: 0x333333 });
  const g = new THREE.Group();
  const parts = { g, wings: [], name: c.name };
  const add = (parent, geo, m, x, y, z, s) => { const ob = new THREE.Mesh(geo, m); ob.position.set(x, y, z); if (s) ob.scale.set(...s); parent.add(ob); return ob; };

  // hi-vis vest: a band around the torso, with a reflective stripe
  const vest = (y, z, sc, rot = 0) => {
    const band = add(g, new THREE.SphereGeometry(0.53, 12, 8, 0, Math.PI * 2, 0.95, 1.15), vestM, 0, y, z, sc);
    band.rotation.x = rot;
    const st = add(g, new THREE.SphereGeometry(0.545, 12, 8, 0, Math.PI * 2, 1.42, 0.14), stripeM, 0, y, z, sc);
    st.rotation.x = rot;
  };
  // hard hat: dome, brim and a ridge
  const hat = (head, r, y) => {
    const h = new THREE.Group(); h.position.set(0, y, 0); head.add(h);
    add(h, new THREE.SphereGeometry(r, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), hatM, 0, 0, 0, [1.06, 0.82, 1.1]);
    add(h, new THREE.CylinderGeometry(r * 1.2, r * 1.2, 0.045, 16), hatM, 0, 0.01, 0.05, [1, 1, 1.18]);
    add(h, new THREE.BoxGeometry(r * 0.16, r * 0.2, r * 1.9), hatM, 0, r * 0.74, 0);
    parts.hat = h;
  };

  if (c.plan === 'human') {
    const hair=mat(0x473029),top=mat(0xc77d63),trousers=mat(0x55637e);
    add(g,new THREE.SphereGeometry(0.4,8,6),top,0,1.0,0,[1,1.35,0.68]);
    [-0.18,0.18].forEach(x=>{add(g,new THREE.CylinderGeometry(0.12,0.11,0.62,7),trousers,x,0.35,0);add(g,new THREE.SphereGeometry(0.13,7,5),mat(0xf6e8d7),x,0.06,0.09,[1,0.5,1.5]);});
    parts.wings=[-0.44,0.44].map(x=>{const arm=add(g,new THREE.CylinderGeometry(0.085,0.075,0.65,7),top,x,1,0);add(g,new THREE.SphereGeometry(0.09,7,5),base,x,0.65,0);return arm;});
    const head=new THREE.Group();head.position.set(0,1.8,0.05);g.add(head);parts.head=head;
    add(head,new THREE.SphereGeometry(0.39,9,7),hair,0,0.02,-0.06,[1.08,1.18,0.9]);
    add(head,new THREE.SphereGeometry(0.33,9,7),base,0,-0.015,0.09,[1,1.1,0.9]);
    [-0.32,0.32].forEach(x=>add(head,new THREE.SphereGeometry(0.12,7,5),hair,x,-0.15,-0.05,[0.8,2.5,0.85]));
    add(head,new THREE.SphereGeometry(0.26,8,5),hair,-0.08,0.25,0.02,[1.15,0.45,0.95]);
    parts.eyes=[-0.12,0.12].map(x=>add(head,new THREE.SphereGeometry(0.035,8,6),DK,x,0.02,0.36));
    add(head,new THREE.SphereGeometry(0.045,7,5),base,0,-0.055,0.38);
    const smile=add(head,new THREE.TorusGeometry(0.075,0.012,5,10,Math.PI),mat(0x934c43),0,-0.1,0.365);smile.rotation.z=Math.PI;
  } else if (c.plan === 'bird') {
    const body = add(g, new THREE.SphereGeometry(0.62, 7, 5), base, 0, 0.95, 0, [0.9, 1.15, 1]); body.rotation.x = 0.25;
    add(g, new THREE.SphereGeometry(0.4, 6, 4), belly, 0, 0.8, 0.3, [0.8, 0.95, 0.6]);
    vest(0.95, 0, [0.9, 1.15, 1], 0.25);
    parts.wings.push(add(g, new THREE.SphereGeometry(0.42, 6, 4), dark, 0.52, 1.0, -0.05, [0.35, 0.95, 0.7]));
    parts.wings.push(add(g, new THREE.SphereGeometry(0.42, 6, 4), dark, -0.52, 1.0, -0.05, [0.35, 0.95, 0.7]));
    if (o.tail === 'lyre') {
      const tm = mat(0x8a7a68);
      [-1, 1].forEach((sgn) => { const l = add(g, new THREE.TorusGeometry(0.4, 0.05, 6, 12, Math.PI), tm, sgn * 0.14, 1.25, -0.66); l.rotation.y = sgn * 0.4; });
      parts.tail = add(g, new THREE.ConeGeometry(0.06, 0.9, 4), mat(0xd8c8a8), 0, 1.3, -0.68);
    } else { parts.tail = add(g, new THREE.BoxGeometry(0.3, 0.08, 0.7), dark, 0, 0.85, -0.62); parts.tail.rotation.x = -0.5; }
    const head = new THREE.Group(); head.position.set(0, 1.75, 0.18); g.add(head); parts.head = head;
    const hs = o.headBig ? 0.44 : 0.36;
    add(head, new THREE.SphereGeometry(hs, 7, 5), base, 0, 0, 0);
    if (o.headBig) add(head, new THREE.BoxGeometry(0.5, 0.06, 0.06), mat(0x3d2f24), 0, 0.02, hs * 0.85);
    const bk = add(head, new THREE.ConeGeometry(0.14, o.beak + 0.25, 5), mat(0x5a4636), 0, -0.04, hs + (o.beak + 0.25) / 2 - 0.1); bk.rotation.x = Math.PI / 2;
    parts.jaw = bk;
    parts.eyes = [add(head, new THREE.SphereGeometry(0.075, 8, 6), DK, 0.2, 0.06, hs * 0.75), add(head, new THREE.SphereGeometry(0.075, 8, 6), DK, -0.2, 0.06, hs * 0.75)];
    hat(head, hs * 0.92, hs * 0.42);
    [-0.14, 0.14].forEach((x) => { add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.5, 5), mat(0x5a4636), x, 0.3, 0.1); add(g, new THREE.BoxGeometry(0.16, 0.04, 0.22), mat(0x5a4636), x, 0.05, 0.16); });
    if (o.camera) {
      add(g, new THREE.BoxGeometry(0.42, 0.28, 0.18), mat(0x22262c), 0, 0.92, 0.62);
      const lens = add(g, new THREE.CylinderGeometry(0.09, 0.09, 0.14, 10), mat(0x0e0f11, { roughness: 0.2, metalness: 0.4 }), 0, 0.92, 0.76); lens.rotation.x = Math.PI / 2;
    }
    if (o.blueBits) {
      [[0.55, 0.06, 0.55, 0x2a7de1], [-0.6, 0.06, 0.45, 0x5aa9ff], [0.2, 0.05, 0.8, 0x1f5fc0]].forEach(([x, y, z, col]) => add(g, new THREE.BoxGeometry(0.14, 0.1, 0.14), mat(col), x, y, z).rotation.y = x);
    }
  } else if (c.plan === 'roo') {
    add(g, new THREE.SphereGeometry(0.72, 7, 5), base, 0, 0.6, -0.3, [1.2, 0.8, 1]);
    add(g, new THREE.SphereGeometry(0.5, 7, 5), base, 0, 1.35, 0.05, [0.85, 1.3, 0.8]);
    add(g, new THREE.SphereGeometry(0.34, 6, 4), belly, 0, 1.2, 0.33, [0.75, 1.1, 0.55]);
    vest(1.38, 0.05, [0.85, 1.3, 0.8]);
    parts.tail = add(g, new THREE.CylinderGeometry(0.1, 0.22, 1.6, 6), base, 0, 0.35, -1.0); parts.tail.rotation.x = 1.15;
    [-0.42, 0.42].forEach((x) => { add(g, new THREE.SphereGeometry(0.3, 6, 4), base, x, 0.42, 0.1, [0.8, 1, 1.4]); add(g, new THREE.BoxGeometry(0.2, 0.09, 0.62), belly, x, 0.08, 0.42); });
    parts.wings = [-0.26, 0.26].map((x) => add(g, new THREE.CylinderGeometry(0.06, 0.05, 0.55, 5), base, x, 1.25, 0.38));
    if (o.tape) {
      add(g, new THREE.BoxGeometry(0.3, 0.3, 0.14), mat(0xf2c14e, { roughness: 0.4 }), 0, 1.0, 0.5);
      const d = add(g, new THREE.CylinderGeometry(0.09, 0.09, 0.02, 12), mat(0x30343a), 0, 1.0, 0.58); d.rotation.x = Math.PI / 2;
    }
    const head = new THREE.Group(); head.position.set(0, 2.2, 0.22); g.add(head); parts.head = head;
    add(head, new THREE.SphereGeometry(0.34, 7, 5), base, 0, 0, 0);
    const mz = add(head, new THREE.CylinderGeometry(0.1, 0.2, 0.5, 6), base, 0, -0.06, 0.38); mz.rotation.x = Math.PI / 2;
    add(head, new THREE.DodecahedronGeometry(0.07), DK, 0, 0, 0.62);
    parts.jaw = add(head, new THREE.BoxGeometry(0.16, 0.05, 0.26), belly, 0, -0.18, 0.4);
    [-0.17, 0.17].forEach((x) => { const e = add(head, new THREE.ConeGeometry(0.12, 0.6, 4), base, x * 1.25, 0.5, -0.08, [1, 1, 0.5]); e.rotation.z = x > 0 ? -0.35 : 0.35; });
    parts.eyes = [add(head, new THREE.SphereGeometry(0.085, 8, 6), DK, 0.16, 0.08, 0.28), add(head, new THREE.SphereGeometry(0.085, 8, 6), DK, -0.16, 0.08, 0.28)];
    hat(head, 0.32, 0.16);
  } else { // quad, sitting
    const stock = o.stocky || 1;
    add(g, new THREE.SphereGeometry(0.62, 7, 5), base, 0, 0.5, -0.4, [1.15 * stock, 0.8, 1]);
    add(g, new THREE.SphereGeometry(0.5, 7, 5), base, 0, 0.88, 0.1, [0.9 * stock, 1.1, 0.85]);
    add(g, new THREE.SphereGeometry(0.33, 6, 4), belly, 0, 0.8, 0.42, [0.75, 1, 0.55]);
    vest(0.9, 0.1, [0.9 * stock, 1.1, 0.85]);
    if (o.bands) for (let i = 0; i < 4; i += 1) add(g, new THREE.BoxGeometry(0.7, 0.05, 0.1), belly, 0, 0.68 + i * 0.1, -0.55 - i * 0.07);
    parts.wings = [-0.25, 0.25].map((x) => { const leg = add(g, new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6), base, x, 0.4, 0.38); add(g, new THREE.SphereGeometry(0.13, 6, 4), belly, x, 0.07, 0.5, [1, 0.5, 1.5]); return leg; });
    [-0.46, 0.46].forEach((x) => add(g, new THREE.SphereGeometry(0.15, 6, 4), belly, x, 0.07, 0.18, [1, 0.5, 1.6]));
    if (o.tail === 'brush') { parts.tail = add(g, new THREE.ConeGeometry(0.14, 0.8, 5), base, 0.45, 0.55, -0.75); parts.tail.rotation.z = -1.1; }
    else parts.tail = add(g, new THREE.SphereGeometry(0.12, 5, 4), base, 0, 0.55, -0.85);
    if (o.clipboard) {
      const cb = add(g, new THREE.BoxGeometry(0.4, 0.5, 0.04), mat(0x8a5a2b), 0.0, 0.75, 0.62); cb.rotation.x = -0.25;
      const pg = add(g, new THREE.BoxGeometry(0.32, 0.38, 0.02), mat(0xf6f3ea), 0.0, 0.73, 0.645); pg.rotation.x = -0.25;
    }
    const hy = 1.55;
    const head = new THREE.Group(); head.position.set(0, hy + (o.stocky ? 0.08 : 0), 0.3); g.add(head); parts.head = head;
    add(head, new THREE.SphereGeometry(0.42, 7, 5), base, 0, 0, 0, [1, 0.9, 0.95]);
    if (o.muzzle === 'needle') { const b2 = add(head, new THREE.ConeGeometry(0.09, 0.66, 5), base, 0, -0.04, 0.56); b2.rotation.x = Math.PI / 2; add(head, new THREE.DodecahedronGeometry(0.04), DK, 0, -0.02, 0.9); }
    else { add(head, new THREE.SphereGeometry(0.26, 6, 4), belly, 0, -0.12, 0.3, [1.1, 0.75, 1]); add(head, new THREE.DodecahedronGeometry(0.07), DK, 0, 0.02, 0.5); }
    parts.jaw = add(head, new THREE.BoxGeometry(0.2, 0.04, 0.16), DK, 0, -0.24, 0.36);
    parts.jaw.scale.y = 0.3;
    const eo = 0.09;
    parts.eyes = [add(head, new THREE.SphereGeometry(eo, 8, 6), DK, 0.2, 0.12, 0.3), add(head, new THREE.SphereGeometry(eo, 8, 6), DK, -0.2, 0.12, 0.3)];
    if (o.ears === 'point') [-0.24, 0.24].forEach((x) => { const e = add(head, new THREE.ConeGeometry(0.13, 0.36, 4), base, x * 1.2, 0.36, -0.04, [1, 1, 0.55]); e.rotation.z = x > 0 ? -0.6 : 0.6; });
    else [-0.3, 0.3].forEach((x) => add(head, new THREE.SphereGeometry(0.1, 5, 4), base, x, 0.3, -0.02, [1, 1, 0.5]));
    hat(head, 0.4, 0.2);
  }
  return parts;
}

function lights(scene) {
  const THREE = T();
  scene.add(new THREE.HemisphereLight(0xffe9c9, 0x2a2216, 0.95));
  const k = new THREE.DirectionalLight(0xfff2dc, 1.15); k.position.set(2.5, 4, 4); scene.add(k);
  const r = new THREE.DirectionalLight(0xffb15c, 0.5); r.position.set(-3, 2, -3); scene.add(r);
}

function frame(parts, cam, yaw, tight = 1) {
  const THREE = T();
  parts.g.rotation.y = yaw;
  const box = new THREE.Box3().setFromObject(parts.g); const c = new THREE.Vector3(); const sz = new THREE.Vector3();
  box.getCenter(c); box.getSize(sz);
  const r = Math.max(sz.x, sz.y, sz.z) * 0.62 * tight;
  const d = (r / Math.tan((cam.fov * Math.PI / 180) / 2)) * 1.12;
  cam.position.set(c.x, c.y + r * 0.35, c.z + d);
  cam.lookAt(c.x, c.y + sz.y * 0.06, c.z);
}

// ---------- Portraits ----------
let srend = null;
const cache = {};
export function portrait(id, size = 128) {
  const key = `${id}|${size}`;
  if (cache[key] !== undefined) return cache[key];
  try {
    const THREE = T();
    if (!THREE || !CREW[id]) { cache[key] = null; return null; }
    if (!srend) { srend = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); srend.setPixelRatio(1); }
    srend.setSize(size, size);
    const parts = build(id); const sc = new THREE.Scene(); lights(sc); sc.add(parts.g);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
    frame(parts, cam, 0.45, 0.92);
    parts.head.rotation.y = -0.25;
    srend.render(sc, cam);
    cache[key] = srend.domElement.toDataURL('image/png');
    sc.traverse((ob) => { if (ob.geometry) ob.geometry.dispose(); });
  } catch { cache[key] = null; }
  return cache[key];
}

// ---------- Digger, live on site ----------
export function mascot(container, bubble) {
  const THREE = T();
  const state = { talkUntil: 0, danceUntil: 0, sound: false, t: 0, raf: 0 };
  let voice = null;
  const pickVoice = () => {
    const vs = window.speechSynthesis?.getVoices?.() || [];
    voice = vs.find((v) => /en-AU/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  };
  if ('speechSynthesis' in window) { pickVoice(); window.speechSynthesis.onvoiceschanged = pickVoice; }

  let bubbleTimer;
  const api = {
    ready: false,
    say(text, { dance = false } = {}) {
      if (bubble) {
        bubble.textContent = text;
        bubble.classList.add('show');
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(() => bubble.classList.remove('show'), Math.min(2400 + text.length * 55, 9000));
      }
      state.talkUntil = performance.now() + Math.min(800 + text.length * 55, 7000);
      if (dance) api.dance();
      if (state.sound && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          if (voice) u.voice = voice;
          u.pitch = 0.72; u.rate = 1.02;
          u.onend = () => { state.talkUntil = 0; };
          window.speechSynthesis.speak(u);
        } catch { /* no voice: bubble only */ }
      }
    },
    dance() { if (!reduceMotion()) state.danceUntil = performance.now() + 2600; },
    setSound(on) { state.sound = on; if (!on && 'speechSynthesis' in window) window.speechSynthesis.cancel(); },
    reset() {
      clearTimeout(bubbleTimer); state.talkUntil = 0; state.danceUntil = 0;
      if (bubble) { bubble.textContent = ''; bubble.classList.remove('show'); }
      window.speechSynthesis?.cancel();
    },
  };
  if (!THREE) return api;

  try {
    const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rend.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const W = container.clientWidth || 320; const H = container.clientHeight || 190;
    rend.setSize(W, H, false);
    rend.domElement.className = 'mascot-canvas';
    rend.domElement.setAttribute('aria-hidden', 'true');
    container.prepend(rend.domElement);

    const sc = new THREE.Scene(); lights(sc);
    const mat = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9 });
    // the site at dusk: sky, dirt pad, cones, a sand pile and a crane
    const cv = document.createElement('canvas'); cv.width = 32; cv.height = 128;
    const cx = cv.getContext('2d'); const gr = cx.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#16213b'); gr.addColorStop(0.55, '#3a4b78'); gr.addColorStop(0.82, '#d98a3f'); gr.addColorStop(1, '#f2b45c');
    cx.fillStyle = gr; cx.fillRect(0, 0, 32, 128);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })); sky.position.set(0, 4, -9); sc.add(sky);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.3, 9), mat(0x8a6a48)); pad.position.set(0, -0.15, 0); sc.add(pad);
    const cone = (x, z) => {
      const g = new THREE.Group(); g.position.set(x, 0, z);
      const k = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 8), mat(0xff6a13)); k.position.y = 0.3; g.add(k);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.155, 0.1, 8), mat(0xf4f4ef)); b.position.y = 0.36; g.add(b);
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), mat(0xff6a13)); f.position.y = 0.02; g.add(f);
      sc.add(g);
    };
    cone(-0.3, 1.2); cone(2.6, 0.4); cone(3.0, -0.9);
    const sand = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.6, 7), mat(0xd9b37a)); sand.position.set(-2.4, 0.3, -1.2); sc.add(sand);
    const crane = new THREE.Group(); crane.position.set(3.4, 0, -4.5);
    const cm = mat(0xf2c14e);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.4, 0.22), cm); mast.position.y = 2.2; crane.add(mast);
    const jib = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 0.16), cm); jib.position.set(-1.1, 4.3, 0); crane.add(jib);
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.2, 0.03), mat(0x30343a)); line.position.set(-2.5, 3.7, 0); crane.add(line);
    sc.add(crane);

    const parts = build('router');
    sc.add(parts.g);
    const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 60);
    cam.position.set(-0.2, 1.8, 8.2); cam.lookAt(-0.2, 1.25, 0);
    parts.g.position.x = 1.05;
    parts.g.rotation.y = -0.3;

    const loop = () => {
      state.raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const now = performance.now();
      const dt = reduceMotion() ? 0 : 0.016;
      state.t += dt;
      const t = state.t;
      const talking = now < state.talkUntil;
      const dancing = now < state.danceUntil;
      const p = parts;
      if (dancing) {
        const k = t * 9;
        p.g.position.y = Math.abs(Math.sin(k)) * 0.32;
        p.g.rotation.y = -0.3 + Math.sin(t * 4.5) * 0.7;
        p.g.rotation.z = Math.sin(k) * 0.12;
        p.head.rotation.z = Math.sin(k) * 0.25;
        p.hat.rotation.z = Math.sin(k + 1) * 0.25;
        p.wings.forEach((w, i) => { w.rotation.x = Math.sin(k + i * Math.PI) * 0.7; });
        crane.rotation.y = Math.sin(t * 2) * 0.2;
      } else {
        p.g.position.y = Math.sin(t * (talking ? 5.2 : 1.8)) * (talking ? 0.07 : 0.055);
        p.g.rotation.z = Math.sin(t * 1.2) * 0.025;
        p.g.rotation.y += (-0.3 + Math.sin(t * 0.7) * 0.12 - p.g.rotation.y) * 0.08;
        p.head.rotation.y = Math.sin(t * (talking ? 2.2 : 0.9)) * 0.24;
        p.head.rotation.x = talking ? 0.04 + Math.sin(t * 11) * 0.085 : Math.sin(t * 1.3) * 0.04;
        p.head.rotation.z = 0;
        p.hat.rotation.z *= 0.9;
        p.wings.forEach((w,i) => { w.rotation.x = Math.sin(t * 2.2 + i * Math.PI) * 0.09; });
      }
      if (p.jaw) p.jaw.scale.y = talking ? 0.3 + Math.abs(Math.sin(t * 16)) * 1.6 : 0.3;
      if (p.tail) p.tail.rotation.y = Math.sin(t * (talking || dancing ? 13 : 6)) * 0.35;
      if (p.eyes) { const bl = (t % 3.4) > 3.27 ? 0.1 : 1; p.eyes.forEach((e) => { e.scale.y = bl; }); }
      rend.render(sc, cam);
    };
    loop();
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth; const h = container.clientHeight;
      if (!w || !h) return;
      rend.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    });
    ro.observe(container);
    api.ready = true;
  } catch { /* WebGL unavailable: bubble-only mascot */ }
  return api;
}
