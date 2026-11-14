import { orchestrate, DEFAULT_POLICY } from './src/agents.js';
import { decide, captureOverride, makeRule, resetDraftSeq, identify } from './src/engine.js';
import { createMap } from './src/map.js';
import { CREW, portrait, mascot } from './src/crew.js';

const FILES = ['business', 'knowledge', 'inbox', 'agents', 'assumptions', 'photo-presets'];
const KEY = 'founder-intelligence-app-v1';
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const now = () => new Date().toTimeString().slice(0, 5);
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const STEP_MS = 380;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Plain words for the three access tiers
const SEEN_BY = { internal: 'Office only', 'customer-safe': 'Crew and clients', public: 'Everyone' };
const crewName = (id) => CREW[id]?.name || (id === 'founder' ? 'You' : id);

// Who people are, in plain words
const PEOPLE = {
  'framer-01': 'Framing carpenter', 'supervisor-01': 'Site supervisor', 'bookkeeper-01': 'Bookkeeper', 'admin-01': 'Office admin',
  'client-elm': 'Homeowner, Elm Ridge', public: 'Website visitor', founder: 'You', 'certifier-01': 'The certifier',
};
const personName = (id) => PEOPLE[id] || id;

const ICON = {
  camera: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l16-8-6 16-3-7z"/></svg>',
};

let P;      // pristine data, never changed
let S;      // saved app state
let data;   // working data: pristine plus learned knowledge
let map;
let pics = {};
let digger = { say() {}, dance() {}, setSound() {} };
const ui = { tab: 'todo', editing: null, sitePerson: 'framer-01', officePerson: 'bookkeeper-01', photo: null, showDone: false };

function ava(id, cls = '') {
  const src = pics[id];
  return src ? `<img class="ava ${cls}" src="${src}" alt="">` : `<span class="ava ${cls}" aria-hidden="true">${esc(crewName(id)[0])}</span>`;
}
const personAva = (id) => `<span class="pav pav-${esc(identify(id, P.business).role)}" aria-hidden="true">${esc(personName(id)[0])}</span>`;

// ---------- State ----------
function blank() {
  return { v: 1, role: 'founder', kbAdded: [], drafts: [], threads: {}, trace: [], counts: {}, policy: { ...DEFAULT_POLICY }, seq: { msg: 0, draft: 0, rule: 0 }, stats: { withheld: 0 }, guideDone: false };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable */ } }
function restore() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s?.v === 1) return { ...blank(), ...s }; } catch { /* ignore */ }
  return blank();
}
function rebuildData() {
  data = { ...structuredClone(P), knowledge: { ...P.knowledge, entries: [...P.knowledge.entries, ...S.kbAdded] } };
}
const thread = (id) => (S.threads[id] ||= []);
const entry = (id) => data.knowledge.entries.find((e) => e.id === id);

// ---------- The agent map and its step list ----------
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
function plainStep(s) {
  const n = crewName(s.agent);
  if (s.action === 'sent') return 'New message arrived';
  if (s.agent === 'capture') return 'Lyra read it';
  if (s.action === 'identified sender') return 'Digger checked who’s asking and what they may see';
  if (s.action === 'classified') return 'Digger worked out what it’s about';
  if (s.action === 'bound job') return 'Bower found the job';
  if (s.action.startsWith('tool:')) return 'Bower looked it up, only in what this person may see';
  if (s.action === 'conflict') return 'Bower spotted a clash with the drawings';
  if (s.action === 'escalated') return 'Digger flagged it for you';
  if (s.action === 'handoff') return `Bower handed it to ${crewName(s.to)}`;
  if (s.action === 'drafted') return `${n} wrote a reply`;
  if (s.action === 'auto-sent') return `${n} sent it (already approved knowledge)`;
  if (s.action === 'queued for founder') return 'Waiting for you';
  if (s.action === 'approved') return 'You sent it';
  if (s.action === 'rejected') return 'You stopped it';
  if (s.action === 'learned') return 'Saved as something the crew now knows';
  return `${n}: ${s.action}`;
}
function traceLi(s) { return `<li><span class="muted">${esc(s.t)}</span> ${esc(plainStep(s))}</li>`; }
function renderTrace() { $('#trace').innerHTML = S.trace.slice().reverse().map(traceLi).join('') || '<li>Nothing yet. Send a message from any role.</li>'; }

