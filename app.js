import { orchestrate, DEFAULT_POLICY } from './src/agents.js';
import { decide, captureOverride, makeRule, resetDraftSeq, identify, canSee } from './src/engine.js';
import { createMap } from './src/map.js';

const FILES = ['business', 'knowledge', 'inbox', 'agents', 'assumptions', 'photo-presets'];
const KEY = 'founder-intelligence-app-v1';
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const now = () => new Date().toTimeString().slice(0, 5);
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const STEP_MS = 380;

const TIER = { internal: 'Internal', 'customer-safe': 'Customer-safe', public: 'Public' };
const tierBadge = (t) => `<span class="badge t-${t}">${TIER[t] || esc(t)}</span>`;
const AGENT_SHORT = { capture: 'Capture', router: 'Router', curator: 'Curator', teamwork: 'Teamwork', commercial: 'Commercial', content: 'Content', founder: 'Founder', gate: 'Founder gate', source: 'Message' };

const OFFICE_PRESETS = {
  'bookkeeper-01': [['Unallocated docket HR-8821', 'Hi, I have an unallocated Harbour Readymix concrete invoice, docket HR-8821, $14,250 inc GST. Which job and cost code does this go to?'], ['New rule', 'FYI from now on every supplier invoice needs a PO number before it is paid.']],
  'admin-01': [['Elm Ridge progress claim', 'Where are we up to with the Elm Ridge frame progress claim? The lender has asked what is outstanding.'], ['Variation question', 'The Elm Ridge homeowner wants to change the tiles in the ensuite. What is our variation rule?']],
};

const ICON = {
  camera: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l16-8-6 16-3-7z"/></svg>',
};

let P;      // pristine data, never changed
let S;      // persisted app state
let data;   // working data: pristine plus learned knowledge
let map;
const ui = { tab: 'queue', filter: 'all', editing: null, openSrc: null, sitePerson: 'framer-01', officePerson: 'bookkeeper-01', photo: null, showHandled: false };

// ---------- State ----------
function blank() {
  return { v: 1, role: 'founder', kbAdded: [], drafts: [], threads: {}, trace: [], counts: {}, policy: { ...DEFAULT_POLICY }, seq: { msg: 0, draft: 0, rule: 0 }, stats: { withheld: 0 } };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable: state lives for this visit */ } }
function restore() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s?.v === 1) return { ...blank(), ...s }; } catch { /* ignore */ }
  return blank();
}
function rebuildData() {
  data = { ...structuredClone(P), knowledge: { ...P.knowledge, entries: [...P.knowledge.entries, ...S.kbAdded] } };
}
const thread = (id) => (S.threads[id] ||= []);
const person = (id) => P.business.directory.find((p) => p.id === id);

// ---------- Step player (drives the agent map) ----------
const queue = [];
let playing = false;
function enqueue(steps) { queue.push(...steps); if (!playing) nextStep(); }
function nextStep() {
  const s = queue.shift();
  if (!s) { playing = false; S.counts = map.counts(); save(); return; }
  playing = true;
  map.play(s);
  S.trace.push(s);
  if (S.trace.length > 400) S.trace.splice(0, S.trace.length - 400);
  $('#trace').insertAdjacentHTML('afterbegin', traceLi(s));
  setTimeout(nextStep, reduceMotion() ? 40 : STEP_MS);
}
function traceLi(s) {
  return `<li><span class="who ${esc(s.agent)}">${esc(AGENT_SHORT[s.agent] || s.agent)}</span> <span class="act">${esc(s.action)}</span> ${esc(s.detail)}</li>`;
}
function renderTrace() { $('#trace').innerHTML = S.trace.slice().reverse().map(traceLi).join('') || '<li>Send a message from any role to see the agents work.</li>'; }

