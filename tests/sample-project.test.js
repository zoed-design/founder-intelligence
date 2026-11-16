import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPhotoPack,askBower,coachEmployee,approvePack,publicIssues} from '../src/photo-workflow.js';
import {validateSampleProject,sampleFindings,shortSampleUpdates} from '../src/sample-project.js';
const source=JSON.parse(fs.readFileSync(new URL('../sample-data/project.json',import.meta.url),'utf8'));
const make=()=>structuredClone(source);
const build=project=>buildPhotoPack({sampleProject:project||make()});

test('drawing-level arithmetic and missing schedule dates come from the reviewed records',()=>{
 const f=sampleFindings(make());
 assert.equal(f.wallHeightM,3.5);assert.equal(f.roofHeightM,2.7);assert.equal(f.differenceMm,800);
 assert.equal(f.chatMatchesHeight,true);assert.equal(f.chatMatchesPitch,true);assert.equal(f.missingRoofDates,true);
 const p=build();assert.match(p.drafts[0].body,/800 mm/);assert.match(p.drafts[0].body,/3\.50 m/);assert.match(p.drafts[0].body,/not recorded/);
 assert.equal(p.approved,false);assert.equal(p.drafts.length,3);
});

test('changed source values change results and conflicting evidence is not silently reconciled',()=>{
 const project=make();project.drawing.wallTopRL=48.3;project.drawing.pitchDegrees=6;
 const p=build(project),answer=askBower({question:'Explain the roof height difference',pack:p});
 assert.equal(p.findings.differenceMm,1000);assert.equal(p.findings.chatMatchesHeight,false);
 assert.match(answer.text,/1000 mm/);assert.match(answer.text,/does not match/);assert.match(answer.text,/need reconciliation/);
 assert.match(shortSampleUpdates(p).admin,/1000 mm/);
});

test('date answers preserve recorded dates without converting them into bookings or completion',()=>{
 const project=make(),row=project.schedule.rows.find(r=>r.sourceRow===78);
 row.start='2026-12-01';row.finish='2026-12-04';const p=build(project);
 const answer=askBower({question:'When is roof covering scheduled?',pack:p});
 assert.match(answer.text,/1 Dec 2026/);assert.match(answer.text,/4 Dec 2026/);
 assert.match(answer.text,/not confirmation/);assert.equal(p.findings.missingRoofDates,false);
});

test('client and story responses cannot reveal internal measurements or source references',()=>{
 const p=build();
 for(const audience of ['client','social'])for(const question of ['Explain the 800 mm height','Roof progress','What are the sources?','When is inspection?','What is my next task?']){
  const a=askBower({question,audience,pack:p});
  assert.ok(a.citations.every(id=>id===(audience==='client'?'sample-progress':'sample-public')));
  assert.doesNotMatch(a.text,/48\.10|44\.60|800|3\.50|Kira|Sam Cole/);
 }
 assert.deepEqual(publicIssues(p.drafts[2].body),[]);assert.ok(approvePack(p).approved);
 p.drafts[2].body+='\n18 Maroubra Street, Maroubra';assert.throws(()=>approvePack(p),/redaction/);
});

test('private input stays with Roo and all sample references have real downloadable files',()=>{
 const p=buildPhotoPack({sampleProject:make(),note:'Private internal note: pricing review',photoName:'site.png'});
 assert.match(p.drafts[0].body,/pricing review/);assert.doesNotMatch(p.drafts[1].body+p.drafts[2].body,/pricing review/);
 const lookup=askBower({question:'What source references support this?',pack:p});
 assert.equal(lookup.citations.length,6);
 for(const s of p.sources){assert.ok(fs.existsSync(new URL('../'+s.url.split('#')[0],import.meta.url)),s.url);}
 const answer=askBower({question:'Is the work completed and loan drawdown approved?',pack:p});
 assert.match(answer.text,/do not establish actual completion/);
});

test('Roo coaches from sample sources and sends proposed changes to Digger',()=>{
 const p=build();const routine=coachEmployee({question:'How do I prepare for the inspection?',pack:p});
 assert.equal(routine.needsReview,false);assert.ok(routine.citations.includes('sample-oc'));
 const change=coachEmployee({question:'Can I change the roof structure?',pack:p});
 assert.equal(change.needsReview,true);assert.match(change.text,/No work or change has been approved/);
});

test('bad references and incomplete samples fail before draft generation',()=>{
 const p=make();p.sources[0].url='javascript:alert(1)';assert.throws(()=>validateSampleProject(p),/source/);
 const missing=make();missing.schedule.rows=missing.schedule.rows.filter(r=>r.sourceRow!==78);assert.throws(()=>build(missing),/missing/);
 const numeric=make();numeric.drawing.wallTopRL=NaN;assert.throws(()=>build(numeric),/Invalid/);
});