// ---------- Sending a message ----------
function send(fromId, text, extra = {}) {
  S.seq.msg += 1;
  const id = `M-${S.seq.msg}`;
  const item = { id, time: now(), channel: extra.channel || 'chat', from: fromId, subject: extra.subject, transcript: text, attachment: extra.attachment, simulatedVision: extra.vision };
  thread(fromId).push({ who: 'me', text, img: extra.img, t: now() });

  resetDraftSeq(S.seq.draft);
  const out = orchestrate(item, data, { policy: S.policy, clock: now });
  S.seq.draft += out.drafts.length;
  out.drafts.forEach((d) => S.drafts.push({ ...d, from: fromId, question: text, img: extra.img, channel0: item.channel, t: now() }));
  S.stats.withheld += out.route.retrieval.withheld.length;
  digger.say(introLine(out));

  const delay = reduceMotion() ? 200 : out.steps.length * STEP_MS + 200;
  setTimeout(() => {
    out.drafts.filter((d) => d.status === 'auto-sent').forEach((d) => deliver(d, 'auto'));
    const answeredNow = out.drafts.some((d) => d.status === 'auto-sent' && d.toId === fromId);
    const pending = out.drafts.filter((d) => d.status === 'pending');
    if (!answeredNow && pending.length) thread(fromId).push({ who: 'wait', text: waitText(out, pending), t: now() });
    if (answeredNow) digger.say(`Sorted! ${crewName(out.route.agent)} answered from what we already know.`, { dance: true });
    else digger.say(outroLine(out, pending));
    save(); render();
  }, delay);

  enqueue(out.steps);
  save(); render();
}

function introLine(out) {
  const r = out.route;
  if (r.intent === 'site-photo') return 'Nice snap! Let’s see what we can do with it.';
  if (r.intent === 'scope-change') return 'A change to the job? That one’s for the boss.';
  if (r.best.outcome === 'withheld') return 'Hmm, that’s not for sharing. Checking who’s asking…';
  if (r.intent === 'knowledge-update') return 'New info from site! Bower, take a look.';
  return `On it. ${crewName(r.agent)} has this one.`;
}
function outroLine(out, pending) {
  const r = out.route;
  if (pending.some((d) => d.kind === 'gap')) return 'Nobody’s answered that before. I’ve asked the boss, and we’ll remember.';
  if (r.intent === 'site-photo') return r.escalate ? 'Too dark to read that one. Boss will have a look.' : `One photo, ${pending.length} jobs. Ready for the boss.`;
  if (r.conflicts.length) return 'Hang on, that doesn’t match the drawings. Boss will check it first.';
  if (r.best.outcome === 'withheld') return 'Pricing stays in the office. Passed it to the boss.';
  if (r.intent === 'knowledge-update') return 'Good tip. The boss just needs to OK it.';
  if (r.intent === 'invoice-coding') return 'Money always goes past the boss. Reply’s ready for them.';
  return 'Reply’s ready. The boss will give it a quick look.';
}
function waitText(out, pending) {
  if (pending.some((d) => d.kind === 'gap')) return 'Nobody’s answered that before, so I’ve asked the founder. Next time I’ll know.';
  if (out.route.best.outcome === 'withheld' && out.route.intent !== 'site-photo') return 'That’s private, so I’ve passed your question to the founder.';
  if (out.route.intent === 'scope-change') return 'Changes to the job go to the founder. You’ll get it in writing before anything starts.';
  if (out.route.intent === 'site-photo') return out.route.escalate ? 'I can’t make that photo out. The founder will take a look.' : 'Got it, thanks. The founder will check what I’ve made from it.';
  if (out.route.intent === 'knowledge-update') return 'Thanks! The founder will OK it, then the whole crew will know.';
  if (out.route.conflicts.length) return 'That doesn’t match the drawings, so the founder is checking before I reply.';
  return 'Got it. The founder will check my reply and send it shortly.';
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
      rule = makeRule(draft.body, { id: nextRuleId(), tier: ruleTier || draft.ruleTier || 'internal', source: `Tip from ${personName(draft.from)}, approved by the founder` });
    } else if (draft.edited) {
      rule = captureOverride(draft.originalBody, draft.body, { id: nextRuleId(), tier: ruleTier || draft.ruleTier || 'internal', draftId: draft.id, question: draft.question });
    }
    if (rule) {
      S.kbAdded.push(rule);
      rebuildData();
      steps.push({ t: now(), itemId: draft.itemId, agent: 'founder', action: 'learned', detail: rule.id, to: 'kb' });
    }
    deliver(draft, 'founder');
  }
  ui.editing = null;
  enqueue(steps);
  if (decision === 'rejected') digger.say('No worries, binned it.');
  else if (rule) digger.say('Learned something new! Next time we won’t need to ask you.', { dance: true });
  else digger.say(pick(['Ripper. Sent!', 'Done and dusted.', 'Bonza, that’s gone out.']));
  save(); render();
  toast(decision === 'rejected' ? 'Not sent' : rule ? 'Sent, and the crew will remember it' : 'Sent');
}