// ---------- Sending a message through the agents ----------
function send(fromId, text, extra = {}) {
  S.seq.msg += 1;
  const id = `M-${S.seq.msg}`;
  const item = { id, time: now(), channel: extra.channel || 'chat', from: fromId, subject: extra.subject, transcript: text, attachment: extra.attachment, simulatedVision: extra.vision };
  thread(fromId).push({ who: 'me', text, img: extra.img, t: now() });

  resetDraftSeq(S.seq.draft);
  const out = orchestrate(item, data, { policy: S.policy, clock: now });
  S.seq.draft += out.drafts.length;
  out.drafts.forEach((d) => S.drafts.push({ ...d, from: fromId, question: text, img: extra.img }));
  S.stats.withheld += out.route.retrieval.withheld.length;

  const delay = reduceMotion() ? 200 : out.steps.length * STEP_MS + 200;
  setTimeout(() => {
    out.drafts.filter((d) => d.status === 'auto-sent').forEach((d) => deliver(d, 'auto'));
    const answeredNow = out.drafts.some((d) => d.status === 'auto-sent' && d.toId === fromId);
    const pending = out.drafts.filter((d) => d.status === 'pending');
    if (!answeredNow && pending.length) thread(fromId).push({ who: 'wait', text: waitText(out, pending), t: now() });
    save(); render();
    const auto = out.drafts.filter((d) => d.status === 'auto-sent').length;
    toast(auto ? `${AGENT_SHORT[out.route.agent]} agent answered from approved knowledge` : `${pending.length} draft${pending.length === 1 ? '' : 's'} waiting for the founder`);
  }, delay);

  enqueue(out.steps);
  save(); render();
  return out;
}

function waitText(out, pending) {
  if (pending.some((d) => d.kind === 'gap')) return 'No approved answer yet, so this has gone to the founder. Their answer will be saved for next time.';
  if (out.route.best.outcome === 'withheld' && out.route.intent !== 'site-photo') return 'That’s restricted information, so I’ve passed your question to the founder.';
  if (out.route.intent === 'scope-change') return 'Changes to the agreed work always go to the founder. You’ll get a written variation before anything starts.';
  if (out.route.intent === 'site-photo') return out.route.escalate ? 'I can’t read this photo clearly, so the founder will take a look.' : `Got it. ${pending.length} item${pending.length === 1 ? '' : 's'} drafted from your photo for the founder to approve.`;
  if (out.route.intent === 'knowledge-update') return 'Thanks. Proposed as company knowledge; the founder will approve it.';
  if (out.route.conflicts.length) return 'That differs from the approved drawings, so the founder is checking the reply before it’s sent.';
  if (out.route.escalate) return `Passed to the founder: ${out.route.escalateReason.charAt(0).toLowerCase()}${out.route.escalateReason.slice(1)}.`;
  return 'Drafted. The founder checks this kind of reply before it’s sent.';
}

function deliver(d, how) {
  if (!d.toId) return;
  thread(d.toId).push({ who: 'bot', agent: d.agent, text: d.body, cites: d.citations, how, t: now() });
}

// ---------- Founder decisions ----------
function nextRuleId() { S.seq.rule += 1; return `SOP-${String(S.seq.rule).padStart(2, '0')}`; }

function apply(id, decision, edited, ruleTier) {
  const i = S.drafts.findIndex((d) => d.id === id);
  if (i < 0) return;
  const { draft, event } = decide(S.drafts[i], decision, { edited, clock: now });
  S.drafts[i] = draft;
  const steps = [{ t: now(), itemId: draft.itemId, agent: 'founder', action: decision, detail: event.detail, draftId: draft.id, to: decision === 'approved' && draft.toId ? 'delivered' : undefined }];
  let rule = null;
  if (decision === 'approved') {
    if (draft.kind === 'knowledge') {
      rule = makeRule(draft.body, { id: nextRuleId(), tier: ruleTier || draft.ruleTier || 'internal', source: `Proposed by ${person(draft.from)?.label || 'staff'}, approved by founder` });
    } else if (draft.edited) {
      rule = captureOverride(draft.originalBody, draft.body, { id: nextRuleId(), tier: ruleTier || draft.ruleTier || 'internal', draftId: draft.id, question: draft.question });
    }
    if (rule) {
      S.kbAdded.push(rule);
      rebuildData();
      steps.push({ t: now(), itemId: draft.itemId, agent: 'founder', action: 'learned', detail: `${rule.id} saved to ${TIER[rule.tier]} knowledge`, to: 'kb' });
    }
    deliver(draft, 'founder');
  }
  ui.editing = null;
  enqueue(steps);
  save(); render();
  toast(decision === 'rejected' ? `${draft.id} rejected` : rule ? `Approved. New rule ${rule.id} saved; agents use it from now on.` : `${draft.id} approved and sent by ${draft.channel}`);
}

