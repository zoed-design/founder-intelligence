import {takeoffKnowledge} from './src/takeoff-knowledge.js?v=brand-story-1';
import {queueReview,resolveReview} from './src/review-queue.js?v=brand-story-1';
import {collectWhatsApp,wikiMessageSources} from './src/session-wiki.js?v=brand-story-1';
import {validateSampleProject, shortSampleUpdates} from './src/sample-project.js?v=brand-story-1';
import { buildPhotoPack, approvePack, publicIssues, SOURCES, askBower, coachEmployee } from './src/photo-workflow.js?v=brand-story-1';
import { CONTEXT, shortUpdates } from './src/demo-config.js?v=brand-story-1';
import { CREW, portrait, mascot } from './src/crew.js?v=brand-stories-2';
import { createMap } from './src/map.js?v=brand-stories-2';

import {validatePlanningRegistry} from './src/planning-knowledge.js?v=brand-story-1';


const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROLES={
  admin:{agent:'teamwork',name:'Roo',role:'Employee Coach',title:'Roo · Employee Coach',greeting:'Tell me what you’re working on. I’ll explain the steps, show the references and flag anything Digger should review.'},
  client:{agent:'commercial',name:'Tally',role:'Client',title:'Tally · Client',greeting:'Ask about your home’s milestones or what you could do with your current home. I’ll show the relevant sources and what still needs checking.'},
  social:{agent:'content',name:'Kooka',role:'Brand Stories',title:'Kooka · Brand Stories',greeting:'Ask me for approved context and references to tell the story behind the business’s craftsmanship and approach.'},
};
let reviews=[],reviewReplies={};
let photo=null,pack=null,sampleProject=null,page='workspace',busy=false,sequence=0;
let projectPromise=null,wikiEntries=[],wikiOpen=false,whatsappOpen=false,whatsappDraft={text:'',fileName:'Pasted WhatsApp message',note:''};
let messages=[],roleMessages={admin:[],client:[],social:[]},inputNote='',roleInputs={admin:'',client:'',social:''};
const pics=Object.fromEntries(Object.keys(CREW).map(id=>[id,portrait(id,160)]));
let map=createMap($('#agentMap'),{},pics);
const digger=mascot($('#mascot'),$('#bubble'));
const sourcesForPack=()=>[...wikiMessageSources(wikiEntries),...(sampleProject?.sources||[]),...(sampleProject?.regulatory?.references||[]),...(pack?.sources||[]),...SOURCES];
const knowledgePack=()=>pack?{...pack,wikiEntries,sources:sourcesForPack()}:buildPhotoPack({sampleProject,wikiEntries});
const sourceById=id=>sourcesForPack().find(s=>s.id===id);
const avatar=(id,large=false)=>pics[id]?`<img class="ava ${large?'lg':''}" src="${pics[id]}" alt="${esc(CREW[id].name)}">`:'';