// ---------- Plain reasons a draft is waiting ----------
function reasonFor(d) {
  if (d.kind === 'gap') return { short: 'Nobody’s answered this before', long: 'There’s nothing in what the crew knows yet. Write the answer once and they’ll use it from now on.' };
  if (d.kind === 'knowledge') return { short: 'New tip for the crew', long: 'Someone on the team shared something new. Add it and the crew will use it in their answers.' };
  if (d.kind === 'post') return { short: 'Goes public', long: 'Anything posted publicly needs your sign-off first.' };
  if (d.kind === 'variation') return { short: 'Change to the job', long: 'Changes to the agreed work need a written variation, priced, before anything starts.' };
  if (d.kind === 'record' && /claim/i.test(d.title)) return { short: 'For the bank claim', long: 'Evidence for a lender progress claim. You file it.' };
  if (d.kind === 'record') return { short: 'Money', long: 'Anything that codes or moves money needs your OK.' };
  if (d.flags?.some((f) => f.startsWith('Conflict'))) return { short: 'Doesn’t match the drawings', long: `${d.flags.find((f) => f.startsWith('Conflict')).replace(/\(KB-.*\)/, '').trim()}. Check the reply before it goes.` };
  if (/access tier|restricted/i.test(`${d.escalateReason} ${d.title}`)) return { short: 'Asks about something private', long: 'The best answer is something this person isn’t allowed to see, such as pricing. Reply yourself or decline.' };
  if (/scope/i.test(d.escalateReason || '')) return { short: 'Change to the job', long: 'Changes to the agreed work always come to you.' };
  if (d.toId === 'certifier-01') return { short: 'Goes to the certifier', long: 'Anything sent to the certifier needs your OK.' };
  if (/Confidence/.test(d.escalateReason || '')) return { short: 'Not sure about this one', long: 'The crew isn’t confident enough to send this on their own.' };
  return { short: 'Quick check', long: 'This kind of reply gets a quick look from you before it goes.' };
}
function sendLabel(d) {
  return { knowledge: 'Add it', post: 'Post it', record: 'File it', variation: 'Save variation' }[d.kind] || 'Send';
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
    if (m.who === 'wait') return `<div class="msg wait">${ava('router')}<div><div class="who-line">Digger</div>${esc(m.text)}</div></div>`;
    const from = (m.cites || []).map((c) => entry(c)?.title?.replace(/^Founder rule: /, '')).filter(Boolean)[0];
    const how = m.how === 'auto' ? `Answered by ${crewName(m.agent)}` : 'Checked by the founder';
    return `<div class="msg bot">${ava(m.agent)}<div><div class="who-line">${esc(crewName(m.agent))}</div>${esc(m.text)}<div class="meta"><span class="badge ${m.how === 'auto' ? 'b-auto' : 'b-ok'}">${how}</span>${from ? `<span>From: ${esc(from)}</span>` : ''}</div></div></div>`;
  }).join('');
}