// ---------- Rendering ----------
function render() {
  document.querySelectorAll('.role').forEach((b) => b.setAttribute('aria-current', b.dataset.role === S.role ? 'page' : 'false'));
  const v = { founder: founderView, site: siteView, client: clientView, office: officeView, public: publicView }[S.role] || founderView;
  const atBottom = [...document.querySelectorAll('.thread')].map((t) => t.scrollTop >= t.scrollHeight - t.clientHeight - 30);
  $('#view').innerHTML = v();
  document.querySelectorAll('.thread').forEach((t, n) => { if (atBottom[n] !== false) t.scrollTop = t.scrollHeight; });
}

function threadHtml(id, emptyText) {
  const msgs = thread(id);
  if (!msgs.length) return `<p class="empty small">${esc(emptyText)}</p>`;
  return msgs.map((m) => {
    if (m.who === 'me') return `<div class="msg me">${m.img ? `<img src="${m.img}" alt="Photo sent">` : ''}${esc(m.text)}<div class="meta">${esc(m.t)}</div></div>`;
    if (m.who === 'wait') return `<div class="msg wait">${esc(m.text)}<div class="meta">Router · ${esc(m.t)}</div></div>`;
    const how = m.how === 'auto' ? '<span class="badge b-auto">Auto-sent: approved knowledge</span>' : '<span class="badge b-ok">Approved by founder</span>';
    return `<div class="msg bot">${esc(m.text)}<div class="meta"><span class="agentchip ${esc(m.agent)}">${esc(AGENT_SHORT[m.agent] || m.agent)} agent</span>${how}${(m.cites || []).map((c) => `<span>${esc(c)}</span>`).join('')}<span>${esc(m.t)}</span></div></div>`;
  }).join('');
}

