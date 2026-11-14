import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  triage, route, ask, decide, captureOverride, retrieve, identify, citable, CONFIDENCE_THRESHOLD,
} from '../src/engine.js';

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const fresh = () => ({
  business: load('business.json'),
  knowledge: load('knowledge.json'),
  inbox: load('inbox.json'),
  agents: load('agents.json'),
});
const item = (data, id) => data.inbox.items.find((i) => i.id === id);

// ---------- Access tiers ----------

test('a subcontractor never sees internal pricing', () => {
  const data = fresh();
  const res = ask('what is the framing rate and markup?', 'framer-01', data);
  assert.equal(res.outcome, 'withheld');
  assert.ok(res.retrieval.withheld.some((w) => w.id === 'KB-MARGIN'));
  assert.ok(!res.answer.includes('markup percentages'));
});

test('a subcontractor gets the approved drawing detail for their own job', () => {
  const data = fresh();
  const res = ask('stud spacing for the party wall at elm ridge', 'framer-01', data);
  assert.equal(res.outcome, 'answered');
  assert.equal(res.citation, 'KB-S04');
});

test('a homeowner cannot see another job’s records', () => {
  const data = fresh();
  const who = identify('client-elm', data.business);
  data.knowledge.entries.push({ id: 'KB-BAY-ONLY', tier: 'customer-safe', project: 'JOB-24-BAY', title: 'Bayview finish schedule', text: 'Bayview tiles', keywords: ['tiles', 'finish'], source: 'test', owner: 'test', reviewDate: '2027-01-01' });
  const { hits, withheld } = retrieve('tiles finish', data.knowledge.entries, who, null);
  assert.equal(hits.length, 0);
  assert.ok(withheld.some((w) => w.id === 'KB-BAY-ONLY' && w.reason.startsWith('project')));
});

test('the public sees only public-approved knowledge', () => {
  const data = fresh();
  const res = ask('how long does a build take?', 'public', data);
  assert.equal(res.outcome, 'answered');
  const entry = data.knowledge.entries.find((e) => e.id === res.citation);
  assert.equal(entry.tier, 'public');
});

test('an output can only cite knowledge at its own tier or a more open one', () => {
  assert.equal(citable('internal', 'customer-safe'), false);
  assert.equal(citable('customer-safe', 'public'), false);
  assert.equal(citable('public', 'customer-safe'), true);
  const { results } = triage(fresh());
  const drafts = results.flatMap((r) => r.drafts);
  const data = fresh();
  for (const d of drafts) {
    for (const c of d.citations) {
      const e = data.knowledge.entries.find((x) => x.id === c);
      assert.ok(citable(e.tier, d.tier), `${d.id} (${d.tier}) cites ${c} (${e.tier})`);
    }
  }
});

// ---------- Router and curator ----------

test('the framer’s 600mm question is flagged against the 450mm schedule', () => {
  const data = fresh();
  const r = route(item(data, 'IN-01'), data);
  assert.equal(r.intent, 'spec-question');
  assert.equal(r.agent, 'teamwork');
  assert.equal(r.project.id, 'JOB-24-ELM');
  assert.deepEqual(r.conflicts.map((c) => [c.asked, c.approved]), [['600mm', '450mm']]);
});

test('an unallocated docket is bound to its job through the purchase order', () => {
  const data = fresh();
  const r = route(item(data, 'IN-02'), data);
  assert.equal(r.intent, 'invoice-coding');
  assert.equal(r.project.id, 'JOB-24-ELM');
  assert.equal(r.escalate, false);
});

test('a structural change request always escalates, whatever the confidence', () => {
  const data = fresh();
  const r = route(item(data, 'IN-05'), data);
  assert.equal(r.intent, 'scope-change');
  assert.equal(r.escalate, true);
  assert.ok(r.confidence >= CONFIDENCE_THRESHOLD);
  assert.ok(r.retrieval.withheld.some((w) => w.id === 'KB-VAR-RULE'), 'internal variation rule is withheld from the homeowner');
});

test('low confidence escalates', () => {
  const data = fresh();
  const photo = structuredClone(item(data, 'IN-04'));
  photo.simulatedVision.confidence = 0.62;
  const r = route(photo, data);
  assert.equal(r.escalate, true);
});

test('one photo fans out to three value streams', () => {
  const data = fresh();
  const { results } = triage(data);
  const photo = results.find((r) => r.item.id === 'IN-04');
  assert.equal(photo.project.id, 'JOB-24-BAY');
  assert.deepEqual(photo.drafts.map((d) => d.stream), ['Teamwork', 'Commercial', 'Brand']);
  assert.equal(photo.drafts[2].tier, 'public');
});

test('every draft starts pending and every step is in the audit trail', () => {
  const { results, audit } = triage(fresh());
  const drafts = results.flatMap((r) => r.drafts);
  assert.ok(drafts.every((d) => d.status === 'pending'));
  for (const r of results) assert.ok(audit.some((a) => a.action === 'routed' && a.detail.startsWith(r.item.id)));
  assert.equal(audit.filter((a) => a.action === 'drafted').length, drafts.length);
});

// ---------- Review gate and feedback loop ----------

test('approval records who decided and keeps the original when edited', () => {
  const { results } = triage(fresh());
  const d = results[0].drafts[0];
  const { draft, event } = decide(d, 'approved', { edited: `${d.body}\nAlways use treated timber on exposed parapets.` });
  assert.equal(draft.status, 'approved');
  assert.equal(draft.edited, true);
  assert.equal(draft.originalBody, d.body);
  assert.equal(event.actor, 'Founder');
});

test('a founder edit becomes an internal SOP candidate; an unedited approval does not', () => {
  const original = 'Use 90mm studs at 450mm centres.';
  const sop = captureOverride(original, `${original} Always specify 140mm LVL on boundary parapets.`, { draftId: 'DR-01', id: 'SOP-T' });
  assert.equal(sop.tier, 'internal');
  assert.equal(sop.text, 'Always specify 140mm LVL on boundary parapets.');
  assert.ok(sop.keywords.includes('parapets'));
  assert.equal(captureOverride(original, original), null);
});

test('a captured SOP grounds the next answer for the founder but not for a trade', () => {
  const data = fresh();
  data.knowledge.entries.push(captureOverride('x.', 'x. Always specify 140mm LVL on boundary parapets.', { id: 'SOP-T' }));
  assert.equal(ask('what LVL on boundary parapets?', 'founder', data).citation, 'SOP-T');
  assert.equal(ask('what LVL on boundary parapets?', 'framer-01', data).outcome, 'withheld');
});

test('decide rejects unknown decisions', () => {
  assert.throws(() => decide({ id: 'x', body: '' }, 'maybe'));
});