function composer(form, placeholder, { photo = false } = {}) {
  return `<form class="composer" data-form="${form}">
    ${photo ? `<button type="button" class="iconbtn" data-act="openPhoto" aria-label="Send a photo" title="Send a photo">${ICON.camera}</button>` : ''}
    <label class="sr" for="in-${form}">Message</label>
    <input id="in-${form}" type="text" name="text" autocomplete="off" placeholder="${esc(placeholder)}">
    <button class="sendbtn" type="submit" aria-label="Send">${ICON.send}</button>
  </form>`;
}
function suggestions(list, target, label = 'Try asking') {
  return `<div class="suggest"><span class="suggest-label">${label}</span>${list.map((q) => `<button type="button" class="chip" data-quick="${esc(target)}" data-text="${esc(q)}">${esc(q)}</button>`).join('')}</div>`;
}

// ----- Founder -----
function founderView() {
  const pending = S.drafts.filter((d) => d.status === 'pending');
  const auto = S.drafts.filter((d) => d.status === 'auto-sent').length;
  const tab = (id, label, n) => `<button class="tab" role="tab" aria-selected="${ui.tab === id}" data-tab="${id}">${label}${n ? ` <span class="count-pill">${n}</span>` : ''}</button>`;
  const body = { todo: todoTab, know: knowTab, settings: settingsTab }[ui.tab]();
  const guide = !S.guideDone ? `<section class="guide" aria-label="Start here">
      <div class="guide-head"><h2>Start here</h2><button class="linkbtn" data-act="hideGuide">Hide</button></div>
      <ol>
        <li><span class="num">1</span><div><b>Play the 7 am rush.</b> Five messages hit the crew at once.<br><button class="btn btn-accent btn-sm" data-act="demo">Play it</button></div></li>
        <li><span class="num">2</span><div><b>Check what the crew wrote.</b> Send it, change it, or don’t send it. Change a reply and the crew remembers.</div></li>
        <li><span class="num">3</span><div><b>Be the site crew.</b> Ask Roo a question and watch the crew answer.<br><button class="btn btn-line btn-sm" data-act="goSite">Ask as site crew</button></div></li>
      </ol>
    </section>` : '';
  return `
  <div class="hello"><div><h1>Good morning</h1><p>Your crew answers what they already know. Here’s what needs you.</p></div></div>
  ${guide}
  <div class="kpis">
    <div class="kpi k-you"><div class="v">${pending.length}</div><div class="l">need you</div></div>
    <div class="kpi k-auto"><div class="v">${auto}</div><div class="l">answered by the crew</div></div>
    <div class="kpi k-rule"><div class="v">${S.kbAdded.length}</div><div class="l">new things learned</div></div>
  </div>
  <div class="card">
    <div class="tabs" role="tablist">${tab('todo', 'Needs you', pending.length)}${tab('know', 'What the crew knows')}${tab('settings', 'Crew and settings')}</div>
    ${body}
  </div>`;
}

function todoTab() {
  const groups = new Map();
  S.drafts.filter((d) => d.status === 'pending').forEach((d) => { if (!groups.has(d.itemId)) groups.set(d.itemId, []); groups.get(d.itemId).push(d); });
  const cards = [...groups.values()].sort((a, b) => Number(b.some((d) => d.escalated)) - Number(a.some((d) => d.escalated))).map(todoCard).join('');
  const done = S.drafts.filter((d) => d.status === 'approved' || d.status === 'rejected').reverse();
  return `${cards || `<div class="allclear"><b>All clear.</b> Nothing needs you right now.${S.drafts.length ? '' : ' Press <b>Play the 7 am rush</b> to start.'}</div>`}
    ${done.length ? `<button class="linkbtn" data-act="toggleDone" aria-expanded="${ui.showDone}">${ui.showDone ? 'Hide' : 'Show'} what you’ve done (${done.length})</button>
      ${ui.showDone ? `<ul class="donelist">${done.map((d) => `<li>${d.status === 'approved' ? '<span class="badge b-ok">Sent</span>' : '<span class="badge b-bad">Not sent</span>'} ${esc(d.title.replace(/^Answer: /, ''))} <span class="muted">to ${esc(d.to)}</span></li>`).join('')}</ul>` : ''}` : ''}`;
}

