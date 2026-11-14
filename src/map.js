// Animated agent map. Plays trace steps: lights the acting agent and sends a
// pulse along the edge to the next one. The trace list beside it is the text
// equivalent for screen readers.

const NODES = {
  source:     { x: 180, y: 34,  label: 'Message in', kind: 'io' },
  capture:    { x: 180, y: 102, label: 'Capture', kind: 'agent' },
  router:     { x: 180, y: 170, label: 'Router', kind: 'agent' },
  curator:    { x: 180, y: 238, label: 'Curator', kind: 'agent' },
  kb:         { x: 300, y: 238, label: 'Knowledge', kind: 'store' },
  teamwork:   { x: 68,  y: 322, label: 'Teamwork', kind: 'agent' },
  commercial: { x: 180, y: 322, label: 'Commercial', kind: 'agent' },
  content:    { x: 292, y: 322, label: 'Content', kind: 'agent' },
  gate:       { x: 104, y: 418, label: 'Founder gate', kind: 'human' },
  delivered:  { x: 260, y: 418, label: 'Delivered', kind: 'io' },
};

const EDGES = [
  ['source', 'capture'], ['capture', 'router'], ['router', 'curator'], ['curator', 'kb'],
  ['curator', 'teamwork'], ['curator', 'commercial'], ['curator', 'content'],
  ['router', 'gate'], ['curator', 'gate'],
  ['teamwork', 'gate'], ['commercial', 'gate'], ['content', 'gate'],
  ['teamwork', 'delivered'], ['commercial', 'delivered'], ['content', 'delivered'],
  ['gate', 'delivered'], ['gate', 'kb'],
];

const W = 104;
const H = 40;
const SVGNS = 'http://www.w3.org/2000/svg';

export function createMap(svg, counts = {}) {
  svg.setAttribute('viewBox', '0 0 362 452');
  svg.innerHTML = '';
  const edgeLayer = document.createElementNS(SVGNS, 'g');
  const nodeLayer = document.createElementNS(SVGNS, 'g');
  const pulseLayer = document.createElementNS(SVGNS, 'g');
  svg.append(edgeLayer, nodeLayer, pulseLayer);

  const edgeEls = {};
  EDGES.forEach(([a, b]) => {
    const l = document.createElementNS(SVGNS, 'line');
    l.setAttribute('x1', NODES[a].x); l.setAttribute('y1', NODES[a].y);
    l.setAttribute('x2', NODES[b].x); l.setAttribute('y2', NODES[b].y);
    l.setAttribute('class', 'edge');
    edgeLayer.append(l);
    edgeEls[`${a}>${b}`] = l;
  });

  const nodeEls = {};
  Object.entries(NODES).forEach(([id, n]) => {
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', `node node-${n.kind}`);
    g.setAttribute('transform', `translate(${n.x - W / 2}, ${n.y - H / 2})`);
    const r = document.createElementNS(SVGNS, 'rect');
    r.setAttribute('width', W); r.setAttribute('height', H); r.setAttribute('rx', n.kind === 'io' ? 20 : 10);
    const t = document.createElementNS(SVGNS, 'text');
    t.setAttribute('x', W / 2); t.setAttribute('y', H / 2 + 5); t.setAttribute('text-anchor', 'middle');
    t.textContent = n.label;
    const badge = document.createElementNS(SVGNS, 'g');
    badge.setAttribute('class', 'count');
    badge.setAttribute('transform', `translate(${W - 4}, -4)`);
    const bc = document.createElementNS(SVGNS, 'circle'); bc.setAttribute('r', 11);
    const bt = document.createElementNS(SVGNS, 'text'); bt.setAttribute('y', 4); bt.setAttribute('text-anchor', 'middle');
    badge.append(bc, bt);
    g.append(r, t, badge);
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
    const el = nodeEls[id];
    if (!el) return;
    el.g.classList.remove('active');
    void el.g.getBBox();
    el.g.classList.add('active');
    setTimeout(() => el.g.classList.remove('active'), 700);
  }

  function pulse(a, b, kind) {
    const A = NODES[a]; const B = NODES[b];
    if (!A || !B) return;
    const edge = edgeEls[`${a}>${b}`];
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
      const id = step.agent === 'founder' ? 'gate' : step.agent;
      flash(id);
      const key = `${step.itemId || step.draftId}:${id}`;
      if (NODES[id]?.kind === 'agent' && !seen.has(key)) {
        seen.add(key); state.counts[id] = (state.counts[id] || 0) + 1; setCount(id);
      }
      if (step.to) {
        const kind = step.to === 'gate' ? 'human' : step.to === 'delivered' ? 'ok' : step.to === 'kb' ? 'store' : 'agent';
        pulse(id, step.to, kind);
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
