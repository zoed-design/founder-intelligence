import { triage, decide, captureOverride, ask } from './src/engine.js';

const FILES = ['business', 'knowledge', 'inbox', 'agents', 'assumptions'];
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const now = () => new Date().toTimeString().slice(0, 5);

let pristine;   // loaded data, never mutated
let data;       // working copy for this demo run
let state;

const CHANNEL = { voice: 'Voice note', email: 'Email', camera: 'Photo', whatsapp: 'WhatsApp', sms: 'SMS' };
const TIER_LABEL = { internal: 'Internal', 'customer-safe': 'Customer-safe', public: 'Public-approved' };
const tierBadge = (t) => `<span class="badge tier-${t}">${TIER_LABEL[t] || t}</span>`;

async function load() {
  const parts = await Promise.all(FILES.map((f) => fetch(`data/${f}.json`).then((r) => r.json())));
  pristine = Object.fromEntries(FILES.map((f, i) => [f, parts[i]]));
  reset();
}

function reset() {
  data = structuredClone(pristine);
  state = { results: null, drafts: [], audit: [], newKb: new Set(), editing: null };
  renderInbox(); renderDrafts(); renderAudit(); renderKb(); renderImpact(); renderAgents(); renderAskers();
  $('#askOut').innerHTML = '';
  $('#run').disabled = false;
  $('#bulk').hidden = true;
}

function person(id) { return data.business.directory.find((p) => p.id === id); }

// ---------- 1. Inbox ----------
function renderInbox() {
  const done = new Set((state.results || []).map((r) => r.item.id));
  $('#inbox').innerHTML = data.inbox.items.map((i) => `
    <li class="${done.has(i.id) ? 'done' : ''}">
      <div class="meta"><span>${esc(CHANNEL[i.channel] || i.channel)}</span><span>${esc(i.time)}</span></div>
      <div class="from">${esc(person(i.from)?.label || i.from)}</div>
      ${i.subject ? `<div class="txt"><b>${esc(i.subject)}</b></div>` : ''}
      <div class="txt">${esc(i.transcript)}</div>
      ${i.attachment ? `<div class="photo" role="img" aria-label="Placeholder for an unlabelled site photo">Unlabelled photo (placeholder)</div>` : ''}
    </li>`).join('');
}

// ---------- 2. Review gate ----------
function renderDrafts() {
  const box = $('#drafts');
  if (!state.results) { box.innerHTML = '<p class="empty">Run the triage to see drafted actions.</p>'; return; }
  box.innerHTML = state.results.map((r) => {
    const cards = state.drafts.filter((d) => d.itemId === r.item.id).map(draftCard).join('');
    return `<div class="group"><h3>${esc(r.item.id)} · ${esc(person(r.item.from)?.label)} → ${esc(agentName(r.agent))}
      ${r.project ? ` · ${esc(r.project.id)}` : ''}</h3>${cards}</div>`;
  }).join('');
  const pending = state.drafts.filter((d) => d.status === 'pending');
  $('#bulk').hidden = false;
  $('#pendingCount').textContent = `${pending.length} pending · ${pending.filter((d) => d.escalated).length} need the founder's own judgement`;
  $('#approveSafe').disabled = !pending.some((d) => !d.escalated);
}