function todoCard(ds) {
  const first = ds[0];
  const isPhoto = first.img || first.question === 'Photo' || first.question?.startsWith('[Unlabelled');
  return `<article class="todo">
    <div class="todo-head">${personAva(first.from)}<div><b>${esc(personName(first.from))}</b> <span class="muted">${isPhoto ? 'sent a photo' : 'asked'} · ${esc(first.t || '')}</span></div></div>
    ${first.img ? `<img class="photo-thumb" src="${first.img}" alt="Site photo">` : ''}
    ${!isPhoto && first.question ? `<blockquote>${esc(first.question)}</blockquote>` : ''}
    ${isPhoto && !first.img ? '<div class="photo-ph">Site photo</div>' : ''}
    ${ds.length > 1 ? `<p class="small muted">The crew made ${ds.length} things from this:</p>` : ''}
    ${ds.map(replyBlock).join('')}
  </article>`;
}

function replyBlock(d) {
  const r = reasonFor(d);
  const editing = ui.editing === d.id;
  const sources = d.citations.map(entry).filter(Boolean);
  const toLine = d.toId === d.from ? '' : ` for ${d.to === 'Founder (sign-off)' ? 'your socials' : d.to === 'Founder' ? 'you' : d.to}`;
  const tierSel = `<label class="rememb">Remember this for
      <select data-ruletier="${d.id}">${['internal', 'customer-safe', 'public'].map((t) => `<option value="${t}" ${t === (d.ruleTier || 'internal') ? 'selected' : ''}>${SEEN_BY[t]}</option>`).join('')}</select></label>`;
  return `<div class="reply ${d.escalated ? 'flag' : ''}">
    <div class="reply-head">${ava(d.agent)}<span><b>${esc(crewName(d.agent))}</b> ${d.kind === 'gap' ? 'needs your answer' : `wrote this${esc(toLine)}`}</span><span class="reason">${esc(r.short)}</span></div>
    ${editing
      ? `<label class="sr" for="ta-${d.id}">Your version</label><textarea id="ta-${d.id}" placeholder="Type the answer">${d.kind === 'gap' ? '' : esc(d.body)}</textarea>`
      : d.kind === 'gap' ? '' : `<div class="reply-body">${esc(d.kind === 'variation' ? d.body.split('\n').slice(1).join('\n') : d.body)}</div>`}
    <div class="acts">
      ${editing
        ? `<button class="btn btn-ok btn-sm" data-act="save" data-d="${d.id}">${d.kind === 'gap' ? 'Send answer' : 'Send my version'}</button><button class="btn btn-line btn-sm" data-act="cancel">Cancel</button>${tierSel}`
        : d.kind === 'gap'
          ? `<button class="btn btn-ok btn-sm" data-act="edit" data-d="${d.id}">Answer it</button><button class="btn btn-quiet2 btn-sm" data-act="reject" data-d="${d.id}">Skip</button>`
          : `<button class="btn btn-ok btn-sm" data-act="approve" data-d="${d.id}">${sendLabel(d)}</button><button class="btn btn-line btn-sm" data-act="edit" data-d="${d.id}">Change</button><button class="btn btn-quiet2 btn-sm" data-act="reject" data-d="${d.id}">Don’t send</button>${d.kind === 'knowledge' ? tierSel : ''}`}
    </div>
    <details class="why"><summary>Why is this here?</summary>
      <p>${esc(r.long)}</p>
      ${sources.length ? `<p><b>Based on:</b> ${sources.map((e) => esc(e.title.replace(/^Founder rule: /, ''))).join('; ')}</p>` : ''}
      <p><b>Who would see it:</b> ${esc(SEEN_BY[d.tier] || d.tier)}${d.toId && d.toId !== d.from ? ` · goes to ${esc(d.to)}` : ''}</p>
    </details>
  </div>`;
}

function knowTab() {
  const added = new Set(S.kbAdded.map((e) => e.id));
  const blurb = { internal: 'Founder, office and bookkeeper', 'customer-safe': 'Plus the crew, homeowners and certifier, for their own jobs', public: 'Anyone, including the website' };
  return `<p class="muted small">Everything the crew answers from. Each thing has an owner and a review date. The crew only ever uses what the asker is allowed to see.</p>
  <div class="kbgrid">${['internal', 'customer-safe', 'public'].map((t) => `<section class="kbtier"><h3>${esc(SEEN_BY[t])} <span class="small muted">· ${blurb[t]}</span></h3>
    ${data.knowledge.entries.filter((e) => e.tier === t).map((e) => `<div class="kbentry ${added.has(e.id) ? 'new' : ''}"><b>${esc(e.title.replace(/^Founder rule: /, ''))}</b> ${added.has(e.id) ? '<span class="badge b-ok">New</span>' : ''}<div>${esc(e.text)}</div><div class="src">${esc(e.source)} · review by ${esc(e.reviewDate)}</div></div>`).join('')}</section>`).join('')}</div>`;
}