function composer(form, placeholder, { photo = false } = {}) {
  return `<form class="composer" data-form="${form}">
    ${photo ? `<label class="iconbtn" title="Send a photo">${ICON.camera}<span class="sr">Send a photo</span><input type="file" accept="image/*" data-photo hidden></label><button type="button" class="iconbtn" data-act="samplePhoto" title="Use a sample photo" aria-label="Use a sample photo"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 16l5-5 4 4 3-3 4 4"/></svg></button>` : ''}
    <label class="sr" for="in-${form}">Message</label>
    <input id="in-${form}" type="text" name="text" autocomplete="off" placeholder="${esc(placeholder)}">
    <button class="sendbtn" type="submit" aria-label="Send">${ICON.send}</button>
  </form>`;
}

function quick(list, target) {
  return `<div class="quick">${list.map((q) => `<button type="button" class="chip" data-quick="${esc(target)}" data-text="${esc(q)}">${esc(q)}</button>`).join('')}</div>`;
}

// ----- Founder console -----
function founderView() {
  const pending = S.drafts.filter((d) => d.status === 'pending');
  const kpi = (v, l, c = '') => `<div class="kpi ${c}"><div class="v">${v}</div><div class="l">${l}</div></div>`;
  const tab = (id, label, n) => `<button class="tab" role="tab" aria-selected="${ui.tab === id}" data-tab="${id}">${label}${n ? ` <span class="badge b-esc">${n}</span>` : ''}</button>`;
  const body = { queue: queueTab, kb: kbTab, audit: auditTab, agents: agentsTab }[ui.tab]();
  return `
  <div class="hello"><div><h1>Good morning</h1><p>Your agents work the inbox. You only see what needs your judgement.</p></div></div>
  <div class="kpis">
    ${kpi(pending.length, 'waiting for you')}
    ${kpi(pending.filter((d) => d.escalated).length, 'escalated', 'k-esc')}
    ${kpi(S.drafts.filter((d) => d.status === 'auto-sent').length, 'answered by agents', 'k-auto')}
    ${kpi(S.drafts.filter((d) => d.status === 'approved').length, 'approved by you')}
    ${kpi(S.kbAdded.length, 'rules learned', 'k-rule')}
    ${kpi(S.stats.withheld, 'restricted records withheld', 'k-with')}
  </div>
  <div class="card">
    <div class="tabs" role="tablist">${tab('queue', 'Review queue', pending.length)}${tab('kb', 'Knowledge')}${tab('audit', 'Audit trail')}${tab('agents', 'Agents and policy')}</div>
    ${body}
  </div>
  <div class="card chatcard">
    <div class="head"><h2>Ask your knowledge base</h2><p class="small muted">You can see every tier.</p></div>
    <div class="thread" style="min-height:120px">${threadHtml('founder', 'Try “what is the framing rate and markup?”')}</div>
    ${composer('founder', 'Ask anything…')}
  </div>`;
}

function queueTab() {
  const F = {
    all: () => true, escalated: (d) => d.escalated, replies: (d) => ['answer', 'gap', 'message'].includes(d.kind),
    records: (d) => ['record', 'variation'].includes(d.kind), posts: (d) => d.kind === 'post', knowledge: (d) => d.kind === 'knowledge',
  };
  const fl = [['all', 'All'], ['escalated', 'Escalated'], ['replies', 'Replies'], ['records', 'Records and variations'], ['posts', 'Posts'], ['knowledge', 'Proposed knowledge']];
  const pending = S.drafts.filter((d) => d.status === 'pending' && F[ui.filter](d)).sort((a, b) => Number(b.escalated) - Number(a.escalated));
  const handled = S.drafts.filter((d) => d.status !== 'pending' && F[ui.filter](d)).reverse();
  return `<div class="filters">${fl.map(([k, l]) => `<button class="chip" aria-pressed="${ui.filter === k}" data-filter="${k}">${l}</button>`).join('')}</div>
    ${pending.length ? pending.map(draftCard).join('') : `<p class="empty">Nothing waiting. ${S.drafts.length ? 'Your agents are handling the rest.' : 'Press “Play demo morning”, or switch to Site crew and send a message.'}</p>`}
    ${handled.length ? `<button class="chip" data-act="toggleHandled" aria-expanded="${ui.showHandled}">${ui.showHandled ? 'Hide' : 'Show'} handled (${handled.length})</button>
      ${ui.showHandled ? `<div style="margin-top:12px">${handled.map(draftCard).join('')}</div>` : ''}` : ''}`;
}

function draftCard(d) {
  const editing = ui.editing === d.id;
  const statusBadge = {
    pending: d.escalated ? '<span class="badge b-esc">Escalated</span>' : '<span class="badge b-plain">Needs review</span>',
    'auto-sent': '<span class="badge b-auto">Auto-sent by agent</span>',
    approved: `<span class="badge b-ok">Approved${d.edited ? ' with edits' : ''}</span>`,
    rejected: '<span class="badge b-bad">Rejected</span>',
  }[d.status];
  const ruleSel = `<label>${d.kind === 'knowledge' ? 'Save as' : 'Save new sentences as'} rule for
      <select data-ruletier="${d.id}">${['internal', 'customer-safe', 'public'].map((t) => `<option value="${t}" ${t === (d.ruleTier || 'internal') ? 'selected' : ''}>${TIER[t]}</option>`).join('')}</select></label>`;
  const src = ui.openSrc?.d === d.id ? data.knowledge.entries.find((e) => e.id === ui.openSrc.c) : null;
  return `<article class="draft ${d.status === 'pending' && d.escalated ? 'esc' : ''} ${d.status !== 'pending' ? 'done' : ''}">
    <div class="top">${statusBadge} ${tierBadge(d.tier)} <span class="agentchip ${esc(d.agent)}">${esc(AGENT_SHORT[d.agent])} agent</span>${d.stream ? ` <span class="badge b-plain">${esc(d.stream)}</span>` : ''}</div>
    <div class="title">${esc(d.title)}</div>
    <div class="route">${esc(d.id)} · from ${esc(person(d.from)?.label || 'demo inbox')} · to ${esc(d.to)} by ${esc(d.channel)}${d.escalateReason && d.status === 'pending' ? ` · ${esc(d.escalateReason)}` : ''}</div>
    ${d.question && d.kind !== 'knowledge' && d.question !== 'Photo' ? `<div class="small muted" style="margin-top:6px">Asked: “${esc(d.question)}”</div>` : ''}
    ${d.img ? `<img class="photo-thumb" src="${d.img}" alt="Site photo">` : ''}
    ${editing ? `<label class="sr" for="ta-${d.id}">Edit draft</label><textarea id="ta-${d.id}">${esc(d.body)}</textarea>`
      : `<div class="body">${esc(d.body)}</div>${d.originalBody ? `<div class="orig">${esc(d.originalBody)}</div>` : ''}`}
    ${d.flags?.length ? `<ul class="flags">${d.flags.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
    <div class="cites">Sources: ${d.citations?.length ? d.citations.map((c) => `<button class="cite" data-cite="${c}" data-d="${d.id}">${c}</button>`).join('') : '<i>none</i>'}</div>
    ${src ? `<div class="srcbox">${tierBadge(src.tier)} <b>${esc(src.title)}</b><br>${esc(src.text)}<br><span class="muted">${esc(src.source)} · owner ${esc(src.owner)} · review ${esc(src.reviewDate)}</span></div>` : ''}
    ${d.status === 'pending' ? `<div class="acts">
      ${editing
        ? `<button class="btn btn-ok btn-sm" data-act="save" data-d="${d.id}">Approve this version</button><button class="btn btn-line btn-sm" data-act="cancel">Cancel</button>${ruleSel}`
        : `${d.kind === 'gap' ? `<button class="btn btn-ok btn-sm" data-act="edit" data-d="${d.id}">Write the answer</button>` : `<button class="btn btn-ok btn-sm" data-act="approve" data-d="${d.id}">${d.kind === 'knowledge' ? 'Add to knowledge' : 'Approve and send'}</button><button class="btn btn-line btn-sm" data-act="edit" data-d="${d.id}">Edit</button>`}
           <button class="btn btn-bad btn-sm" data-act="reject" data-d="${d.id}">Reject</button>${d.kind === 'knowledge' ? ruleSel : ''}`}
    </div>` : ''}
  </article>`;
}

function kbTab() {
  const added = new Set(S.kbAdded.map((e) => e.id));
  const who = { internal: 'Founder, office', 'customer-safe': 'Plus crew, homeowners and certifier, on their own jobs', public: 'Everyone' };
  return `<div class="kbgrid">${['internal', 'customer-safe', 'public'].map((t) => `<section class="kbtier"><h3>${tierBadge(t)} <span class="small muted">${who[t]}</span></h3>
    ${data.knowledge.entries.filter((e) => e.tier === t).map((e) => `<div class="kbentry ${added.has(e.id) ? 'new' : ''}"><b>${esc(e.id)}</b> ${esc(e.title)} ${added.has(e.id) ? '<span class="badge b-ok">Learned</span>' : ''}<div>${esc(e.text)}</div><div class="src">${esc(e.source)} · owner ${esc(e.owner)} · review ${esc(e.reviewDate)}${e.project ? ` · ${esc(e.project)}` : ''}</div></div>`).join('')}</section>`).join('')}</div>`;
}

function auditTab() {
  if (!S.trace.length) return '<p class="empty">Every routing decision, search, withheld record, escalation and approval will be logged here.</p>';
  return `<ol class="audit">${S.trace.slice().reverse().map((s) => `<li><span class="muted">${esc(s.t)}</span> <b>${esc(AGENT_SHORT[s.agent] || s.agent)}</b> ${esc(s.action)} · ${esc(s.detail)}</li>`).join('')}</ol>`;
}

function agentsTab() {
  const counts = map.counts();
  return `<div class="policy">
      <span class="switch"><input type="checkbox" id="autoAnswer" ${S.policy.autoAnswer ? 'checked' : ''}><span></span></span>
      <label for="autoAnswer"><b>Let agents send answers that quote approved knowledge</b><br><span class="small">Only plain answers the person is allowed to see, with no conflict, at 0.9 confidence or higher. Posts, records, variations, new knowledge and anything escalated always come to you.</span></label>
    </div>
    <div class="agentgrid">${data.agents.agents.map((a) => `<div class="agentcard"><h3>${esc(a.name)} ${counts[a.id] ? `<span class="badge b-plain">${counts[a.id]} handled</span>` : ''}</h3><dl>
      <dt>Purpose</dt><dd>${esc(a.purpose)}</dd><dt>Sources</dt><dd>${esc(a.sources.join(', '))}</dd><dt>Tier</dt><dd>${esc(a.tier)}</dd><dt>Autonomy</dt><dd>${esc(a.autonomy)}</dd><dt>Handover</dt><dd>${esc(a.handover)}</dd></dl></div>`).join('')}</div>`;
}

// ----- Site crew -----
function siteView() {
  const id = ui.sitePerson;
  const who = identify(id, P.business);
  const isSup = id === 'supervisor-01';
  const chips = isSup
    ? ['FYI from now on all wet areas get a flood test before screed', 'What does the waterproofing standard need?', 'What is our framing markup?']
    : ['Are we doing studs at 600 on the Elm Ridge party wall?', 'What insulation goes in the party wall?', 'What is the framing rate and markup?', 'Which nails for the decking?'];
  return `<div class="hello"><div><h1>Site crew app</h1><p>What a carpenter or supervisor sees on their phone. Ask, send a photo, or tell the office something new.</p></div></div>
  <div class="phone-wrap">
    <div class="phone">
      <div class="phone-head"><div class="t">SiteBrain</div><div class="s">Answers from the drawings, checked by the founder when it matters</div>
        <label class="sr" for="sitePerson">You are</label>
        <select id="sitePerson" data-person="site"><option value="framer-01" ${id === 'framer-01' ? 'selected' : ''}>Framing carpenter (subcontractor)</option><option value="supervisor-01" ${isSup ? 'selected' : ''}>Site supervisor</option></select>
      </div>
      <div class="thread">${threadHtml(id, 'Ask about a drawing, a standard, or tell the office something new.')}</div>
      ${ui.photo ? photoPanel(who) : ''}
      ${quick(chips, id)}
      ${composer('site', 'Ask SiteBrain…', { photo: true })}
    </div>
    <div class="side-notes card">
      <h2 style="font-size:18px">What the ${esc(person(id).label.split(' (')[0].toLowerCase())} can see</h2>
      <p>${who.access.map(tierBadge).join(' ')} · own jobs only: ${esc(who.projects.join(', '))}</p>
      <h3 style="font-size:15px;margin-top:14px">Try</h3>
      <ul class="small">
        <li>Ask about <b>insulation in the party wall</b>: answered straight from the drawing, no founder needed.</li>
        <li>Ask about <b>studs at 600</b>: the curator spots the clash with the 450mm drawing and the founder checks the reply.</li>
        <li>Ask about <b>markup</b>: withheld, because pricing is internal.</li>
        <li>Ask about <b>decking nails</b>: a knowledge gap. Answer it as the founder, then ask again.</li>
        <li>Send a <b>photo</b> and pick what it shows (vision is simulated): one photo becomes up to three outputs.</li>
      </ul>
    </div>
  </div>`;
}

function photoPanel(who) {
  const presets = P['photo-presets'].presets;
  const jobs = who.projects.map((j) => P.business.projects.find((p) => p.id === j));
  return `<form class="photo-panel" data-form="photo">
    ${ui.photo.img ? `<img class="photo-thumb" src="${ui.photo.img}" alt="Selected photo" style="max-width:120px">` : '<div class="small muted">Using a sample photo</div>'}
    <fieldset><legend>What does it show? <span class="muted">(simulated vision)</span></legend>
      ${presets.map((p, i) => `<label><input type="radio" name="preset" value="${p.id}" ${i === 0 ? 'checked' : ''}> ${esc(p.label)}</label>`).join('')}
    </fieldset>
    <label>Job <select name="job">${jobs.map((j) => `<option value="${j.id}">${esc(j.name)}</option>`).join('')}</select></label>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-primary btn-sm" type="submit">Send photo</button><button class="btn btn-line btn-sm" type="button" data-act="cancelPhoto">Cancel</button></div>
  </form>`;
}

// ----- Homeowner portal -----
function clientView() {
  const id = 'client-elm';
  const who = identify(id, P.business);
  const proj = P.business.projects.find((p) => p.id === who.projects[0]);
  const at = proj.lenderStages.indexOf(proj.stage);
  const docs = data.knowledge.entries.filter((e) => e.tier !== 'internal' && canSee(e, who).ok && (e.project === proj.id || e.id === 'KB-STAGES'));
  return `<div class="portal-hero"><h1>${esc(proj.name)}</h1><p>Your build, in plain words. Questions go to your project assistant; anything that changes scope goes to the founder.</p>
    <div class="stages" role="list" aria-label="Build stages">${proj.lenderStages.map((s, i) => `<div role="listitem" class="stage ${i < at ? 'done' : i === at ? 'now' : ''}"><div class="bar2"></div>${esc(s)}${i === at ? ' (now)' : ''}</div>`).join('')}</div></div>
  <div class="two">
    <div class="card chatcard">
      <div class="head"><h2>Your project assistant</h2><p class="small muted">Commercial agent · customer-safe knowledge for your job only</p></div>
      <div class="thread">${threadHtml(id, 'Ask about progress, claims, or request a change.')}</div>
      ${quick(['What is outstanding on the frame claim?', 'Can we widen the kitchen opening to 3.6m?', 'What is your markup on framing?'], id)}
      ${composer('client', 'Message your builder…')}
    </div>
    <div class="card"><h2 style="font-size:17px">Shared with you</h2>
      <ul class="doclist">${docs.map((e) => `<li>${tierBadge(e.tier)} <b>${esc(e.title)}</b><div class="small">${esc(e.text)}</div></li>`).join('')}</ul>
      <p class="small muted">Pricing, margins and internal rules are never shown here, even by citation.</p></div>
  </div>`;
}

// ----- Office -----
function officeView() {
  const id = ui.officePerson;
  return `<div class="hello"><div><h1>Back office</h1><p>Bookkeeping and admin questions go to the commercial agent. Coding money always comes to the founder.</p></div>
    <label><span class="sr">You are</span><select data-person="office" style="font:inherit;padding:8px;border-radius:10px;border:1px solid var(--line);min-height:44px"><option value="bookkeeper-01" ${id === 'bookkeeper-01' ? 'selected' : ''}>External bookkeeper</option><option value="admin-01" ${id === 'admin-01' ? 'selected' : ''}>Office admin</option></select></label></div>
  <div class="two">
    <form class="card compose" data-form="office">
      <h2 style="font-size:17px">New email to Founder Intelligence</h2>
      <div class="filters">${OFFICE_PRESETS[id].map(([s], i) => `<button type="button" class="chip" data-fill="${i}">Fill: ${esc(s)}</button>`).join('')}</div>
      <label>Subject<input name="subject" type="text" autocomplete="off"></label>
      <label>Message<textarea name="text"></textarea></label>
      <div><button class="btn btn-primary" type="submit">Send</button></div>
    </form>
    <div class="card chatcard"><div class="head"><h2>Replies</h2></div><div class="thread">${threadHtml(id, 'Replies appear here once sent or approved.')}</div></div>
  </div>`;
}

// ----- Public -----
function publicView() {
  const pub = data.knowledge.entries.filter((e) => e.tier === 'public');
  const posts = S.drafts.filter((d) => d.kind === 'post' && d.status === 'approved').reverse();
  return `<div class="site-hero"><h1>Homes built properly, explained plainly.</h1><p>${esc(pub.find((e) => e.id === 'KB-PUBLIC-SERVICES')?.text || '')}</p></div>
  <div class="two">
    <div class="card chatcard"><div class="head"><h2>Ask us anything</h2><p class="small muted">Content agent · public-approved knowledge only</p></div>
      <div class="thread">${threadHtml('public', 'Ask about our builds, how long they take, or how we work.')}</div>
      ${quick(['How long does a build take?', 'Do you do knock-down rebuilds?', 'What margin do you charge?'], 'public')}
      ${composer('public', 'Your question…')}
    </div>
    <div class="card"><h2 style="font-size:17px">From the site</h2>
      ${posts.map((d) => `<article class="kbentry">${d.img ? `<img class="photo-thumb" src="${d.img}" alt="Site photo">` : ''}<div>${esc(d.body)}</div></article>`).join('') || '<p class="empty small">Posts appear here once the founder approves them. Send a site photo to create one.</p>'}
    </div>
  </div>`;
}

// ---------- Events ----------
const view = $('#view');
view.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return undefined;
  if (b.dataset.tab) { ui.tab = b.dataset.tab; return render(); }
  if (b.dataset.filter) { ui.filter = b.dataset.filter; return render(); }
  if (b.dataset.cite) { ui.openSrc = ui.openSrc?.c === b.dataset.cite && ui.openSrc?.d === b.dataset.d ? null : { c: b.dataset.cite, d: b.dataset.d }; return render(); }
  if (b.dataset.quick) {
    const target = b.dataset.quick;
    send(target, b.dataset.text, { channel: target === 'public' ? 'web' : target === 'client-elm' ? 'whatsapp' : 'sms' });
    return undefined;
  }
  if (b.dataset.fill) {
    const [s, t] = OFFICE_PRESETS[ui.officePerson][+b.dataset.fill];
    const f = b.closest('form'); f.subject.value = s; f.text.value = t; f.text.focus();
    return undefined;
  }
  const id = b.dataset.d;
  const tierOf = () => view.querySelector(`[data-ruletier="${id}"]`)?.value;
  switch (b.dataset.act) {
    case 'approve': return apply(id, 'approved', undefined, tierOf());
    case 'reject': return apply(id, 'rejected');
    case 'edit': ui.editing = id; render(); return view.querySelector(`#ta-${id}`)?.focus();
    case 'cancel': ui.editing = null; return render();
    case 'save': {
      const text = view.querySelector(`#ta-${id}`).value;
      const d = S.drafts.find((x) => x.id === id);
      if (d.kind === 'gap' && /^\s*\[founder:/i.test(text)) { toast('Write the answer first'); return undefined; }
      return apply(id, 'approved', text, tierOf());
    }
    case 'toggleHandled': ui.showHandled = !ui.showHandled; return render();
    case 'cancelPhoto': ui.photo = null; return render();
    case 'samplePhoto': ui.photo = { img: null }; return render();
    default: return undefined;
  }
});