function draftCard(d) {
  const editing = state.editing === d.id;
  const status = d.status === 'pending'
    ? (d.escalated ? '<span class="badge esc">Escalated to founder</span>' : '<span class="badge plain">Pending review</span>')
    : `<span class="badge ${d.status === 'approved' ? 'ok' : 'bad'}">${d.status === 'approved' ? `Approved${d.edited ? ' with edits' : ''} · sent` : 'Rejected'}</span>`;
  return `<article class="draft ${d.escalated && d.status === 'pending' ? 'escalated' : ''} ${d.status}" data-id="${d.id}">
    <div class="row">${status} ${tierBadge(d.tier)} ${d.stream ? `<span class="badge plain">${esc(d.stream)} stream</span>` : ''}</div>
    <div class="title">${esc(d.title)}</div>
    <div class="route">${esc(agentName(d.agent))} → ${esc(d.channel)} → ${esc(d.to)} · ${d.id}</div>
    ${editing
      ? `<label class="hint" for="ta-${d.id}">Edit the draft. Any sentence you add becomes a founder rule in the knowledge base.</label>
         <textarea id="ta-${d.id}">${esc(d.body)}</textarea>`
      : `<div class="body">${esc(d.body)}</div>${d.originalBody ? `<div class="orig">${esc(d.originalBody)}</div>` : ''}`}
    ${d.flags?.length ? `<ul class="flags">${d.flags.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
    <div class="cites">Sources: ${d.citations.length ? d.citations.map((c) => `<button type="button" data-cite="${c}" data-d="${d.id}">${c}</button>`).join(' ') : '<i>none cited</i>'}</div>
    <div class="srcbox" id="src-${d.id}" hidden></div>
    ${d.status === 'pending' ? `<div class="btns">
      ${editing
        ? `<button class="approve small" data-act="save" data-d="${d.id}">Approve edited version</button>
           <button class="ghost small" data-act="cancel" data-d="${d.id}">Cancel</button>`
        : `<button class="approve small" data-act="approve" data-d="${d.id}">Approve &amp; send</button>
           <button class="secondary small" data-act="edit" data-d="${d.id}">Edit</button>
           <button class="reject small" data-act="reject" data-d="${d.id}">Reject</button>`}
    </div>` : ''}
  </article>`;
}

function agentName(id) { return data.agents.agents.find((a) => a.id === id)?.name || id; }

function apply(id, decision, edited) {
  const i = state.drafts.findIndex((d) => d.id === id);
  const { draft, event } = decide(state.drafts[i], decision, { edited, clock: now });
  state.drafts[i] = draft;
  state.audit.push(event);
  if (draft.edited) {
    const sop = captureOverride(draft.originalBody, draft.body, { draftId: draft.id, id: `SOP-${String(state.newKb.size + 1).padStart(2, '0')}` });
    if (sop) {
      data.knowledge.entries.push(sop);
      state.newKb.add(sop.id);
      state.audit.push({ t: now(), actor: 'Curator', action: 'learned', detail: `${sop.id} added to internal tier from founder edit on ${draft.id}` });
      toast(`New founder rule ${sop.id} saved. Future answers use it.`);
    }
  } else if (decision === 'approved') {
    toast(`${draft.id} approved and sent by ${draft.channel}`);
  }
  state.editing = null;
  renderDrafts(); renderAudit(); renderKb(); renderImpact();
}

$('#drafts').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.cite) {
    const entry = data.knowledge.entries.find((x) => x.id === b.dataset.cite);
    const box = $(`#src-${b.dataset.d}`);
    box.hidden = !box.hidden && box.dataset.cur === entry.id;
    box.dataset.cur = entry.id;
    box.innerHTML = `${tierBadge(entry.tier)} <b>${esc(entry.title)}</b><br>${esc(entry.text)}<br><span class="hint">Source: ${esc(entry.source)} · Owner: ${esc(entry.owner)} · Review by ${esc(entry.reviewDate)}</span>`;
    return;
  }
  const id = b.dataset.d;
  switch (b.dataset.act) {
    case 'approve': return apply(id, 'approved');
    case 'reject': return apply(id, 'rejected');
    case 'edit': state.editing = id; renderDrafts(); $(`#ta-${id}`).focus(); return;
    case 'cancel': state.editing = null; return renderDrafts();
    case 'save': return apply(id, 'approved', $(`#ta-${id}`).value);
    default:
  }
});

$('#approveSafe').addEventListener('click', () => {
  state.drafts.filter((d) => d.status === 'pending' && !d.escalated).forEach((d) => {
    const { draft, event } = decide(d, 'approved', { clock: now });
    state.drafts[state.drafts.findIndex((x) => x.id === d.id)] = draft;
    state.audit.push(event);
  });
  toast('Routine drafts approved and sent. Escalated items still wait for you.');
  renderDrafts(); renderAudit(); renderImpact();
});

// ---------- Run ----------
$('#run').addEventListener('click', () => {
  const { results, audit } = triage(data, now);
  state.results = results;
  state.drafts = results.flatMap((r) => r.drafts);
  state.audit = audit;
  $('#run').disabled = true;
  renderInbox(); renderDrafts(); renderAudit(); renderImpact();
  toast(`${state.drafts.length} drafts ready from ${results.length} inputs`);
  $('#s2').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#reset').addEventListener('click', reset);

// ---------- 3. Audit ----------
function renderAudit() {
  $('#audit').innerHTML = state.audit.length
    ? state.audit.map((a) => `<li><span class="hint">${esc(a.t)}</span> <span class="who">${esc(agentName(a.actor))}</span> <span class="act act-${esc(a.action)}">${esc(a.action)}</span> ${esc(a.detail)}</li>`).join('')
    : '<li class="empty">The audit trail starts when triage runs.</li>';
}

// ---------- 4. Ask as anyone ----------
const PROMPTS = [
  ['framer-01', 'what is the framing rate and markup?'],
  ['framer-01', 'stud spacing for the party wall'],
  ['client-elm', 'what is outstanding on the frame claim?'],
  ['client-elm', 'can we widen the kitchen opening, what is the variation rule?'],
  ['public', 'how long does a build take?'],
  ['founder', 'what is the framing rate and markup?'],
];
function renderAskers() {
  $('#askAs').innerHTML = data.business.directory.map((p) => `<option value="${p.id}">${esc(p.label)}</option>`).join('');
  $('#chips').innerHTML = PROMPTS.map(([who, q], i) => `<button type="button" data-i="${i}">${esc(person(who).label.split(' (')[0])}: “${esc(q)}”</button>`).join('');
}
$('#chips').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-i]');
  if (!b) return;
  const [who, q] = PROMPTS[+b.dataset.i];
  $('#askAs').value = who; $('#askQ').value = q;
  runAsk();
});
$('#askForm').addEventListener('submit', (e) => { e.preventDefault(); runAsk(); });