function settingsTab() {
  const counts = map.counts();
  const blurb = { router: 'Checks who’s asking and what they’re allowed to see. Sends the tricky ones to you.', capture: 'Listens to voice notes, reads photos and messages.', curator: 'Finds the job, looks things up, spots clashes with the drawings, suggests new knowledge.', teamwork: 'Answers the site crew from the drawings and standards.', commercial: 'Homeowners, claims, invoices and variations.', content: 'Answers the public and writes posts in your voice.' };
  return `<div class="policy">
      <span class="switch"><input type="checkbox" id="autoAnswer" ${S.policy.autoAnswer ? 'checked' : ''}><span></span></span>
      <label for="autoAnswer"><b>Let the crew answer on their own</b><br><span class="small">Only when the answer is already in what the crew knows and the person is allowed to see it. Everything else still comes to you.</span></label>
    </div>
    <div class="crewgrid">${data.agents.agents.map((a) => `<div class="crewcard">${ava(a.id, 'lg')}<div><b>${esc(crewName(a.id))}</b> <span class="muted small">the ${esc(CREW[a.id]?.species || '')}${counts[a.id] ? ` · ${counts[a.id]} handled` : ''}</span><div class="small">${esc(blurb[a.id] || a.purpose)}</div></div></div>`).join('')}</div>
    <details class="why" style="margin-top:14px"><summary>Full log of every step</summary>
      ${S.trace.length ? `<ol class="audit">${S.trace.slice().reverse().map((s) => `<li><span class="muted">${esc(s.t)}</span> ${esc(plainStep(s))} <span class="muted">· ${esc(s.detail)}</span></li>`).join('')}</ol>` : '<p class="muted">Nothing logged yet.</p>'}
    </details>`;
}

// ----- Site crew -----
function siteView() {
  const id = ui.sitePerson;
  const isSup = id === 'supervisor-01';
  const chips = isSup
    ? ['FYI from now on all wet areas get a flood test before screed', 'What does the waterproofing standard need?']
    : ['What insulation goes in the party wall?', 'Are we doing studs at 600 on the party wall?', 'What’s our framing markup?', 'Which nails for the decking?'];
  return `<div class="hello"><div><h1>On site</h1><p>Ask Roo anything about the job. Send a photo with the camera button.</p></div>
    <label class="who-pick">You are <select data-person="site"><option value="framer-01" ${!isSup ? 'selected' : ''}>Framing carpenter</option><option value="supervisor-01" ${isSup ? 'selected' : ''}>Site supervisor</option></select></label></div>
  <div class="phone-wrap">
    <div class="phone">
      <div class="phone-head"><div class="who">${ava('teamwork', 'md')}<div><div class="t">Roo</div><div class="s">Knows the drawings for your jobs</div></div></div></div>
      <div class="thread">${threadHtml(id, 'Hi, I’m Roo. Ask me about the drawings or standards for your job.')}</div>
      ${ui.photo ? photoPanel(identify(id, P.business)) : ''}
      ${suggestions(chips, id)}
      ${composer('site', 'Ask Roo…', { photo: true })}
    </div>
  </div>`;
}

function photoPanel(who) {
  const presets = P['photo-presets'].presets;
  const jobs = who.projects.map((j) => P.business.projects.find((p) => p.id === j));
  return `<form class="photo-panel" data-form="photo">
    ${ui.photo.img ? `<img class="photo-thumb" src="${ui.photo.img}" alt="Selected photo" style="max-width:110px">` : `<label class="small">Add your own photo (optional) <input type="file" accept="image/*" data-photo></label>`}
    <fieldset><legend>What’s in the photo?</legend>
      ${presets.map((p, i) => `<label><input type="radio" name="preset" value="${p.id}" ${i === 0 ? 'checked' : ''}> ${esc(p.label)}</label>`).join('')}
    </fieldset>
    <label>Job <select name="job">${jobs.map((j) => `<option value="${j.id}">${esc(j.name.replace(' (fictional)', ''))}</option>`).join('')}</select></label>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-primary btn-sm" type="submit">Send photo</button><button class="btn btn-line btn-sm" type="button" data-act="cancelPhoto">Cancel</button></div>
  </form>`;
}