function render(){
  document.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-current',b.dataset.page===page?'page':'false'));
  document.querySelector('.steps').hidden=page==='client'||page==='social';
  $('#view').innerHTML=page==='workspace'?workspace():rolePage(page);
  const chat=$('.founder-thread');if(chat)chat.scrollTop=chat.scrollHeight;
}
function chatMessages(list){return list.map(m=>`<div class="chat-message ${m.who==='you'?'founder-message':'agent-message'}"><b>${esc(m.name||(m.who==='you'?'Digger':'Bower'))}</b><p>${esc(m.text)}</p>${m.reviewId?`<span class="review-flag">Digger review · ${reviews.find(r=>r.id===m.reviewId)?.status==='answered'?'answered':'pending'}</span>`:''}${m.consultation?'<p><a class="consultation-link" href="landing/consultation.html" target="_blank" rel="noopener">Book a free consultation with BuildCo ↗</a><small class="consultation-note">Illustrative consultation page · no booking or personal data collected</small></p>':''}${m.citations?.length?`<details class="message-sources"><summary>Sources · ${m.citations.length}</summary>${m.citations.map(id=>sourceById(id)).filter(Boolean).map(sourceHtml).join('')}</details>`:''}</div>`).join('');}
function workspace(){return `<div class="hello"><div><h1>One site update. The crew takes it from here.</h1></div></div>
  <section class="card founder-chat" aria-labelledby="conversation-title" id="photo-drop-zone">
  <div class="chat-heading">${avatar('curator')}<div><h2 id="conversation-title">Talk to Bower</h2><span>As Digger · Site Manager</span></div></div>
  <div class="founder-thread" aria-live="polite"><div class="chat-message agent-message"><b>Bower</b><p>Drop your latest site update. I’ll use the Wiki to find references and line up the team’s next steps for your review.</p></div>${chatMessages(messages)}</div>
  ${photo?`<figure class="selected-photo"><img src="${esc(photo.url)}" alt="Your uploaded site photo"><figcaption>${esc(photo.name)}</figcaption></figure>`:''}
  <form id="founder-form" class="message-composer"><label class="photo-button" title="Attach a site photo"><span aria-hidden="true">＋</span><span class="sr">Attach a site photo</span><input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp" class="sr" ${busy?'disabled':''}></label><label class="sr" for="founder-note">Message Bower or drop a photo</label><textarea id="founder-note" placeholder="Message Bower or drop a photo here…" ${busy?'disabled':''}>${esc(inputNote)}</textarea><button class="send-message" aria-label="Send message" ${busy?'disabled':''}>↑</button></form>
  <div class="input-options"><button type="button" class="text-action" data-action="whatsapp" ${busy?'disabled':''}>Add a WhatsApp message</button><span>Manual import · no WhatsApp connection</span></div>${whatsappForm()}${busy?'<div class="working-status" role="status"><span></span>Bower is finding references and coordinating next steps…</div>':''}</section>${reviewPanel()}${sampleControls()}${pack?parallelPanes():''}`;}
