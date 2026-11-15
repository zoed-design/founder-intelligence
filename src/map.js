// Animated agent map. Plays trace steps: lights the acting agent and sends a
// pulse along the edge to the next one. The trace list beside it is the text
// equivalent for screen readers.

export const NODES = {
  source:     { x: 230, y: 30, w: 150, h: 40, label: 'New message', kind: 'io' },
  router:     { x: 110, y: 115, w: 190, h: 64, label: 'Digger', role: 'Site Manager', kind: 'agent' },
  capture:    { x: 350, y: 115, w: 205, h: 64, label: 'Lyra', role: 'Collect & organize', kind: 'agent' },
  curator:    { x: 110, y: 270, w: 200, h: 82, label: 'Bower', role: 'Find & reference', role2: 'Allocate tasks', kind: 'agent' },
  kb:         { x: 350, y: 270, w: 160, h: 64, label: 'Wiki', kind: 'store' },
  teamwork:   { x: 75, y: 440, w: 140, h: 82, label: 'Roo', role: 'Employee', role2: 'Coach', kind: 'agent' },
  commercial: { x: 230, y: 440, w: 140, h: 64, label: 'Tally', role: 'Client', kind: 'agent' },
  content:    { x: 385, y: 440, w: 140, h: 82, label: 'Kooka', role: 'Client', role2: 'Stories', kind: 'agent' },
};

export const EDGES = [
  { from: 'source', to: 'router' },
  { from: 'source', to: 'capture' },
  { from: 'router', to: 'capture', both: true },
  { from: 'capture', to: 'kb' },
  { from: 'router', to: 'curator', both: true },
  { from: 'curator', to: 'kb', both: true },
  { from: 'curator', to: 'teamwork', both: true },
  { from: 'curator', to: 'commercial', both: true },
  { from: 'curator', to: 'content', both: true },
];

const aliases = { gate: 'curator', delivered: 'curator', founder: 'router' };
const SVGNS = 'http://www.w3.org/2000/svg';
let mapSequence = 0;

function anchor(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const scale = Math.min(dx ? (a.w / 2 + 5) / Math.abs(dx) : Infinity, dy ? (a.h / 2 + 5) / Math.abs(dy) : Infinity);
  return { x: a.x + dx * scale, y: a.y + dy * scale };
}