view.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const form = f.dataset.form;
  if (form === 'photo') {
    const preset = P['photo-presets'].presets.find((p) => p.id === f.preset.value);
    const vision = { ...preset, projectHint: f.job.value };
    const img = ui.photo.img;
    ui.photo = null;
    send(ui.sitePerson, 'Photo', { channel: 'camera', attachment: 'site photo', vision, img });
    return;
  }
  const text = f.text.value.trim();
  if (!text) return;
  const from = { founder: 'founder', site: ui.sitePerson, client: 'client-elm', office: ui.officePerson, public: 'public' }[form];
  send(from, text, { channel: { site: 'sms', client: 'whatsapp', office: 'email', public: 'web', founder: 'app' }[form], subject: f.subject?.value || undefined });
  view.querySelector(`[data-form="${form}"] input[type=text], [data-form="${form}"] textarea`)?.focus();
});

view.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.id === 'autoAnswer') { S.policy.autoAnswer = t.checked; save(); toast(t.checked ? 'Agents may send answers that quote approved knowledge' : 'Every reply now comes to you first'); return; }
  if (t.dataset.person === 'site') { ui.sitePerson = t.value; ui.photo = null; render(); return; }
  if (t.dataset.person === 'office') { ui.officePerson = t.value; render(); return; }
  if (t.matches('[data-photo]') && t.files[0]) {
    ui.photo = { img: await downscale(t.files[0]).catch(() => null) };
    render();
  }
});

