// Founder Intelligence: core engine.
// Pure functions over JSON data. No network, no model calls.
// The AI steps (speech-to-text, vision, drafting) are simulated by data and
// rule-based templates; the governance (tiers, routing, escalation, review,
// feedback loop, audit) is real. See docs/agents.md and docs/adr/.

export const CONFIDENCE_THRESHOLD = 0.9;
export const TIER_RANK = { public: 0, 'customer-safe': 1, internal: 2 };

// Topics the router never automates.
const ESCALATION_TERMS = ['widen', 'opening', 'structural', 'beam', 'remove wall', 'move wall', 'dispute', 'variation', 'extra over', 'change the'];

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'at', 'for', 'is', 'are', 'we', 'i', 'it', 'this', 'that', 'what', 'where', 'which', 'how', 'do', 'does', 'can', 'be', 'with', 'like', 'up', 'our', 'you', 'my', 'me', 'hi', 'has', 'have', 'go', 'goes', 'just', 'need', 'know', 'before', 'last', 'job', 'morning', 'please', 'thanks', 'there', 'any', 'about', 'from', 'now', 'on', 'fyi', 'note']);

export function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\-\s]/g, ' ')
    .split(/\s+/)
    .flatMap((w) => (w.includes('-') ? [w, ...w.split('-')] : [w]))
    .filter((w) => w && !STOP.has(w));
}

export function citable(entryTier, outputTier) { return TIER_RANK[entryTier] <= TIER_RANK[outputTier]; }
export function mostRestricted(access) { return [...access].sort((a, b) => TIER_RANK[b] - TIER_RANK[a])[0]; }

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

