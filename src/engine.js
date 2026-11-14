// Founder Intelligence: core engine.
// Pure functions, no network, no model calls. The "AI" steps (speech-to-text,
// vision, drafting) are simulated by data and templates so the governance logic
// (routing, tiers, review gate, feedback loop, audit) can be shown and tested.
// See docs/adr/0002-simulated-ai-steps.md for how a real model slots in.

export const CONFIDENCE_THRESHOLD = 0.9;

// Topics the router never automates (architecture doc, section 5).
const ESCALATION_TERMS = ['widen', 'opening', 'structural', 'beam', 'remove wall', 'move wall', 'dispute', 'variation', 'extra'];

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'at', 'for', 'is', 'are', 'we', 'i', 'it', 'this', 'that', 'what', 'where', 'which', 'how', 'do', 'does', 'can', 'be', 'with', 'like', 'up', 'our', 'you', 'my', 'me', 'hi', 'has', 'have', 'go', 'goes', 'just', 'need', 'know', 'before', 'last', 'job', 'morning']);

export function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\-\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));
}

// ---------- Who is asking ----------

export function identify(personId, business) {
  const person = business.directory.find((p) => p.id === personId);
  if (!person) return { person: null, role: 'public', ...business.roles.public, projects: [] };
  const role = business.roles[person.role] || business.roles.public;
  return { person, role: person.role, access: role.access, projectScoped: role.projectScoped, projects: person.projects || [] };
}

// ---------- Curator: bind to a job ----------

export function bindProject(text, business, hint) {
  const hay = `${text || ''} ${hint || ''}`.toLowerCase();
  return business.projects.find((p) => p.aliases.some((a) => hay.includes(a)) || hay.includes(p.id.toLowerCase())) || null;
}

// ---------- Retrieval with tier enforcement ----------

function canSee(entry, who) {
  if (!who.access.includes(entry.tier)) return { ok: false, reason: `tier: ${entry.tier}` };
  if (entry.project && who.projectScoped && !who.projects.includes(entry.project)) {
    return { ok: false, reason: `project: ${entry.project}` };
  }
  return { ok: true };
}