function runAsk() {
  const q = $('#askQ').value.trim();
  if (!q) return;
  const who = $('#askAs').value;
  const res = ask(q, who, data);
  const entry = res.citation && data.knowledge.entries.find((x) => x.id === res.citation);
  const badge = { answered: '<span class="badge ok">Answered</span>', withheld: '<span class="badge bad">Withheld · sent to founder</span>', gap: '<span class="badge esc">Knowledge gap logged</span>' }[res.outcome];
  $('#askOut').innerHTML = `<div class="answer">
    <div class="q">${esc(person(who).label)} · access: ${res.who.access.map(tierBadge).join(' ')}${res.who.projectScoped ? ` · own jobs only (${esc(res.who.projects.join(', '))})` : ''}</div>
    <div class="q">“${esc(q)}”</div>
    <div class="a">${esc(res.answer)}</div>
    <div class="row">${badge} ${entry ? `<span class="hint">Source: ${esc(entry.id)}, ${esc(entry.source)}</span>` : ''}</div>
    ${res.retrieval.withheld.length ? `<p class="hint">Matched but withheld from this person: ${res.retrieval.withheld.map((w) => `${esc(w.id)} (${esc(w.reason)})`).join(', ')}</p>` : ''}
  </div>`;
  state.audit.push({ t: now(), actor: 'router', action: res.outcome === 'answered' ? 'answered' : res.outcome, detail: `Ask as ${person(who).label}: ${res.citation || 'no answer'}${res.retrieval.withheld.length ? `; withheld ${res.retrieval.withheld.map((w) => w.id).join(', ')}` : ''}` });
  renderAudit();
}

// ---------- 5. Knowledge base ----------
function renderKb() {
  $('#kb').innerHTML = ['internal', 'customer-safe', 'public'].map((t) => `
    <div class="tier"><h3>${tierBadge(t)}</h3>
      ${data.knowledge.entries.filter((e) => e.tier === t).map((e) => `
        <div class="entry ${state.newKb.has(e.id) ? 'new' : ''}"><b>${esc(e.id)}</b> ${esc(e.title)}${state.newKb.has(e.id) ? ' <span class="badge ok">New from founder edit</span>' : ''}
          <div>${esc(e.text)}</div>
          <div class="src">${esc(e.source)} · owner ${esc(e.owner)} · review ${esc(e.reviewDate)}</div></div>`).join('')}
    </div>`).join('');
}

// ---------- 6. Impact and role cards ----------
function renderImpact() {
  if (!state.results) { $('#impact').innerHTML = '<p class="empty">Shown after triage.</p>'; return; }
  const a = data.assumptions;
  const sent = state.drafts.filter((d) => d.status === 'approved');
  const escalated = state.results.filter((r) => r.escalate).length;
  const withheld = state.results.reduce((n, r) => n + r.retrieval.withheld.length, 0);
  const conflicts = state.results.reduce((n, r) => n + r.conflicts.length, 0);
  const handled = state.results.length - escalated;
  const minutes = handled * a.minutesPerFounderQuestion + sent.filter((d) => d.stream === 'Brand').length * a.minutesPerPost + sent.filter((d) => d.stream === 'Commercial').length * a.minutesPerClaimPack;
  const stats = [
    [state.results.length, 'inputs triaged'],
    [state.drafts.length, 'drafts prepared'],
    [sent.length, 'approved and sent'],
    [escalated, 'escalated to founder'],
    [conflicts, 'conflicts caught before work'],
    [withheld, 'restricted records withheld'],
    [state.newKb.size, 'new founder rules'],
    [`${minutes} min`, 'founder time freed', true],
  ];
  $('#impact').innerHTML = stats.map(([v, l, assume]) => `<div class="stat ${assume ? 'assume' : ''}"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join('')
    + '<p class="hint" style="grid-column:1/-1">* From illustrative assumptions, not measured.</p>';
}

function renderAgents() {
  $('#agents').innerHTML = data.agents.agents.map((a) => `<details><summary>${esc(a.name)}</summary><dl>
    <dt>Purpose</dt><dd>${esc(a.purpose)}</dd><dt>Sources</dt><dd>${esc(a.sources.join(', '))}</dd>
    <dt>Tier</dt><dd>${esc(a.tier)}</dd><dt>Autonomy</dt><dd>${esc(a.autonomy)}</dd><dt>Handover</dt><dd>${esc(a.handover)}</dd></dl></details>`).join('');
}

let tt;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3200);
}

load().catch((err) => {
  document.querySelector('main').insertAdjacentHTML('afterbegin', `<p class="step">Could not load demo data (${esc(err.message)}). Serve the folder over HTTP, e.g. <code>npm start</code>.</p>`);
});
