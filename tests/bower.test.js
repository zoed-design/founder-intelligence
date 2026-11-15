import test from 'node:test';
import assert from 'node:assert/strict';
import {askBower,buildPhotoPack,SOURCES} from '../src/photo-workflow.js';

const pack=buildPhotoPack({photoName:'site.jpg',note:'Private admin-only note'});
test('Bower returns traceable references and an answer to the asking role',()=>{
  for(const [audience,actor] of Object.entries({workspace:'router',admin:'teamwork',client:'commercial',social:'content'})){
    const answer=askBower({question:'What source references support these next steps?',audience,pack});
    assert.ok(answer.citations.length);
    assert.ok(answer.citations.every(id=>SOURCES.some(s=>s.id===id)));
    assert.equal(answer.steps[0].agent,actor);
    assert.equal(answer.steps.at(-1).to,actor);
  }
});
test('client and public questions cannot retrieve internal references or private notes',()=>{
  for(const audience of ['client','social']){
    for(const question of ['supplier margin and lender details','What are the next actions?','roof drawing references','When is inspection?']){
      const answer=askBower({question,audience,pack});
      const allowed=audience==='social'?['public-roof']:['progress'];
      assert.ok(answer.citations.every(id=>allowed.includes(id)),`${audience}: ${question}`);
      assert.ok(!answer.text.includes('Private admin-only note'));
    }
  }
  assert.throws(()=>askBower({audience:'unknown',pack}),/Unknown/);
});
test('each role receives a task and a reminder draft without scheduling side effects',()=>{
  assert.equal(pack.drafts.length,3);
  for(const d of pack.drafts){assert.ok(d.taskTitle);assert.ok(d.reminder);assert.equal(d.status,'draft');}
  const client=askBower({question:'What is my next task and reminder?',audience:'client',pack});
  assert.match(client.text,/Tally:/);
  assert.doesNotMatch(client.text,/Roo:|Kooka:/);
  assert.match(client.text,/no reminder has been scheduled/);
});
test('missing input and unknown questions do not invent Wiki evidence',()=>{
  assert.deepEqual(askBower({question:'Anything?'}).citations,[]);
  const unknown=askBower({question:'Who won a football match?',pack});
  assert.deepEqual(unknown.citations,[]);
  assert.match(unknown.text,/couldn’t find a relevant answer/);
});