// ----- Homeowner -----
function clientView() {
  const id = 'client-elm';
  const proj = P.business.projects.find((p) => p.id === 'JOB-24-ELM');
  const at = proj.lenderStages.indexOf(proj.stage);
  return `<div class="portal-hero"><h1>Your new home</h1><p>${esc(proj.name.replace(' (fictional)', ''))}</p>
    <div class="stages" role="list" aria-label="Build stages">${proj.lenderStages.map((s, i) => `<div role="listitem" class="stage ${i < at ? 'done' : i === at ? 'now' : ''}"><div class="bar2"></div>${esc(s)}${i === at ? ' · now' : ''}</div>`).join('')}</div></div>
  <div class="card chatcard">
    <div class="head who">${ava('commercial', 'md')}<div><h2>Tally</h2><p class="small muted">Your project assistant</p></div></div>
    <div class="thread">${threadHtml(id, 'Hi, I’m Tally. Ask about progress or payments, or ask for a change.')}</div>
    ${suggestions(['What’s outstanding on the frame claim?', 'Can we widen the kitchen opening to 3.6m?', 'What’s your markup on framing?'], id)}
    ${composer('client', 'Message your builder…')}
  </div>`;
}

// ----- Office -----
const OFFICE = {
  'bookkeeper-01': ['Which job and cost code for Harbour Readymix concrete docket HR-8821, $14,250?', 'FYI from now on every supplier invoice needs a PO number before it is paid.'],
  'admin-01': ['What’s outstanding on the Elm Ridge frame progress claim?', 'What is our variation rule?'],
};
function officeView() {
  const id = ui.officePerson;
  return `<div class="hello"><div><h1>Office</h1><p>Invoices, claims and admin go to Tally.</p></div>
    <label class="who-pick">You are <select data-person="office"><option value="bookkeeper-01" ${id === 'bookkeeper-01' ? 'selected' : ''}>Bookkeeper</option><option value="admin-01" ${id === 'admin-01' ? 'selected' : ''}>Office admin</option></select></label></div>
  <div class="card chatcard">
    <div class="head who">${ava('commercial', 'md')}<div><h2>Tally</h2><p class="small muted">Claims, invoices and coding</p></div></div>
    <div class="thread">${threadHtml(id, 'Hi, I’m Tally. Ask me about a claim or an invoice.')}</div>
    ${suggestions(OFFICE[id], id)}
    ${composer('office', 'Message Tally…')}
  </div>`;
}

// ----- Public -----
function publicView() {
  const posts = S.drafts.filter((d) => d.kind === 'post' && d.status === 'approved').reverse();
  return `<div class="site-hero"><h1>Homes built properly, explained plainly.</h1><p>${esc(entry('KB-PUBLIC-SERVICES')?.text || '')}</p></div>
  <div class="two">
    <div class="card chatcard">
      <div class="head who">${ava('content', 'md')}<div><h2>Kooka</h2><p class="small muted">Ask us anything</p></div></div>
      <div class="thread">${threadHtml('public', 'Hi, I’m Kooka. Ask how we build.')}</div>
      ${suggestions(['How long does a build take?', 'Do you do knock-down rebuilds?', 'What margin do you charge?'], 'public')}
      ${composer('public', 'Your question…')}
    </div>
    ${posts.length ? `<div class="card"><h2 style="font-size:17px">From the site</h2>${posts.map((d) => `<article class="kbentry">${d.img ? `<img class="photo-thumb" src="${d.img}" alt="Site photo">` : ''}<div>${esc(d.body)}</div></article>`).join('')}</div>` : ''}
  </div>`;
}