function sampleControls(){return `<section class="sample-controls" aria-label="Project Wiki"><div class="sample-control-row"><button class="btn btn-line" data-action="wiki" aria-expanded="${wikiOpen}">Wiki · ${sampleProject?'7 source files' + (sampleProject.regulatory?' + planning references':''):'Loading project…'}${wikiEntries.length?` + ${wikiEntries.length} message${wikiEntries.length===1?'':'s'}`:''}</button><span>One demo project for this prototype.</span></div>${wikiOpen?wikiPanel():''}</section>`;}
function wikiPanel(){return sampleProject?`<section class="wiki-panel"><h2>Project Wiki</h2><p>Reviewed references for this project, plus manually imported messages. Session only: reload or New session clears imports.</p><p class="sample-scope">131 schedule entries · 36 OC checklist items · selected drawing references. Full PDF packs are excluded from this public demo because identifiers remain in them.</p><div class="wiki-try"><button class="btn btn-line" data-action="sample-photo" ${busy?'disabled':''}>Use supplied site photo</button><button class="btn btn-line" data-action="sample-whatsapp" ${busy?'disabled':''}>Try supplied WhatsApp message</button></div><details class="sample-files"><summary>Reviewed source files and extracts</summary><ul>${sampleProject.downloads.map(d=>`<li><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.title)}</a></li>`).join('')}</ul><a href="sample-data/README.md" target="_blank" rel="noopener">Source register and limits</a></details>${planningPanel()}<div class="wiki-imports"><h3>Lyra’s collected messages · ${wikiEntries.length}</h3>${wikiEntries.length?wikiEntries.map(e=>`<article class="wiki-entry"><b>${esc(e.title)}</b><p class="wiki-tags">${e.tags.map(esc).join(' · ')}</p><span class="wiki-status">${esc(e.status)}</span><pre>${esc(e.text)}</pre>${knowledgeCard(e)}</article>`).join(''):'<p>No manually imported messages yet. Add a WhatsApp message to see Lyra collect, label and index it here.</p>'}</div></section>`:'<p>Loading the project references…</p>';}
function knowledgeCard(entry){const k=takeoffKnowledge(entry,sampleProject);return k?`<details class="takeoff-knowledge" open><summary>${esc(k.title)}</summary><p class="wiki-tags">${k.tags.map(esc).join(' · ')}</p><p><strong>${esc(k.status)}</strong></p><p class="knowledge-body">${esc(k.body)}</p><details><summary>Message and drawing references</summary>${k.citations.map(sourceById).filter(Boolean).map(sourceHtml).join('')}</details></details>`:'';}
function planningPanel(){const r=sampleProject?.regulatory;return r?`<details class="sample-files planning-references"><summary>Planning references · checked ${esc(r.checkedAt)}</summary><p class="sample-scope">Reviewed Randwick / NSW snapshot. No site approval or live cloud sync. Full current legislation was not retrieved; linked instruments need independent checking.</p>${r.references.map(s=>sourceHtml({...s,evidence:s.evidence+' Status: '+s.status+'. '+s.version})).join('')}<p><a href="docs/planning-references.md" target="_blank" rel="noopener">Coverage and review limits</a></p></details>`:'<p class="sample-scope">Planning references are unavailable; project sources remain available.</p>';}
function whatsappForm(){return whatsappOpen?`<form id="whatsapp-form" class="whatsapp-import"><h3>Collect a WhatsApp message</h3><p>Paste a conversation or upload a text file. The supplied screenshot uses its reviewed transcript; other screenshots need you to paste and confirm their text.</p><label for="whatsapp-file">Text file or screenshot</label><input id="whatsapp-file" type="file" accept=".txt,.md,text/plain,text/markdown,image/png,image/jpeg,image/webp" ${busy?'disabled':''}><label for="whatsapp-text">Message text for Lyra to organise</label><textarea id="whatsapp-text" maxlength="32000" placeholder="Mark: …\nKira: …" ${busy?'disabled':''}>${esc(whatsappDraft.text)}</textarea><p class="sample-scope">${esc(whatsappDraft.note||'For 18 Maroubra Street only. Review the text and remove private details before importing. Nothing is sent or shared.')}</p><button class="btn btn-line" type="submit" ${busy?'disabled':''}>Collect into Wiki</button><p id="whatsapp-error" role="alert" class="error-text"></p></form>`:'';}
async function ensureProject(){
 if(sampleProject)return sampleProject;
 if(!projectPromise)projectPromise=fetch(new URL('./sample-data/project.json',import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('The project references could not be loaded. Please try again.');return r.json();}).then(validateSampleProject).then(async data=>{try{const response=await fetch(new URL('./sample-data/regulatory-references.json',import.meta.url),{cache:'no-cache'});if(!response.ok)throw new Error('Planning pack unavailable.');data.regulatory=validatePlanningRegistry(await response.json());}catch{data.regulatory=null;}return sampleProject=data;}).catch(err=>{projectPromise=null;throw err;});
 return projectPromise;
}
async function fileHash(file){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');}
async function loadWhatsAppFile(file){
 if(busy)return;const token=++sequence;busy=true;render();
 try{await ensureProject();if(file.size>12*1024*1024)throw new Error('Please choose a file smaller than 12 MB.');let text='',note='';
 if(/\.(txt|md)$/i.test(file.name)||/^text\//.test(file.type)){text=await file.text();if(text.length>32000)throw new Error('Please use a text file shorter than 32,000 characters.');note='Text file read locally. Review the text before collecting it.';}
 else if(/^image\//.test(file.type)){if([sampleProject.assets.whatsappHash,sampleProject.assets.illustrativeWhatsappHash].includes(await fileHash(file))){text=sampleProject.assets.transcript;note='Matched the supplied demo screenshot. This is its reviewed transcript, not live OCR. Review before collecting.';}else note='Screenshot received. Live OCR is not available; paste and confirm the message text below.';}
 else throw new Error('Choose a text file or screenshot.');
 if(token!==sequence)return;whatsappDraft={text,fileName:file.name,note};whatsappOpen=true;busy=false;render();
 }catch(err){if(token!==sequence)return;busy=false;say(err.message);}
}
async function ingestWhatsApp(text){
 if(busy)return;const token=++sequence;busy=true;render();
 try{await ensureProject();if(token!==sequence)return;const result=collectWhatsApp({text,entries:wikiEntries,projectId:sampleProject.id,fileName:whatsappDraft.fileName});wikiEntries=result.entries;
 for(const step of [{agent:'source',to:'router',alsoTo:'capture'},{agent:'router',to:'capture'},{agent:'capture',to:'kb'},{agent:'capture',to:'router'}]){if(token!==sequence)return;map.play({...step,itemId:result.entry.id});await new Promise(r=>setTimeout(r,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:180));}
 if(token!==sequence)return;if(pack)pack={...pack,approved:false,wikiEntries,sources:[...sampleProject.sources,...wikiMessageSources(wikiEntries)],drafts:pack.drafts.map(d=>({...d,status:'draft'}))};

 const knowledge=takeoffKnowledge(result.entry,sampleProject);if(knowledge&&!result.duplicate){const q=queueReview(reviews,{question:'Review the takeoff SOP draft from the imported site manager / admin message.',audience:'admin',reason:'Confirm the drawing checks and estimating / quantity-order guidance before adopting the draft.',citations:knowledge.citations});reviews=q.entries;}
 messages.push({who:'agent',name:'Lyra',text:result.duplicate?'This message is already in the project Wiki.':`Collected and organised the message for 18 Maroubra Street. Tags: ${result.entry.tags.join(', ')}. Bower can now reference it as an unverified source. It has not changed the projected schedule or approved drawings.${knowledge?' I’ve also prepared a takeoff knowledge / SOP draft for employee estimating and quantity-order preparation, with message and drawing references. Digger can review it in the waiting-for-review panel.':''}`,citations:[result.entry.id]});busy=false;whatsappOpen=false;whatsappDraft={text:'',fileName:'Pasted WhatsApp message',note:''};wikiOpen=true;render();
 }catch(err){if(token!==sequence)return;busy=false;render();if($('#whatsapp-error'))$('#whatsapp-error').textContent=err.message;else say(err.message);}
}
async function useSamplePhoto(){
 if(busy)return;const token=++sequence;busy=true;render();
 try{await ensureProject();if(token!==sequence)return;const r=await fetch(sampleProject.assets.photo);if(!r.ok)throw new Error('The supplied photo could not be loaded.');const blob=await r.blob();if(token!==sequence)return;busy=false;await acceptPhoto(new File([blob],'18-maroubra-site-photo.jpg',{type:'image/jpeg'}));}
 catch(err){if(token!==sequence)return;busy=false;say(err.message);}
}

function taskSummary(d){return `<div class="task-summary"><b>Task · ${esc(d.taskTitle)}</b><p><span>Reminder draft</span> ${esc(d.reminder)}</p></div>`;}
function parallelPanes(){return `<section class="parallel-section" aria-labelledby="team-title"><div class="parallel-heading"><h2 id="team-title">From your team</h2><span>${pack.approved?'Approved':'Ready to review'}</span></div><div class="parallel-panes">${pack.drafts.map(d=>{const r=ROLES[d.id];return `<article class="team-pane" data-pane="${d.id}"><div class="pane-heading">${avatar(r.agent)}<div><h3>${r.name}</h3><span>${r.role}</span></div></div>${taskSummary(d)}<div class="pane-body">${esc(d.body)}</div>${pack.sampleProject?`<details class="pane-sources"><summary>Source references · ${d.citations.length}</summary>${d.citations.map(sourceById).filter(Boolean).map(sourceHtml).join('')}</details>`:''}<details class="review-editor"><summary>Edit update</summary><label class="sr" for="review-${d.id}">Edit ${r.role} update</label><textarea id="review-${d.id}" data-review="${d.id}">${esc(d.body)}</textarea></details><button class="btn btn-line" data-open="${d.id}">${d.id==='social'?'Open Brand Stories':'Open conversation'}</button></article>`;}).join('')}</div><p class="reminder-note">Reminder drafts stay here for review. Nothing is sent or scheduled.</p>${approvalButtons()}<p id="pack-error" class="error-text" role="alert"></p></section>`;}
function approvalButtons(){return `<div class="pack-actions"><button class="btn btn-ok" data-action="approve" ${pack.approved?'disabled':''}>${pack.approved?'Approved':'Approve updates'}</button><button class="btn btn-line" data-action="export" ${pack.approved?'':'disabled'}>Download updates</button></div>`;}
function rolePage(id){
  const r=ROLES[id];if(!r)return workspace();const d=pack?.drafts.find(d=>d.id===id);
  if(id==='social')return instagramPage(r,d);
  return `<div class="hello role-hello">${avatar(r.agent,true)}<div><h1>${r.title}</h1><p>${id==='admin'?'Learn the steps. Ask questions. Get the right review.':'Tasks, updates and references'}</p></div></div>${d?taskSummary(d):''}${bowerConversation(id,d)}${d&&id==='admin'?editor(d):''}`;
}
function bowerConversation(id,d){const r=ROLES[id],coach=id==='admin',name=coach?'Roo':'Bower';return `<section class="card role-conversation"><div class="chat-heading">${avatar(coach?'teamwork':'curator')}<div><h2>Talk to ${name}</h2><span>${coach?'Employee coaching':`As ${r.name} · ${r.role}`}</span></div></div><div class="founder-thread" aria-live="polite"><div class="chat-message agent-message"><b>${name}</b><p>${r.greeting}</p></div>${d&&id!=='social'?`<div class="chat-message agent-message"><b>${r.name}</b><p>${esc(d.body)}</p></div>`:''}${chatMessages(roleMessages[id])}</div><form class="message-composer" id="role-form" data-role="${id}"><label class="sr" for="role-note">${coach?'Ask Roo for guidance':`Ask Bower as ${r.name}`}</label><textarea id="role-note" placeholder="Ask ${name}…" ${busy?'disabled':''}>${esc(roleInputs[id])}</textarea><button class="send-message" aria-label="Send message" ${busy?'disabled':''}>↑</button></form>${busy?`<p class="working-status" role="status">${coach?'Roo is checking the references with Bower…':'Bower is checking the Wiki…'}</p>`:''}</section>`;}
function instagramPage(r,d){return `<div class="hello role-hello">${avatar(r.agent,true)}<div><h1>${r.title}</h1><p>Instagram photo post · 3:4 portrait</p></div></div><section class="card instagram-card"><div class="instagram-top">${avatar('content')}<div><b>${esc(CONTEXT.instagramHandle)}</b><span>${d?esc(CONTEXT.publicName):'Stories from your site'}</span></div><span class="instagram-word">Instagram</span></div><div class="instagram-art">${photo?`<img src="${esc(photo.url)}" alt="The site photo shared by Digger, used in this brand draft">`:''}<span>${d?'Behind the build.':'Your next brand story starts here.'}</span></div><div class="instagram-icons" aria-hidden="true">♡ &nbsp; ◯ &nbsp; ↗</div><p class="instagram-caption" data-public-caption>${esc(d?d.body:'Share a site photo to prepare a brand draft.')}</p>${photo?'<div class="instagram-download"><button class="btn btn-line" data-action="download-post">Download photo post · 1080 × 1440</button><p>Image and caption are separate. Review the photo and copy before public use; nothing is posted.</p></div>':''}</section>${d?taskSummary(d):''}${bowerConversation('social',d)}${d?editor(d):''}`;}
function reviewPanel(){const pending=reviews.filter(r=>r.status==='pending');return `<section class="card digger-review" id="digger-review"><details ${pending.length?'open':''}><summary>Waiting for Digger review · ${pending.length}</summary><p class="review-scope">Questions and replies stay in this browser session. Returning a reply adds it to the originating conversation; no external message or notification is sent. Reload or New session clears this queue.</p>${reviews.length?reviews.map(r=>`<article class="review-item"><h3>${esc(r.audience==='workspace'?'Digger':ROLES[r.audience]?.name)} · ${r.status==='pending'?'Waiting for review':'Answered'}</h3><p class="review-question">${esc(r.question)}</p><p>${esc(r.reason)}</p>${r.citations.length?`<details><summary>References to check</summary>${r.citations.map(sourceById).filter(Boolean).map(sourceHtml).join('')}</details>`:''}${r.status==='pending'?`<form class="review-reply" data-review-id="${r.id}"><label for="reply-${r.id}">Digger’s reviewed reply · visible to ${esc(r.audience==='workspace'?'Digger':ROLES[r.audience]?.name)}</label><textarea id="reply-${r.id}" data-reply-id="${r.id}" maxlength="6000" required placeholder="Check the sources, then write the response for this audience…">${esc(reviewReplies[r.id]||'')}</textarea><button class="btn btn-line" type="submit">Return reviewed reply in this session</button><p id="error-${r.id}" role="alert" class="error-text"></p></form>`:`<p class="review-answer">${esc(r.reply)}</p>`}</article>`).join(''):'<p>No questions waiting. Bower will bring questions here when an answer needs confirmation.</p>'}</details></section>`;}
async function downloadPhotoPost(){
 if(!photo)return;const image=await createImageBitmap(await (await fetch(photo.url)).blob());const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1440;const c=canvas.getContext('2d');const ratio=Math.max(1080/image.width,1440/image.height),w=image.width*ratio,h=image.height*ratio;c.drawImage(image,(1080-w)/2,(1440-h)/2,w,h);image.close();const g=c.createLinearGradient(0,1080,0,1440);g.addColorStop(0,'rgba(36,29,24,0)');g.addColorStop(1,'rgba(36,29,24,.82)');c.fillStyle=g;c.fillRect(0,1080,1080,360);c.fillStyle='#fff8ea';c.font='bold 66px sans-serif';c.fillText('Behind the build.',64,1320);c.font='28px sans-serif';c.fillText(CONTEXT.instagramHandle,64,1375);const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw new Error('The photo post could not be exported.');const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='buildco-instagram-photo-post.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function editor(d){const issues=d.id==='social'?publicIssues(d.body):[];const heading={admin:'Employee coaching guide',client:'Client update',social:'Brand story draft'}[d.id];return `<section class="card draft-editor"><div class="editor-heading"><h2>${heading}</h2><span>${pack.approved?'Approved':'Draft'}</span></div><label class="sr" for="draft-body">Edit ${heading}</label><textarea id="draft-body" data-draft="${d.id}">${esc(d.body)}</textarea>${d.id==='social'?`<p id="privacy-result" class="privacy-result ${issues.length?'has-error':''}" aria-live="polite">${issues.length?`Remove private information: ${issues.join(', ')}`:`Public name: ${esc(CONTEXT.publicName)}`}</p>`:''}<details class="evidence"><summary>Sources</summary>${d.citations.map(id=>sourceHtml(sourceById(id))).join('')}</details></section>`;}
function sourceHtml(s){if(!s)return '';return `<div class="source-detail"><b>${esc(s.title)}</b><p>${esc(s.evidence)}</p><small>${esc(s.file)}${s.locator?` · ${esc(s.locator)}`:''}</small>${s.url?`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener">Open source</a>`:''}</div>`;}
function say(text,who='agent',citations=[]){messages.push({who,text,citations});render();}
function setPhoto(next){if(photo?.url?.startsWith('blob:'))URL.revokeObjectURL(photo.url);photo=next;pack=null;}

async function acceptPhoto(file){
  if(busy)return;
  const uploadToken=++sequence;busy=true;
  try{
    await ensureProject();if(uploadToken!==sequence)return;
    if([sampleProject.assets.whatsappHash,sampleProject.assets.illustrativeWhatsappHash].includes(await fileHash(file))){busy=false;await loadWhatsAppFile(file);return;}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024)throw new Error('Please choose a JPEG, PNG or WebP photo smaller than 12 MB.');
    const bitmap=await createImageBitmap(file);bitmap.close();
    if(uploadToken!==sequence)return;
    const note=inputNote.trim();inputNote='';setPhoto({url:URL.createObjectURL(file),name:file.name});roleMessages={admin:[],client:[],social:[]};
    await prepare(note);
  }catch(err){if(uploadToken!==sequence)return;busy=false;say(err.message);}
}
async function prepare(note){
  const token=++sequence;busy=true;pack=null;say(note||(photo?'Shared a site photo for 18 Maroubra Street.':'Use the reviewed project records.'),'you');
  if(token!==sequence)return;const next=buildPhotoPack({note,photoName:photo?.name||'',sampleProject,wikiEntries});$('#trace').innerHTML='';
  for(const s of next.steps){if(token!==sequence)return;map.play(s);$('#trace').insertAdjacentHTML('beforeend',`<li>${esc(s.detail)}</li>`);await new Promise(resolve=>setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:200));}
  if(token!==sequence)return;pack=next;busy=false;
  if(pack.sampleProject){const row=pack.findings.roofCovering;const finish=row.finish?new Date(row.finish+'T00:00:00Z').toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):'not recorded';say(`I’ve linked this site update to the Wiki. The current schedule projects roof covering to finish ${finish}. Roo has the inspection and certificate follow-up; Tally has a client-friendly schedule update; Kooka has a Brand Story. The drafts and source references are ready for your review. The photo has not been analysed and the dates are planning targets.`, 'agent', ['sample-schedule','sample-oc']);digger.say('Bower has the team’s next steps and references ready for review.');return;}
  say('I’ve found the references and allocated next steps to Roo, Tally and Kooka. Their updates and reminder drafts are ready for your review.', 'agent', ['schedule']);digger.say('Bower has the team’s next steps ready for review.');
}
$('#view').addEventListener('change',e=>{if(e.target.id==='photo-upload'&&e.target.files?.[0])acceptPhoto(e.target.files[0]);if(e.target.id==='whatsapp-file'&&e.target.files?.[0])loadWhatsAppFile(e.target.files[0]);});
$('#view').addEventListener('dragover',e=>{if(e.target.closest('#photo-drop-zone')){e.preventDefault();$('#photo-drop-zone').classList.add('dragging');}});
$('#view').addEventListener('dragleave',e=>{const zone=$('#photo-drop-zone');if(zone&&!zone.contains(e.relatedTarget))zone.classList.remove('dragging');});
$('#view').addEventListener('drop',e=>{if(!e.target.closest('#photo-drop-zone'))return;e.preventDefault();$('#photo-drop-zone').classList.remove('dragging');if(e.dataTransfer.files[0])acceptPhoto(e.dataTransfer.files[0]);});
$('#view').addEventListener('paste',e=>{if(page!=='workspace')return;const f=[...(e.clipboardData?.files||[])].find(f=>f.type.startsWith('image/'));if(f){e.preventDefault();acceptPhoto(f);}});

$('#view').addEventListener('submit',e=>{
  e.preventDefault();if(busy)return;
  if(e.target.classList.contains('review-reply')){const id=e.target.dataset.reviewId;try{const item=reviews.find(r=>r.id===id);const reply=reviewReplies[id]||'';if(item?.audience==='social'&&publicIssues(reply).length)throw new Error('Remove private identifiers before returning public copy.');const done=resolveReview(reviews,id,reply);reviews=done.entries;const m={who:'agent',name:'Digger · reviewed reply',text:done.entry.reply,citations:done.entry.citations,reviewId:id};if(done.entry.audience==='workspace')messages.push(m);else roleMessages[done.entry.audience].push(m);delete reviewReplies[id];render();}catch(err){$('#error-'+id).textContent=err.message;}return;}
  if(e.target.id==='whatsapp-form'){ingestWhatsApp($('#whatsapp-text').value);return;}
  if(e.target.id==='role-form'){const id=e.target.dataset.role,text=$('#role-note').value.trim();if(!text)return;roleInputs[id]='';roleMessages[id].push({who:'you',name:id==='admin'?'Employee':ROLES[id].name,text});answerQuestion(text,id);return;}
  if(e.target.id!=='founder-form')return;
  const text=$('#founder-note').value.trim();if(!text)return;inputNote='';say(text,'you');
  if(/^(?:digger[,! ]*)?(?:please )?dance[!. ]*$/i.test(text)){digger.dance();say('Digger’s dancing.');return;}
  if(pack&&/\b(short(?:en|er)?|concise|brief)\b/i.test(text)){
    const id=/instagram|social|story/i.test(text)?'social':/client|tally/i.test(text)?'client':'admin';const d=pack.drafts.find(d=>d.id===id);
    d.body=(pack.sampleProject?shortSampleUpdates(knowledgePack()):shortUpdates())[id];pack.approved=false;say(`I’ve shortened ${ROLES[id].name}’s update.`);return;
  }
  answerQuestion(text,'workspace');
});
async function answerQuestion(question,audience){
  const token=++sequence;busy=true;render();
  let answer;try{await ensureProject();if(token!==sequence)return;const context=knowledgePack();const history=(audience==='workspace'?messages:roleMessages[audience]).filter(m=>!(m.who==='you'&&m.text===question));answer=audience==='admin'?coachEmployee({question,pack:context,history}):askBower({question,audience,pack:context,history});}catch(err){if(token!==sequence)return;busy=false;say(err.message);return;}
  for(const step of answer.steps){if(token!==sequence)return;map.play(step);await new Promise(resolve=>setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:180));}
  if(token!==sequence)return;busy=false;
  let reviewId=null;if(answer.needsReview){const queued=queueReview(reviews,{question,audience,reason:answer.reviewReason||'Further confirmation required.',citations:answer.citations||[]});reviews=queued.entries;reviewId=queued.entry.id;answer.text+='\n\n'+(queued.duplicate?'This question is already waiting in Digger’s review queue.':'I’ve added your question to Digger’s review queue. You can see the reviewed reply here once Digger responds in this session.');}
  const message={who:'agent',name:audience==='admin'?'Roo':'Bower',text:answer.text,citations:answer.citations,needsReview:answer.needsReview,reviewId,consultation:answer.consultation};
  if(audience==='workspace')messages.push(message);else roleMessages[audience].push(message);
  render();
}
$('#view').addEventListener('input',e=>{
  if(e.target.dataset.replyId)reviewReplies[e.target.dataset.replyId]=e.target.value;
  if(e.target.id==='whatsapp-text')whatsappDraft.text=e.target.value;
  if(e.target.id==='founder-note')inputNote=e.target.value;
  if(e.target.id==='role-note')roleInputs[page]=e.target.value;
  if(e.target.dataset.review&&pack){
    const id=e.target.dataset.review;pack.drafts.find(d=>d.id===id).body=e.target.value;pack.approved=false;
    $(`[data-pane="${id}"] .pane-body`).textContent=e.target.value;
    $('[data-action="approve"]').disabled=false;$('[data-action="approve"]').textContent='Approve updates';
    $('[data-action="export"]').disabled=true;$('.parallel-heading>span').textContent='Ready to review';
    $('#pack-error').textContent='';return;
  }
  if(!e.target.dataset.draft||!pack)return;
  const id=e.target.dataset.draft;pack.drafts.find(d=>d.id===id).body=e.target.value;pack.approved=false;
  $('.editor-heading span').textContent='Draft';
  if(id==='social'){const issues=publicIssues(e.target.value);$('#privacy-result').textContent=issues.length?`Remove private information: ${issues.join(', ')}`:`Public name: ${esc(CONTEXT.publicName)}`;$('#privacy-result').classList.toggle('has-error',!!issues.length);$('[data-public-caption]').textContent=e.target.value;}
});
$('#view').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.action==='download-post'){downloadPhotoPost().catch(err=>{const t=$('#toast');t.textContent=err.message;t.classList.add('show');});return;}
  if(b.dataset.action==='wiki'){wikiOpen=!wikiOpen;render();return;}
  if(b.dataset.action==='whatsapp'){whatsappOpen=!whatsappOpen;render();return;}
  if(b.dataset.action==='sample-photo'){useSamplePhoto();return;}
  if(b.dataset.action==='sample-whatsapp'){whatsappDraft={text:sampleProject.assets.transcript,fileName:'Reviewed WhatsApp demo transcript',note:'Reviewed transcript of the supplied screenshot. Confirm the text before collecting it.'};whatsappOpen=true;render();$('#whatsapp-text')?.focus();return;}
  if(b.dataset.open){page=b.dataset.open;render();window.scrollTo(0,0);return;}
  if(b.dataset.action==='approve'){try{pack=approvePack(pack);render();}catch(err){$('#pack-error').textContent=err.message;}}
  if(b.dataset.action==='export'&&pack?.approved){const text=['# Approved construction update pack','Local approval only. Nothing dispatched. Reminders are drafts, not scheduled.',...pack.drafts.map(d=>`## ${d.title}\nAudience: ${d.to}\nChannel: ${d.channel}\nTask: ${d.taskTitle}\nReminder draft: ${d.reminder}\n\n${d.body}\n\nEvidence:\n${d.citations.map(id=>{const s=sourceById(id);return s?`${s.title}: ${s.evidence}${s.locator?`\nLocation: ${s.locator}`:''}${s.url?`\nSource: ${new URL(s.url,window.location.href).href}`:''}`:id;}).join('\n\n')}`)].join('\n\n');const url=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));const a=document.createElement('a');a.href=url;a.download='approved-construction-updates.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
});
document.querySelector('.roles').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b){page=b.dataset.page;render();window.scrollTo(0,0);}});
$('#resetBtn').addEventListener('click',()=>{sequence++;busy=false;setPhoto(null);reviews=[];reviewReplies={};wikiEntries=[];wikiOpen=false;whatsappOpen=false;whatsappDraft={text:'',fileName:'Pasted WhatsApp message',note:''};messages=[];inputNote='';roleMessages={admin:[],client:[],social:[]};roleInputs={admin:'',client:'',social:''};$('#trace').innerHTML='';digger.reset();map=createMap($('#agentMap'),{},pics);page='workspace';render();});
$('#danceBtn').addEventListener('click',()=>digger.dance());
$('#soundBtn').addEventListener('click',e=>{const on=e.target.getAttribute('aria-pressed')!=='true';e.target.setAttribute('aria-pressed',String(on));e.target.textContent=on?'Voice on':'Voice off';digger.setSound(on);});
render();
ensureProject().then(render).catch(err=>say(err.message));