export function retrieve(query, entries, who, projectId) {
  const q = new Set(tokenize(query));
  const scored = entries
    .map((entry) => {
      const words = new Set([...entry.keywords, ...tokenize(entry.title)]);
      let score = 0;
      q.forEach((t) => { if (words.has(t)) score += 1; });
      if (score > 0 && projectId && entry.project === projectId) score += 1;
      if (score > 0 && projectId && entry.project && entry.project !== projectId) score -= 1;
      return { entry, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const hits = [];
  const withheld = [];
  for (const s of scored) {
    const v = canSee(s.entry, who);
    if (v.ok) hits.push(s);
    else withheld.push({ id: s.entry.id, reason: v.reason, score: s.score });
  }
  return { hits, withheld };
}

// ---------- Router: intent ----------

export function classify(item) {
  const t = (item.transcript || '').toLowerCase();
  if (item.simulatedVision) return 'site-photo';
  if (ESCALATION_TERMS.some((w) => t.includes(w))) return 'scope-change';
  if (/(docket|invoice|unallocated|cost code)/.test(t)) return 'invoice-coding';
  if (/(claim|drawdown|lender|progress)/.test(t)) return 'claim-status';
  if (/(stud|frame|framing|spacing|centres|detail|drawing)/.test(t)) return 'spec-question';
  return 'general';
}

const AGENT_FOR = {
  'spec-question': 'teamwork',
  'invoice-coding': 'commercial',
  'claim-status': 'commercial',
  'site-photo': 'curator',
  'scope-change': 'commercial',
  general: 'teamwork',
};

// ---------- Curator: conflicts with approved documents ----------

export function detectConflicts(text, hits) {
  const asked = (text || '').match(/\b(\d{3})\s*(?:mm)?\b/);
  if (!asked) return [];
  const conflicts = [];
  for (const { entry } of hits) {
    const spec = entry.text.match(/(\d{3})mm centres/);
    if (spec && spec[1] !== asked[1]) {
      conflicts.push({ entryId: entry.id, field: 'stud spacing', asked: `${asked[1]}mm`, approved: `${spec[1]}mm` });
    }
  }
  return conflicts;
}

// ---------- Route one item ----------

export function route(item, data) {
  const who = identify(item.from, data.business);
  const intent = classify(item);
  let project = bindProject(`${item.subject || ''} ${item.transcript || ''}`, data.business, item.simulatedVision?.projectHint);
  const query = `${item.subject || ''} ${item.transcript || ''} ${(item.simulatedVision?.observed || []).join(' ')}`;
  const retrieval = retrieve(query, data.knowledge.entries, who, project?.id);
  // Curator: no job named, so bind through the best matching record (e.g. a docket to its PO).
  if (!project) {
    const viaRecord = retrieval.hits.find((h) => h.entry.project)?.entry.project;
    if (viaRecord) project = data.business.projects.find((p) => p.id === viaRecord) || null;
  }

  let confidence = item.simulatedVision ? item.simulatedVision.confidence : 0.95;
  if (!project) confidence = Math.min(confidence, 0.7);
  if (retrieval.hits.length === 0) confidence = Math.min(confidence, 0.6);

  let escalate = false;
  let escalateReason = '';
  if (intent === 'scope-change') { escalate = true; escalateReason = 'Scope or structural change: always goes to the founder'; }
  else if (confidence < CONFIDENCE_THRESHOLD) { escalate = true; escalateReason = `Confidence ${confidence.toFixed(2)} is below ${CONFIDENCE_THRESHOLD}`; }

  const conflicts = intent === 'spec-question' ? detectConflicts(item.transcript, retrieval.hits) : [];

  return { item, who, intent, agent: AGENT_FOR[intent], project, retrieval, confidence, escalate, escalateReason, conflicts };
}

// ---------- Drafting (templates stand in for a model) ----------

function get(data, id) { return data.knowledge.entries.find((e) => e.id === id); }

// How restricted a tier is. An output may only cite knowledge at its own tier or a more open one,
// so a customer-safe message can never quote internal pricing, even by citation.
export const TIER_RANK = { public: 0, 'customer-safe': 1, internal: 2 };
export function citable(entryTier, outputTier) { return TIER_RANK[entryTier] <= TIER_RANK[outputTier]; }

function cite(data, outputTier, ...ids) {
  return ids.filter(Boolean).filter((id) => {
    const e = get(data, id);
    return e && citable(e.tier, outputTier);
  });
}

let draftSeq = 0;
function mk(r, d) {
  draftSeq += 1;
  return { id: `DR-${String(draftSeq).padStart(2, '0')}`, itemId: r.item.id, status: 'pending', escalated: r.escalate, ...d };
}

export function draft(r, data) {
  const who = r.who.person;
  const p = r.project;
  switch (r.intent) {
    case 'spec-question': {
      const e = r.retrieval.hits[0]?.entry;
      const conflictLine = r.conflicts.length
        ? ` Not ${r.conflicts[0].asked}: the approved schedule says ${r.conflicts[0].approved}.`
        : '';
      return [mk(r, {
        agent: 'teamwork', channel: 'SMS', to: who?.label, tier: 'customer-safe',
        title: `Framing answer, ${p?.name || 'unbound job'}`,
        body: `${e ? e.text : 'No approved detail found.'}${conflictLine} If anything on site differs from the drawing, stop and call the office.`,
        citations: cite(data, 'customer-safe', e?.id),
        flags: r.conflicts.map((c) => `Conflict: asked ${c.asked}, approved ${c.approved} (${c.entryId})`),
      })];
    }
    case 'invoice-coding': {
      const po = r.retrieval.hits.find((h) => h.entry.id.startsWith('KB-PO'))?.entry;
      const code = p?.costCodes?.concrete || (po ? '2100 Substructure – Concrete' : null);
      return [mk(r, {
        agent: 'commercial', channel: 'Email', to: who?.label, tier: 'internal',
        title: 'Code docket HR-8821',
        body: po
          ? `Docket HR-8821 matches ${po.title.replace('Purchase order ', '')} for the Elm Ridge slab. Allocate to job JOB-24-ELM, cost code ${code}. Check the docket volume against the PO's 18 m3 before posting.`
          : 'No matching purchase order found. Founder to confirm the job and cost code.',
        citations: cite(data, 'internal', po?.id),
        flags: ['Amount not checked against PO value (PO holds quantity only)'],
      })];
    }
    case 'claim-status': {
      const reg = get(data, 'KB-CLAIM-ELM');
      return [mk(r, {
        agent: 'commercial', channel: 'Email', to: who?.label, tier: 'customer-safe',
        title: 'Elm Ridge Frame claim: what is outstanding',
        body: `Frame claim needs the certifier's frame inspection certificate and dated photos. Photos: filed (14). Certificate: inspection booked, not yet received. Outstanding item for the lender: the certificate. Suggested reply to lender: claim will be lodged within one business day of the certificate.`,
        citations: cite(data, 'customer-safe', 'KB-STAGES', reg && 'KB-CLAIM-ELM'),
        flags: [],
      })];
    }
    case 'site-photo': {
      const v = r.item.simulatedVision;
      const obs = v.observed.join(', ');
      return [
        mk(r, {
          agent: 'teamwork', channel: 'Email', to: 'Principal certifier (PCA)', tier: 'customer-safe',
          title: `Pre-screed waterproofing record, ${p?.name}`,
          body: `${v.scene}. Observed: ${obs}. Checked against company QA standard 05 (AS 3740). Dated photo attached. Requesting inspection before screed.`,
          citations: cite(data, 'customer-safe', 'KB-WP-STD'), stream: 'Teamwork',
          flags: [`Simulated vision confidence ${v.confidence}`],
        }),
        mk(r, {
          agent: 'commercial', channel: 'Claim file (internal)', to: 'Claim register', tier: 'customer-safe',
          title: `Evidence for ${p?.name} Fixing claim`,
          body: `File photo ${r.item.attachment} as dated evidence for the Fixing stage (wet area waterproofing record). Lodge once the certifier's record is back.`,
          citations: cite(data, 'customer-safe', 'KB-STAGES'), stream: 'Commercial', flags: [],
        }),
        mk(r, {
          agent: 'content', channel: 'LinkedIn / Instagram draft', to: 'Founder (sign-off)', tier: 'public',
          title: 'Post: the tape nobody sees',
          body: 'Before a bathroom gets its tiles, we stop and photograph the bit you will never see: the membrane, the bond-breaker tape where wall meets floor, and the flange at the waste. The tape lets the joint move without tearing the membrane. That small step is why a shower stays dry for decades. #buildingright',
          citations: cite(data, 'public', 'KB-STORY-VOICE', 'KB-WP-STD'),
          stream: 'Brand', flags: ['No address, client or faces (voice guide rule)'],
        }),
      ];
    }
    case 'scope-change': {
      return [
        mk(r, {
          agent: 'commercial', channel: 'WhatsApp', to: who?.label, tier: 'customer-safe',
          title: 'Holding reply to homeowner',
          body: 'Thanks for asking early. Widening the kitchen opening is a structural change, so the engineer needs to check it and we will send you a written variation with the cost and time impact before any work starts. The founder will be in touch today.',
          citations: [], flags: ['Held for founder: structural change'],
        }),
        mk(r, {
          agent: 'commercial', channel: 'Variation register (internal)', to: 'Founder', tier: 'internal',
          title: 'Draft variation V-07: widen kitchen opening to 3.6m',
          body: 'Scope: widen kitchen opening to 3.6m, Elm Ridge. Requires engineer review (lintel and point loads). Cost: [to be priced]. Time: [to be assessed]. Written variation to be signed by the client before work starts.',
          citations: cite(data, 'internal', 'KB-VAR-RULE'), flags: ['Engineer review required', 'Price and time are placeholders'],
        }),
      ];
    }
    default:
      return [mk(r, {
        agent: 'teamwork', channel: 'Reply', to: who?.label, tier: 'customer-safe',
        title: 'General question', body: 'Passed to the founder.', citations: [], flags: [],
      })];
  }
}

// ---------- Morning triage ----------

export function triage(data, clock = () => '07:15') {
  draftSeq = 0;
  const audit = [];
  const results = data.inbox.items.map((item) => {
    const r = route(item, data);
    audit.push({ t: clock(), actor: 'Capture', action: 'captured', detail: `${item.id} via ${item.channel}${item.simulatedVision ? ' (simulated vision)' : ''}` });
    audit.push({ t: clock(), actor: 'Router', action: 'routed', detail: `${item.id}: ${r.who.person?.label || 'unknown'} → ${r.agent}; access [${r.who.access.join(', ')}]; job ${r.project?.id || 'none'}; confidence ${r.confidence.toFixed(2)}` });
    if (r.retrieval.withheld.length) {
      audit.push({ t: clock(), actor: 'Router', action: 'withheld', detail: `${item.id}: ${r.retrieval.withheld.map((w) => `${w.id} (${w.reason})`).join('; ')}` });
    }
    r.conflicts.forEach((c) => audit.push({ t: clock(), actor: 'Curator', action: 'conflict', detail: `${item.id}: ${c.field} asked ${c.asked}, approved ${c.approved}` }));
    if (r.escalate) audit.push({ t: clock(), actor: 'Router', action: 'escalated', detail: `${item.id}: ${r.escalateReason}` });
    const drafts = draft(r, data);
    drafts.forEach((d) => audit.push({ t: clock(), actor: d.agent, action: 'drafted', detail: `${d.id} for ${d.to} [${d.tier}]` }));
    return { ...r, drafts };
  });
  return { results, audit };
}

// ---------- Review gate ----------

export function decide(draftObj, decision, { edited, by = 'Founder', clock = () => '07:20' } = {}) {
  const valid = ['approved', 'rejected'];
  if (!valid.includes(decision)) throw new Error(`Unknown decision: ${decision}`);
  const next = { ...draftObj, status: decision, decidedBy: by };
  if (decision === 'approved' && typeof edited === 'string' && edited.trim() !== draftObj.body.trim()) {
    next.originalBody = draftObj.body;
    next.body = edited;
    next.edited = true;
  }
  const event = { t: clock(), actor: by, action: decision, detail: `${draftObj.id}${next.edited ? ' (edited)' : ''} → ${draftObj.channel}` };
  return { draft: next, event };
}

// ---------- Feedback loop: founder override → SOP candidate ----------

export function captureOverride(original, edited, meta = {}) {
  const sentences = (s) => (s || '').split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter(Boolean);
  const before = new Set(sentences(original));
  const added = sentences(edited).filter((x) => !before.has(x));
  if (!added.length) return null;
  const text = added.join(' ');
  return {
    id: meta.id || `SOP-${Date.now().toString(36)}`,
    tier: 'internal',
    title: `Founder rule: ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}`,
    text,
    keywords: [...new Set(tokenize(text))],
    source: `Founder override on ${meta.draftId || 'a draft'}`,
    owner: 'Founder',
    reviewDate: meta.reviewDate || '2027-05-01',
    status: 'approved-by-founder',
  };
}

// ---------- Ask as anyone (tier test) ----------

export function ask(question, personId, data) {
  const who = identify(personId, data.business);
  const project = bindProject(question, data.business);
  const scopeProject = project || (who.projects.length === 1 ? data.business.projects.find((p) => p.id === who.projects[0]) : null);
  const retrieval = retrieve(question, data.knowledge.entries, who, scopeProject?.id);
  // If the best match is something this person may not see, don't answer from a weaker
  // visible match: that is how a pricing question gets a drawing detail back.
  const bestHit = retrieval.hits[0]?.score || 0;
  const bestWithheld = Math.max(0, ...retrieval.withheld.map((w) => w.score));
  const top = bestHit > bestWithheld ? retrieval.hits[0].entry : null;
  let answer;
  let outcome;
  if (top) {
    answer = top.text;
    outcome = 'answered';
  } else if (retrieval.withheld.length) {
    answer = "That isn't something I can share with you. I've passed your question to the founder.";
    outcome = 'withheld';
  } else {
    answer = "I don't have an approved answer yet. I've logged it as a knowledge gap for the founder.";
    outcome = 'gap';
  }
  return { who, project: scopeProject, retrieval, answer, outcome, citation: top?.id || null };
}