// ---------- Events ----------
const view = $('#view');
view.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return undefined;
  if (b.dataset.tab) { ui.tab = b.dataset.tab; ui.editing = null; return render(); }
  if (b.dataset.quick) {
    const target = b.dataset.quick;
    const channel = { public: 'web', 'client-elm': 'whatsapp', 'bookkeeper-01': 'email', 'admin-01': 'email' }[target] || 'sms';
    send(target, b.dataset.text, { channel });
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
      const text = view.querySelector(`#ta-${id}`).value.trim();
      if (!text) { toast('Type your answer first'); return undefined; }
      return apply(id, 'approved', text, tierOf());
    }
    case 'toggleDone': ui.showDone = !ui.showDone; return render();
    case 'cancelPhoto': ui.photo = null; return render();
    case 'openPhoto': ui.photo = { img: null }; return render();
    case 'hideGuide': S.guideDone = true; save(); return render();
    case 'demo': return playDemo();
    case 'goSite': S.role = 'site'; save(); return render();
    default: return undefined;
  }
});

view.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const form = f.dataset.form;
  if (form === 'photo') {
    const preset = P['photo-presets'].presets.find((p) => p.id === f.preset.value);
    const img = ui.photo.img;
    ui.photo = null;
    send(ui.sitePerson, 'Photo', { channel: 'camera', attachment: 'site photo', vision: { ...preset, projectHint: f.job.value }, img });
    return;
  }
  const text = f.text.value.trim();
  if (!text) return;
  const from = { site: ui.sitePerson, client: 'client-elm', office: ui.officePerson, public: 'public' }[form];
  send(from, text, { channel: { site: 'sms', client: 'whatsapp', office: 'email', public: 'web' }[form] });
  view.querySelector(`[data-form="${form}"] input[type=text]`)?.focus();
});

view.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.id === 'autoAnswer') { S.policy.autoAnswer = t.checked; save(); toast(t.checked ? 'The crew can answer on their own' : 'Every reply now comes to you first'); return; }
  if (t.dataset.person === 'site') { ui.sitePerson = t.value; ui.photo = null; render(); return; }
  if (t.dataset.person === 'office') { ui.officePerson = t.value; render(); return; }
  if (t.matches('[data-photo]')) {
    ui.photo = { img: t.files[0] ? await downscale(t.files[0]).catch(() => null) : null };
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
  map = createMap($('#agentMap'), {}, pics);
  Object.assign(ui, { photo: null, editing: null, tab: 'todo', showDone: false });
  save(); renderTrace(); render();
}
$('#resetBtn').addEventListener('click', () => { resetAll(); toast('Started over'); });

function playDemo() {
  const keepGuide = S.guideDone;
  resetAll();
  S.guideDone = keepGuide;
  S.role = 'founder'; render();
  const btn = $('#demoBtn'); btn.disabled = true; btn.textContent = 'Playing…';
  digger.say('Here comes the 7 am rush. Watch the crew go!', { dance: true });
  const gap = reduceMotion() ? 300 : 3600;
  P.inbox.items.forEach((it, i) => setTimeout(() => {
    send(it.from, it.transcript, { channel: it.channel, subject: it.subject, attachment: it.attachment, vision: it.simulatedVision });
    if (i === P.inbox.items.length - 1) setTimeout(() => { btn.disabled = false; btn.textContent = 'Play the 7 am rush'; digger.say('That’s the rush. Have a look at what needs you.'); }, gap);
  }, i * gap));
}
$('#demoBtn').addEventListener('click', playDemo);

let tt;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600);
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
  pics = Object.fromEntries(Object.keys(CREW).map((id) => [id, portrait(id, 96)]));
  map = createMap($('#agentMap'), S.counts, pics);
  digger = mascot($('#mascot'), $('#bubble'));
  renderTrace();
  render();
  setTimeout(() => digger.say('G’day, I’m Digger, the foreman. My crew answers what they know, and the tricky ones go to the boss.', { dance: true }), 600);
}());

$('#danceBtn').addEventListener('click', () => digger.say(pick(['Hard hats on, dancing boots on!', 'Measure twice, dance once.', 'Safety first, then smoko.', 'Who needs a crane when you’ve got moves?']), { dance: true }));
$('#soundBtn').addEventListener('click', (e) => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', String(on));
  e.currentTarget.textContent = on ? 'Voice on' : 'Voice off';
  digger.setSound(on);
  if (on) digger.say('Righto, I’ll talk you through it.');
});