function downscale(file, max = 320) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = reject;
    img.src = url;
  });
}

document.querySelector('.roles').addEventListener('click', (e) => {
  const b = e.target.closest('[data-role]');
  if (!b) return;
  S.role = b.dataset.role; ui.editing = null; ui.photo = null; save(); render();
  $('#view').focus({ preventScroll: true });
});

function resetAll() {
  S = blank(); rebuildData(); queue.length = 0;
  map = createMap($('#agentMap'), {});
  ui.photo = null; ui.editing = null; ui.tab = 'queue'; ui.filter = 'all'; ui.showHandled = false;
  save(); renderTrace(); render();
}
$('#resetBtn').addEventListener('click', () => { resetAll(); toast('Demo reset'); });

$('#demoBtn').addEventListener('click', () => {
  resetAll();
  S.role = 'founder'; render();
  const btn = $('#demoBtn'); btn.disabled = true; btn.textContent = 'Playing…';
  const gap = reduceMotion() ? 300 : 3600;
  P.inbox.items.forEach((it, i) => setTimeout(() => {
    send(it.from, it.transcript, { channel: it.channel, subject: it.subject, attachment: it.attachment, vision: it.simulatedVision });
    if (i === P.inbox.items.length - 1) setTimeout(() => { btn.disabled = false; btn.textContent = 'Play demo morning'; }, gap);
  }, i * gap));
});

let tt;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3400);
}

// ---------- Start ----------
(async function start() {
  try {
    const parts = await Promise.all(FILES.map((f) => fetch(`data/${f}.json`).then((r) => { if (!r.ok) throw new Error(`${f}.json ${r.status}`); return r.json(); })));
    P = Object.fromEntries(FILES.map((f, i) => [f, parts[i]]));
  } catch (err) {
    $('#view').innerHTML = `<div class="card">Could not load the demo data (${esc(err.message)}). Serve this folder over HTTP, for example with <code>npm start</code>.</div>`;
    return;
  }
  S = restore();
  rebuildData();
  map = createMap($('#agentMap'), S.counts);
  renderTrace();
  render();
}());