export function canSee(entry, who) {
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

// Best answer: if the strongest match is something this person may not see,
// don't answer from a weaker visible match.
export function bestAnswer(retrieval) {
  const bestHit = retrieval.hits[0]?.score || 0;
  const bestWithheld = Math.max(0, ...retrieval.withheld.map((w) => w.score));
  if (bestHit > bestWithheld) return { outcome: 'answered', entry: retrieval.hits[0].entry };
  if (bestWithheld > 0) return { outcome: 'withheld', entry: null };
  return { outcome: 'gap', entry: null };
}

// ---------- Router: intent and agent ----------

export function classify(item) {
  const t = `${item.subject || ''} ${item.transcript || ''}`.toLowerCase();
  if (item.simulatedVision) return 'site-photo';
  if (/^\s*(fyi|note|heads up|update)\b|from now on|we now |we've changed|we have changed|new rule|going forward/.test(t)) return 'knowledge-update';
  if (ESCALATION_TERMS.some((w) => t.includes(w))) return 'scope-change';
  if (/(docket|invoice|unallocated|cost code)/.test(t)) return 'invoice-coding';
  if (/(claim|drawdown|lender|progress)/.test(t)) return 'claim-status';
  if (/(stud|frame|framing|spacing|centres|detail|drawing|lintel|bracing)/.test(t)) return 'spec-question';
  return 'general';
}

export function pickAgent(intent, role) {
  if (intent === 'site-photo' || intent === 'knowledge-update') return 'curator';
  if (intent === 'invoice-coding' || intent === 'claim-status' || intent === 'scope-change') return 'commercial';
  if (role === 'public') return 'content';
  if (role === 'client') return 'commercial';
  return 'teamwork';
}

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
  if (!project && who.projectScoped && who.projects.length === 1) {
    project = data.business.projects.find((p) => p.id === who.projects[0]) || null;
  }
  const query = `${item.subject || ''} ${item.transcript || ''} ${(item.simulatedVision?.observed || []).join(' ')}`;
  const retrieval = retrieve(query, data.knowledge.entries, who, project?.id);
  if (!project) {
    const viaRecord = retrieval.hits.find((h) => h.entry.project)?.entry.project;
    if (viaRecord) project = data.business.projects.find((p) => p.id === viaRecord) || null;
  }

  const needsJob = !['general', 'knowledge-update'].includes(intent) && who.role !== 'public';
  let confidence = item.simulatedVision ? item.simulatedVision.confidence : 0.95;
  if (needsJob && !project) confidence = Math.min(confidence, 0.7);
  if (retrieval.hits.length === 0 && intent !== 'knowledge-update' && intent !== 'scope-change') confidence = Math.min(confidence, 0.6);

  const best = bestAnswer(retrieval);
  let escalate = false;
  let escalateReason = '';
  if (intent === 'scope-change') { escalate = true; escalateReason = 'Scope or structural change: always goes to the founder'; }
  else if (best.outcome === 'withheld' && !['site-photo', 'invoice-coding'].includes(intent)) { escalate = true; escalateReason = 'Best match is above this person’s access tier'; }
  else if (confidence < CONFIDENCE_THRESHOLD) { escalate = true; escalateReason = `Confidence ${confidence.toFixed(2)} is below ${CONFIDENCE_THRESHOLD}`; }

  const conflicts = ['spec-question', 'general'].includes(intent) ? detectConflicts(item.transcript, retrieval.hits) : [];

  return { item, who, intent, agent: pickAgent(intent, who.role), project, retrieval, best, confidence, escalate, escalateReason, conflicts };
}

// ---------- Drafting (rule-based templates stand in for a model) ----------

function get(data, id) { return data.knowledge.entries.find((e) => e.id === id); }
function cite(data, outputTier, ...ids) {
  return [...new Set(ids.filter(Boolean))].filter((id) => {
    const e = get(data, id);
    return e && citable(e.tier, outputTier);
  });
}

let draftSeq = 0;
export function resetDraftSeq(n = 0) { draftSeq = n; }
function mk(r, d) {
  draftSeq += 1;
  return {
    id: `DR-${String(draftSeq).padStart(2, '0')}`,
    itemId: r.item.id,
    status: 'pending',
    escalated: r.escalate,
    escalateReason: r.escalateReason,
    confidence: r.confidence,
    flags: [],
    citations: [],
    ...d,
  };
}

function answerDraft(r, data, agent, extra = '') {
  const who = r.who;
  const tier = mostRestricted(who.access);
  const { outcome, entry } = r.best;
  if (outcome === 'answered') {
    // A claim answer adds the lender's evidence rule, but never an unrelated record.
    const second = r.intent === 'claim-status' ? r.retrieval.hits.find((h) => h.entry.id !== entry.id && h.entry.keywords.includes('claim'))?.entry : null;
    return mk(r, {
      kind: 'answer', agent, channel: 'Reply', to: who.person?.label, toId: who.person?.id, tier,
      title: `Answer: ${entry.title}`,
      body: `${entry.text}${second ? ` ${second.text}` : ''}${extra}`,
      citations: cite(data, tier, entry.id, second?.id),
      flags: r.conflicts.map((c) => `Conflict: asked ${c.asked}, approved ${c.approved} (${c.entryId})`),
    });
  }
  if (outcome === 'withheld') {
    return mk(r, {
      kind: 'message', agent, channel: 'Reply', to: who.person?.label, toId: who.person?.id, tier,
      title: 'Restricted question', ruleTier: tier,
      body: "That isn't something I can share with you. I've passed your question to the founder.",
      flags: [`Matched restricted records: ${r.retrieval.withheld.map((w) => w.id).join(', ')}`],
    });
  }
  return mk(r, {
    kind: 'gap', agent, channel: 'Reply', to: who.person?.label, toId: who.person?.id, tier, ruleTier: tier,
    title: 'Knowledge gap: founder to answer',
    body: `[Founder: replace this line with the answer to “${r.item.transcript}”]`,
    flags: ['No approved knowledge matches. Your answer will be saved as a rule.'],
  });
}

export function draft(r, data) {
  const who = r.who;
  const p = r.project;
  const text = r.item.transcript || '';
  switch (r.intent) {
    case 'spec-question': {
      const c = r.conflicts[0];
      const extra = c ? ` Not ${c.asked}: the approved schedule says ${c.approved}. If anything on site differs from the drawing, stop and call the office.` : '';
      return [answerDraft(r, data, 'teamwork', extra)];
    }
    case 'claim-status':
      return [answerDraft(r, data, 'commercial')];
    case 'general':
      return [answerDraft(r, data, r.agent)];
    case 'invoice-coding': {
      const po = r.retrieval.hits.find((h) => h.entry.id.startsWith('KB-PO'))?.entry;
      const docket = text.match(/\b([A-Z]{2,}-\d{3,})\b/)?.[1] || 'the docket';
      const amount = text.match(/\$[\d,]+(?:\.\d{2})?/)?.[0];
      const trade = ['concrete', 'framing', 'waterproofing'].find((k) => text.toLowerCase().includes(k));
      const code = (trade && p?.costCodes?.[trade]) || null;
      return [mk(r, {
        kind: 'record', agent: 'commercial', channel: 'Email', to: who.person?.label, toId: who.person?.id, tier: 'internal',
        title: `Code ${docket}`,
        body: po && code
          ? `${docket}${amount ? ` (${amount})` : ''} matches ${po.title.replace('Purchase order ', '')}. Allocate to job ${p.id}, cost code ${code}. Check the docket quantity against the PO before posting.`
          : `No matching purchase order found for ${docket}. Founder to confirm the job and cost code.`,
        citations: cite(data, 'internal', po?.id),
        flags: [po ? 'Amount not checked against PO value (PO holds quantity only)' : 'No PO match'],
      })];
    }
    case 'site-photo': {
      const v = r.item.simulatedVision;
      const obs = v.observed.join(', ');
      const out = [];
      if (v.standard) {
        out.push(mk(r, {
          kind: 'message', agent: 'teamwork', channel: 'Email', to: 'Principal certifier (PCA)', toId: 'certifier-01', tier: 'customer-safe',
          title: `Inspection record: ${v.scene}, ${p?.name || 'job to confirm'}`,
          body: `${v.scene}. Observed: ${obs}. Checked against the company QA standard (${v.standard}). Dated photo attached. Requesting inspection.`,
          citations: cite(data, 'customer-safe', v.kb), stream: 'Teamwork', flags: [`Simulated vision confidence ${v.confidence}`],
        }));
      }
      if (v.stage) {
        out.push(mk(r, {
          kind: 'record', agent: 'commercial', channel: 'Claim file (internal)', to: 'Claim register', tier: 'customer-safe',
          title: `Evidence for ${p?.name || 'job to confirm'} ${v.stage} claim`,
          body: `File ${r.item.attachment || 'photo'} as dated evidence for the ${v.stage} stage. Lodge once the certifier's record is back.`,
          citations: cite(data, 'customer-safe', 'KB-STAGES'), stream: 'Commercial',
        }));
      }
      if (v.post) {
        out.push(mk(r, {
          kind: 'post', agent: 'content', channel: 'LinkedIn / Instagram draft', to: 'Founder (sign-off)', tier: 'public',
          title: 'Post from today’s site photo', body: v.post,
          citations: cite(data, 'public', 'KB-STORY-VOICE', v.kb), stream: 'Brand', flags: ['No address, client or faces (voice guide rule)'],
        }));
      }
      if (!out.length) {
        out.push(mk(r, {
          kind: 'message', agent: 'curator', channel: 'Reply', to: who.person?.label, toId: who.person?.id, tier: 'customer-safe',
          title: 'Photo needs a retake or a caption',
          body: 'I can’t tell what this photo shows. Can you add a caption or retake it in better light?',
          flags: [`Simulated vision confidence ${v.confidence}`],
        }));
      }
      return out;
    }
    case 'scope-change':
      return [
        mk(r, {
          kind: 'message', agent: 'commercial', channel: 'Reply', to: who.person?.label, toId: who.person?.id, tier: 'customer-safe',
          title: 'Holding reply on a change request',
          body: 'Thanks for asking early. This is a change to the agreed scope, so we will check it with the engineer if needed and send you a written variation with the cost and time impact before any work starts. The founder will be in touch.',
          flags: ['Held for founder: scope change'],
        }),
        mk(r, {
          kind: 'variation', agent: 'commercial', channel: 'Variation register (internal)', to: 'Founder', tier: 'internal',
          title: `Draft variation: ${p?.name || 'job to confirm'}`,
          body: `Request (${who.person?.label || 'unknown'}): “${text}”\nEngineer review: [needed?]. Cost: [to be priced]. Time: [to be assessed]. Written variation to be signed by the client before work starts.`,
          citations: cite(data, 'internal', 'KB-VAR-RULE'), flags: ['Price and time are placeholders'],
        }),
      ];
    case 'knowledge-update': {
      const candidate = text.replace(/^\s*(fyi|note|heads up|update)[:,\s-]*/i, '').trim();
      const ruleTier = who.access.includes('internal') ? 'internal' : 'customer-safe';
      return [mk(r, {
        kind: 'knowledge', agent: 'curator', channel: 'Knowledge base', to: 'Founder', tier: 'internal', ruleTier,
        title: `Proposed knowledge from ${who.person?.label || 'unknown'}`,
        body: candidate,
        citations: [], flags: [`Suggested tier: ${ruleTier}`, p ? `Job: ${p.id}` : 'Applies to all jobs'],
      })];
    }
    default:
      return [answerDraft(r, data, 'teamwork')];
  }
}

// ---------- Morning triage (batch, everything to the gate) ----------

export function triage(data, clock = () => '07:15') {
  resetDraftSeq(0);
  const audit = [];
  const results = data.inbox.items.map((item) => {
    const r = route(item, data);
    audit.push({ t: clock(), actor: 'capture', action: 'captured', detail: `${item.id} via ${item.channel}${item.simulatedVision ? ' (simulated vision)' : ''}` });
    audit.push({ t: clock(), actor: 'router', action: 'routed', detail: `${item.id}: ${r.who.person?.label || 'unknown'} → ${r.agent}; access [${r.who.access.join(', ')}]; job ${r.project?.id || 'none'}; confidence ${r.confidence.toFixed(2)}` });
    if (r.retrieval.withheld.length) {
      audit.push({ t: clock(), actor: 'router', action: 'withheld', detail: `${item.id}: ${r.retrieval.withheld.map((w) => `${w.id} (${w.reason})`).join('; ')}` });
    }
    r.conflicts.forEach((c) => audit.push({ t: clock(), actor: 'curator', action: 'conflict', detail: `${item.id}: ${c.field} asked ${c.asked}, approved ${c.approved}` }));
    if (r.escalate) audit.push({ t: clock(), actor: 'router', action: 'escalated', detail: `${item.id}: ${r.escalateReason}` });
    const drafts = draft(r, data);
    drafts.forEach((d) => audit.push({ t: clock(), actor: d.agent, action: 'drafted', detail: `${d.id} for ${d.to} [${d.tier}]` }));
    return { ...r, drafts };
  });
  return { results, audit };
}

// ---------- Review gate ----------

export function decide(draftObj, decision, { edited, by = 'Founder', clock = () => '07:20' } = {}) {
  if (!['approved', 'rejected'].includes(decision)) throw new Error(`Unknown decision: ${decision}`);
  const next = { ...draftObj, status: decision, decidedBy: by };
  if (decision === 'approved' && typeof edited === 'string' && edited.trim() !== draftObj.body.trim()) {
    next.originalBody = draftObj.body;
    next.body = edited;
    next.edited = true;
  }
  const event = { t: clock(), actor: 'founder', action: decision, detail: `${draftObj.id}${next.edited ? ' (edited)' : ''} → ${draftObj.channel}` };
  return { draft: next, event };
}

// ---------- Feedback loop: founder override → rule ----------

export function captureOverride(original, edited, meta = {}) {
  const sentences = (s) => (s || '').split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter(Boolean);
  const before = new Set(sentences(original));
  const added = sentences(edited).filter((x) => !before.has(x) && !/^\[founder:/i.test(x));
  if (!added.length) return null;
  return makeRule(added.join(' '), { ...meta, source: `Founder override on ${meta.draftId || 'a draft'}` });
}

export function makeRule(text, meta = {}) {
  return {
    id: meta.id || `SOP-${Date.now().toString(36)}`,
    tier: meta.tier || 'internal',
    project: meta.project || undefined,
    title: `Founder rule: ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}`,
    text,
    keywords: [...new Set([...tokenize(text), ...tokenize(meta.question || '')])],
    source: meta.source || 'Founder',
    owner: 'Founder',
    reviewDate: meta.reviewDate || '2027-05-01',
    status: 'approved-by-founder',
  };
}

// ---------- Ask as anyone ----------

export function ask(question, personId, data) {
  const who = identify(personId, data.business);
  const project = bindProject(question, data.business);
  const scopeProject = project || (who.projects.length === 1 ? data.business.projects.find((p) => p.id === who.projects[0]) : null);
  const retrieval = retrieve(question, data.knowledge.entries, who, scopeProject?.id);
  const { outcome, entry } = bestAnswer(retrieval);
  const answer = {
    answered: entry?.text,
    withheld: "That isn't something I can share with you. I've passed your question to the founder.",
    gap: "I don't have an approved answer yet. I've logged it as a knowledge gap for the founder.",
  }[outcome];
  return { who, project: scopeProject, retrieval, answer, outcome, citation: entry?.id || null };
}
