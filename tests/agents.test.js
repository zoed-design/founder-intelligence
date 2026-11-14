import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { orchestrate, canAutoSend } from '../src/agents.js';
import { resetDraftSeq, makeRule, captureOverride } from '../src/engine.js';

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const fresh = () => ({ business: load('business.json'), knowledge: load('knowledge.json'), inbox: load('inbox.json'), agents: load('agents.json') });
const msg = (from, text, extra = {}) => ({ id: 'M-1', channel: 'sms', from, transcript: text, ...extra });
const run = (data, m, opts) => { resetDraftSeq(0); return orchestrate(m, data, opts); };

test('a routine question answered from approved knowledge is sent without the founder', () => {
  const data = fresh();
  const out = run(data, msg('framer-01', 'what insulation goes in the party wall?'));
  assert.equal(out.drafts[0].kind, 'answer');
  assert.equal(out.drafts[0].status, 'auto-sent');
  assert.deepEqual(out.drafts[0].citations, ['KB-S04']);
  assert.ok(out.steps.some((s) => s.action === 'auto-sent' && s.to === 'delivered'));
});

test('a conflicting question goes to the founder even though it has an answer', () => {
  const data = fresh();
  const out = run(data, data.inbox.items[0]);
  assert.equal(out.drafts[0].status, 'pending');
  assert.ok(out.steps.some((s) => s.action === 'conflict'));
});

test('turning off auto-answer sends everything to the gate', () => {
  const data = fresh();
  const out = run(data, msg('framer-01', 'what insulation goes in the party wall?'), { policy: { autoAnswer: false } });
  assert.equal(out.drafts[0].status, 'pending');
});

test('the knowledge search runs with the sender’s tiers, and the trace shows what was withheld', () => {
  const data = fresh();
  const out = run(data, msg('framer-01', 'what is the framing rate and markup?'));
  const search = out.steps.find((s) => s.tool === 'search_knowledge');
  assert.match(search.detail, /withheld \(.*KB-MARGIN/);
  assert.equal(out.drafts[0].status, 'pending');
  assert.equal(out.route.escalate, true);
});

test('the trace follows capture → router → curator → specialist → gate or delivery', () => {
  const data = fresh();
  const out = run(data, data.inbox.items[1]);
  const order = out.steps.map((s) => s.agent);
  assert.deepEqual(order.slice(0, 3), ['source', 'capture', 'router']);
  assert.ok(order.indexOf('curator') < order.indexOf('commercial'));
  assert.ok(out.steps.some((s) => s.action === 'handoff' && s.to === 'commercial'));
});

test('an unanswerable question becomes a knowledge gap, and the founder’s answer becomes a rule at the asker’s tier', () => {
  const data = fresh();
  const out = run(data, msg('framer-01', 'which nail gun brand do we use for decking?'));
  const d = out.drafts[0];
  assert.equal(d.kind, 'gap');
  assert.equal(d.status, 'pending');
  assert.equal(d.ruleTier, 'customer-safe');
  const rule = captureOverride(d.body, 'We use stainless ring-shank nails for decking.', { id: 'SOP-X', tier: d.ruleTier, question: 'nail gun decking' });
  data.knowledge.entries.push(rule);
  const again = run(data, msg('framer-01', 'which nails for decking?'));
  assert.equal(again.drafts[0].status, 'auto-sent');
  assert.deepEqual(again.drafts[0].citations, ['SOP-X']);
});

test('a staff update is proposed as knowledge, never added without the founder', () => {
  const data = fresh();
  const out = run(data, msg('supervisor-01', 'FYI from now on all wet areas get a flood test before screed.'));
  const d = out.drafts[0];
  assert.equal(d.kind, 'knowledge');
  assert.equal(d.status, 'pending');
  assert.equal(d.ruleTier, 'customer-safe');
  assert.ok(!d.body.toLowerCase().startsWith('fyi'));
});

test('an unclear photo asks for a retake instead of filing evidence', () => {
  const data = fresh();
  const presets = load('photo-presets.json').presets;
  const out = run(data, msg('supervisor-01', '[photo]', { channel: 'camera', simulatedVision: { ...presets.find((p) => p.id === 'unclear'), projectHint: 'elm' } }));
  assert.equal(out.drafts.length, 1);
  assert.match(out.drafts[0].body, /retake/);
  assert.equal(out.route.escalate, true);
});

test('the public only reaches the content agent and public knowledge', () => {
  const data = fresh();
  const out = run(data, msg('public', 'how long does a build take?', { channel: 'web' }));
  assert.equal(out.route.agent, 'content');
  const d = out.drafts[0];
  assert.equal(d.tier, 'public');
  assert.equal(d.status, 'auto-sent');
});

test('canAutoSend never allows posts, records, variations or knowledge changes', () => {
  const r = { conflicts: [], confidence: 1 };
  for (const kind of ['post', 'record', 'variation', 'knowledge', 'message', 'gap']) {
    assert.equal(canAutoSend({ kind, escalated: false, citations: ['x'] }, r), false, kind);
  }
});

test('makeRule keeps the question words so the rule can be found again', () => {
  const rule = makeRule('Stainless ring-shank nails.', { question: 'decking nails' });
  assert.ok(rule.keywords.includes('decking'));
});

test('a claim question is answered from claim records only', () => {
  const data = fresh();
  const out = run(data, msg('client-elm', 'What is outstanding on the frame claim?', { channel: 'whatsapp' }));
  const d = out.drafts[0];
  assert.ok(d.citations.every((c) => ['KB-CLAIM-ELM', 'KB-STAGES'].includes(c)), d.citations.join());
  assert.doesNotMatch(d.body, /Party wall/);
});