export function createMap(svg, counts = {}, portraits = {}) {
  svg.setAttribute('viewBox', '0 0 460 490');
  svg.innerHTML = '';
  const markerId = `crew-arrow-${++mapSequence}`;
  const defs = document.createElementNS(SVGNS, 'defs');
  const marker = document.createElementNS(SVGNS, 'marker');
  Object.entries({ id: markerId, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }).forEach(([k,v]) => marker.setAttribute(k, v));
  const arrow = document.createElementNS(SVGNS, 'path');
  arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
  arrow.setAttribute('class', 'flow-arrow');
  marker.append(arrow); defs.append(marker); svg.append(defs);
  const edgeLayer = document.createElementNS(SVGNS, 'g');
  const nodeLayer = document.createElementNS(SVGNS, 'g');
  const pulseLayer = document.createElementNS(SVGNS, 'g');
  svg.append(edgeLayer, nodeLayer, pulseLayer);

  const edgeEls = {};
  EDGES.forEach(({from: a, to: b, both}) => {
    const start = anchor(NODES[a], NODES[b]), end = anchor(NODES[b], NODES[a]);
    const l = document.createElementNS(SVGNS, 'line');
    l.setAttribute('x1', start.x); l.setAttribute('y1', start.y);
    l.setAttribute('x2', end.x); l.setAttribute('y2', end.y);
    l.setAttribute('class', 'edge');
    l.setAttribute('data-from', a); l.setAttribute('data-to', b);
    l.setAttribute('marker-end', `url(#${markerId})`);
    if (both) l.setAttribute('marker-start', `url(#${markerId})`);
    edgeLayer.append(l);
    edgeEls[`${a}>${b}`] = l;
    if (both) edgeEls[`${b}>${a}`] = l;
  });

  const nodeEls = {};
  Object.entries(NODES).forEach(([id, n]) => {
    const W = n.w, H = n.h;
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', `node node-${n.kind}`);
    g.setAttribute('data-node', id);
    g.setAttribute('transform', `translate(${n.x - W / 2}, ${n.y - H / 2})`);
    const r = document.createElementNS(SVGNS, 'rect');
    r.setAttribute('width', W); r.setAttribute('height', H); r.setAttribute('rx', n.kind === 'io' ? 23 : n.kind === 'agent' ? 23 : 10);
    g.append(r);
    const pic = portraits[id];
    if (n.kind === 'agent') {
      const clipId = `${markerId}-clip-${id}`;
      const cp = document.createElementNS(SVGNS, 'clipPath'); cp.id = clipId;
      const cy = H / 2;
      const cc = document.createElementNS(SVGNS, 'circle'); cc.setAttribute('cx', 28); cc.setAttribute('cy', cy); cc.setAttribute('r', 21);
      cp.append(cc); g.append(cp);
      const ring = document.createElementNS(SVGNS, 'circle'); ring.setAttribute('cx', 28); ring.setAttribute('cy', cy); ring.setAttribute('r', 21); ring.setAttribute('class', 'ring');
      g.append(ring);
      if (pic) {
        const im = document.createElementNS(SVGNS, 'image');
        im.setAttribute('href', pic); im.setAttribute('x', 5); im.setAttribute('y', cy - 23); im.setAttribute('width', 46); im.setAttribute('height', 46);
        im.setAttribute('clip-path', `url(#${clipId})`);
        g.append(im);
      } else {
        const ini = document.createElementNS(SVGNS, 'text'); ini.setAttribute('x', 28); ini.setAttribute('y', cy + 5); ini.setAttribute('text-anchor', 'middle'); ini.textContent = n.label[0];
        g.append(ini);
      }
      const t1 = document.createElementNS(SVGNS, 'text'); t1.setAttribute('x', 58); t1.setAttribute('y', 25); t1.setAttribute('class', 'nm'); t1.textContent = n.label;
      const t2 = document.createElementNS(SVGNS, 'text'); t2.setAttribute('x', 58); t2.setAttribute('y', 42); t2.setAttribute('class', 'rl'); t2.textContent = n.role;
      g.append(t1, t2);
      if (n.role2) {
        const t3 = document.createElementNS(SVGNS, 'text'); t3.setAttribute('x', 58); t3.setAttribute('y', 59); t3.setAttribute('class', 'rl'); t3.textContent = n.role2; g.append(t3);
      }
    } else {
      const t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', W / 2); t.setAttribute('y', n.role ? 22 : H / 2 + 5); t.setAttribute('text-anchor', 'middle');
      t.textContent = n.label;
      g.append(t);
      if (n.role) {
        const sub = document.createElementNS(SVGNS, 'text');
        sub.setAttribute('x', W / 2); sub.setAttribute('y', 40); sub.setAttribute('text-anchor', 'middle'); sub.setAttribute('class', 'rl'); sub.textContent = n.role; g.append(sub);
      }
    }
    const badge = document.createElementNS(SVGNS, 'g');
    badge.setAttribute('class', 'count');
    badge.setAttribute('transform', `translate(${W - 4}, -4)`);
    const bc = document.createElementNS(SVGNS, 'circle'); bc.setAttribute('r', 11);
    const bt = document.createElementNS(SVGNS, 'text'); bt.setAttribute('y', 4); bt.setAttribute('text-anchor', 'middle');
    badge.append(bc, bt);
    g.append(badge);
    nodeLayer.append(g);
    nodeEls[id] = { g, bt, badge };
  });

  const state = { counts: { ...counts } };
  const seen = new Set();
  const setCount = (id) => {
    const el = nodeEls[id];
    if (!el) return;
    const n = state.counts[id] || 0;
    el.bt.textContent = n > 99 ? '99+' : String(n);
    el.badge.style.display = n ? '' : 'none';
  };
  Object.keys(NODES).forEach(setCount);

  function flash(id) {
    id = aliases[id] || id;
    const el = nodeEls[id];
    if (!el) return;
    el.g.classList.remove('active');
    void el.g.getBBox();
    el.g.classList.add('active');
    setTimeout(() => el.g.classList.remove('active'), 700);
  }

  function pulse(a, b, kind) {
    a = aliases[a] || a; b = aliases[b] || b;
    const A = NODES[a]; const B = NODES[b];
    if (!A || !B) return;
    const edge = edgeEls[`${a}>${b}`];
    if (!edge) return;
    edge.classList.add('hot'); setTimeout(() => edge.classList.remove('hot'), 650);
    const c = document.createElementNS(SVGNS, 'circle');
    c.setAttribute('r', 6);
    c.setAttribute('class', `pulse pulse-${kind || 'agent'}`);
    pulseLayer.append(c);
    const start = performance.now();
    const dur = 520;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    function tick(now) {
      const k = reduce ? 1 : Math.min(1, (now - start) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      c.setAttribute('cx', A.x + (B.x - A.x) * e);
      c.setAttribute('cy', A.y + (B.y - A.y) * e);
      if (k < 1) requestAnimationFrame(tick); else setTimeout(() => c.remove(), 120);
    }
    requestAnimationFrame(tick);
  }

  return {
    // Count each agent once per message or information request.
    play(step) {
      const id = aliases[step.agent] || step.agent;
      flash(id);
      const key = `${step.itemId || step.draftId}:${id}`;
      if (NODES[id]?.kind === 'agent' && !seen.has(key)) {
        seen.add(key); state.counts[id] = (state.counts[id] || 0) + 1; setCount(id);
      }
      if (step.to) {
        const kind = step.to === 'gate' ? 'human' : step.to === 'delivered' ? 'ok' : step.to === 'kb' ? 'store' : 'agent';
        pulse(id, step.to, kind);
        if (step.alsoTo) pulse(id, step.alsoTo, kind);
        setTimeout(() => flash(step.to), 500);
      }
    },
    counts: () => ({ ...state.counts }),
  };
}
