import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhotoPack, approvePack, publicIssues } from '../src/agents.js';
import { CONTEXT, shortUpdates } from '../src/demo-config.js';

test('project alias propagates through full and shortened updates', () => {
  const p = buildPhotoPack({photoName:'site.jpg'});
  for (const d of p.drafts.filter(d=>d.id!=='social')) assert.ok(d.body.includes(CONTEXT.address));
  const custom={...CONTEXT,address:'9 Example Road, Sampletown',publicName:'Sample Duplex',client:'Example Client',admin:'Example Team'};
  const short=shortUpdates(custom);
  assert.ok(short.admin.includes(custom.address));
  assert.ok(short.client.includes(custom.client));
  assert.ok(short.social.includes(custom.publicName));
  assert.ok(!short.social.includes(custom.address));
});

test('requires a deliberate attachment; no unsolicited demo messages', () => {
  assert.throws(() => buildPhotoPack(), /Add a site photo/);
});
test('one photo creates three drafts and the capture/router/curator/specialist trace', () => {
  const p = buildPhotoPack({photoName:'framing.jpg'});
  assert.equal(p.drafts.length,3);
  assert.deepEqual(p.drafts.map(d=>d.tier),['internal','customer-safe','public']);
  assert.ok(p.steps.some(s=>s.agent==='capture'));
  assert.ok(p.steps.some(s=>s.to==='commercial'));
  assert.ok(p.steps.some(s=>s.to==='content'));
  assert.ok(p.drafts.every(d=>d.status==='draft'));
});
test('private notes and markdown never pass into client/public templates', () => {
  const secret='Demo Homeowner 42 Marubra Street DEMO-CDC-001 private@example.com';
  const p=buildPhotoPack({briefName:'case.md',briefText:secret,note:secret});
  assert.ok(p.drafts[0].body.includes(secret));
  assert.ok(!p.drafts[1].body.includes('private@example.com'));
  assert.deepEqual(publicIssues(p.drafts[2].body),[]);
  assert.deepEqual(p.drafts[2].citations,['public-roof']);
});
test('public redaction is enforced at approval after editing, not only on generation', () => {
  for(const leak of ['Demo Homeowner','42 Marubra Street','DEMO-CDC-001','DEMO-STRUCT-001','private@example.com','+61 412 345 678','15 Other Road']) {
    const p=buildPhotoPack({photoName:'framing.jpg'});
    p.drafts[2].body+='\n'+leak;
    assert.throws(()=>approvePack(p),/redaction/);
  }
});
test('approval requires all content, public mask, and records local status only', () => {
  const p=buildPhotoPack({photoName:'framing.jpg'});
  const approved=approvePack(p);
  assert.equal(p.approved,false);
  assert.ok(approved.drafts.every(d=>d.status==='approved-local'));
  p.drafts[2].body='Generic public text';
  assert.throws(()=>approvePack(p),/Marubra Duplex/);
  p.drafts[0].body='';
  assert.throws(()=>approvePack(p),/empty/);
});
