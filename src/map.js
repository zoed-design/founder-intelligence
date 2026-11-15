// Animated agent map. Plays trace steps: lights the acting agent and sends a
// pulse along the edge to the next one. The trace list beside it is the text
// equivalent for screen readers.

export const NODES = {
  source:    { x: 200, y: 30, w: 150, h: 40, label: 'New messages', kind: 'io' },
  router:    { x: 92, y: 115, w: 160, h: 58, label: 'Digger', role: 'Site Manager', kind: 'agent' },
  capture:   { x: 305, y: 115, w: 166, h: 58, label: 'Lyra', role: 'Organizes', kind: 'agent' },
  questions: { x: 100, y: 225, w: 188, h: 54, label: 'Questions', role: 'Digger · Roo · Tally · Kooka', kind: 'io' },
  kb:        { x: 305, y: 225, w: 120, h: 52, label: 'Wiki', kind: 'store' },
  curator:   { x: 100, y: 330, w: 170, h: 58, label: 'Bower', role: 'Finds + references', kind: 'agent' },
  result:    { x: 200, y: 425, w: 218, h: 46, label: 'Information + sources', kind: 'io' },
};

export const EDGES = [
  { from: 'source', to: 'router' },
  { from: 'source', to: 'capture' },
  { from: 'router', to: 'capture', both: true },
  { from: 'capture', to: 'kb' },
  { from: 'router', to: 'questions' },
  { from: 'questions', to: 'curator', both: true },
  { from: 'curator', to: 'kb', both: true },
  { from: 'curator', to: 'result' },
];

const aliases = { teamwork: 'questions', commercial: 'questions', content: 'questions', gate: 'result', delivered: 'result' };
const SVGNS = 'http://www.w3.org/2000/svg';
let mapSequence = 0;

function anchor(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const scale = Math.min(dx ? (a.w / 2 + 5) / Math.abs(dx) : Infinity, dy ? (a.h / 2 + 5) / Math.abs(dy) : Infinity);
  return { x: a.x + dx * scale, y: a.y + dy * scale };
}

export function createMap(svg, counts = {}, portraits = {}) {
  svg.setAttribute('viewBox', '0 0 400 465');
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
      const cc = document.createElementNS(SVGNS, 'circle'); cc.setAttribute('cx', 28); cc.setAttribute('cy', 29); cc.setAttribute('r', 21);
      cp.append(cc); g.append(cp);
      const ring = document.createElementNS(SVGNS, 'circle'); ring.setAttribute('cx', 28); ring.setAttribute('cy', 29); ring.setAttribute('r', 21); ring.setAttribute('class', 'ring');
      g.append(ring);
      if (pic) {
        const im = document.createElementNS(SVGNS, 'image');
        im.setAttribute('href', pic); im.setAttribute('x', 5); im.setAttribute('y', 6); im.setAttribute('width', 46); im.setAttribute('height', 46);
        im.setAttribute('clip-path', `url(#${clipId})`);
        g.append(im);
      } else {
        const ini = document.createElementNS(SVGNS, 'text'); ini.setAttribute('x', 28); ini.setAttribute('y', 34); ini.setAttribute('text-anchor', 'middle'); ini.textContent = n.label[0];
        g.append(ini);
      }
      const t1 = document.createElementNS(SVGNS, 'text'); t1.setAttribute('x', 58); t1.setAttribute('y', 25); t1.setAttribute('class', 'nm'); t1.textContent = n.label;
      const t2 = document.createElementNS(SVGNS, 'text'); t2.setAttribute('x', 58); t2.setAttribute('y', 42); t2.setAttribute('class', 'rl'); t2.textContent = n.role;
      g.append(t1, t2);
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
    if (edge) { edge.classList.add('hot'); setTimeout(() => edge.classList.remove('hot'), 650); }
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
    // Counts: each agent once per message it works on; gate and delivered once per draft.
    play(step) {
      const id = step.agent === 'founder' ? 'result' : aliases[step.agent] || step.agent;
      flash(id);
      const key = `${step.itemId || step.draftId}:${id}`;
      if (NODES[id]?.kind === 'agent' && !seen.has(key)) {
        seen.add(key); state.counts[id] = (state.counts[id] || 0) + 1; setCount(id);
      }
      if (step.to) {
        const kind = step.to === 'gate' ? 'human' : step.to === 'delivered' ? 'ok' : step.to === 'kb' ? 'store' : 'agent';
        pulse(id, step.to, kind);
        if (step.alsoTo) pulse(id, step.alsoTo, kind);
        if (['delivered', 'gate'].includes(step.to) && step.draftId) {
          const k2 = `${step.draftId}:${step.to}`;
          if (!seen.has(k2)) {
            seen.add(k2);
            state.counts[step.to] = (state.counts[step.to] || 0) + 1;
            setTimeout(() => { flash(step.to); setCount(step.to); }, 500);
          }
        } else if (['kb', 'delivered', 'gate'].includes(step.to)) {
          setTimeout(() => flash(step.to), 500);
        }
      }
    },
    counts: () => ({ ...state.counts }),
  };
}
