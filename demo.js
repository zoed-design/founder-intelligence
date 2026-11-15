import { buildPhotoPack, approvePack, publicIssues } from './src/agents.js';
import { SOURCES } from './src/photo-workflow.js';
import { CONTEXT, shortUpdates } from './src/demo-config.js';
import { CREW, portrait, mascot } from './src/crew.js';
import { createMap } from './src/map.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROLES={
  admin:{agent:'teamwork',name:'Roo',role:'Team',title:'Talk to Roo',greeting:'I’ll keep your site actions and project paperwork organised. What would you like to work on?'},
  client:{agent:'commercial',name:'Tally',role:'Client',title:'Talk to Tally',greeting:'Hello! I’m here to help you follow your home’s progress. What would you like to know?'},
  social:{agent:'content',name:'Kooka',role:'Instagram',title:'Kooka Stories',greeting:'Ready to tell the story behind your next site update.'},
};
let photo=null,pack=null,page='workspace',busy=false,sequence=0;
let messages=[],roleMessages={admin:[],client:[],social:[]},inputNote='',roleInputs={admin:'',client:'',social:''};
const pics=Object.fromEntries(Object.keys(CREW).map(id=>[id,portrait(id,160)]));
let map=createMap($('#agentMap'),{},pics);
const digger=mascot($('#mascot'),$('#bubble'));
const avatar=(id,large=false)=>pics[id]?`<img class="ava ${large?'lg':''}" src="${pics[id]}" alt="${esc(CREW[id].name)}">`:'';

function render(){
  document.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-current',b.dataset.page===page?'page':'false'));
  document.querySelector('.steps').hidden=page==='client'||page==='social';
  $('#view').innerHTML=page==='workspace'?workspace():rolePage(page);
  const chat=$('.founder-thread');if(chat)chat.scrollTop=chat.scrollHeight;
}
function chatMessages(list){return list.map(m=>`<div class="chat-message ${m.who==='you'?'founder-message':'agent-message'}"><b>${esc(m.who==='you'?'You':m.name||'Digger')}</b><p>${esc(m.text)}</p></div>`).join('');}
function workspace(){return `<div class="hello"><div><h1>One site update. The crew takes it from here.</h1></div></div>
  <section class="card founder-chat" aria-labelledby="conversation-title" id="photo-drop-zone">
  <div class="chat-heading">${avatar('router')}<div><h2 id="conversation-title">Talk to Digger</h2><span>Site Manager</span></div></div>
  <div class="founder-thread" aria-live="polite"><div class="chat-message agent-message"><b>Digger</b><p>Please drop your latest site photo and I’ll flag it to the rest of the team. You’ll review their updates here.</p></div>${chatMessages(messages)}</div>
  ${photo?`<figure class="selected-photo"><img src="${esc(photo.url)}" alt="Your uploaded site photo"><figcaption>${esc(photo.name)}</figcaption></figure>`:''}
  <form id="founder-form" class="message-composer"><label class="photo-button" title="Attach a site photo"><span aria-hidden="true">＋</span><span class="sr">Attach a site photo</span><input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp" class="sr" ${busy?'disabled':''}></label><label class="sr" for="founder-note">Message Digger or drop a photo</label><textarea id="founder-note" placeholder="Message Digger or drop a photo here…" ${busy?'disabled':''}>${esc(inputNote)}</textarea><button class="send-message" aria-label="Send message" ${busy?'disabled':''}>↑</button></form>
  ${busy?'<div class="working-status" role="status"><span></span>Digger is coordinating with the team…</div>':''}</section>${pack?parallelPanes():''}`;}
function parallelPanes(){return `<section class="parallel-section" aria-labelledby="team-title"><div class="parallel-heading"><h2 id="team-title">From your team</h2><span>${pack.approved?'Approved':'Ready to review'}</span></div><div class="parallel-panes">${pack.drafts.map(d=>{const r=ROLES[d.id];return `<article class="team-pane" data-pane="${d.id}"><div class="pane-heading">${avatar(r.agent)}<div><h3>${r.name}</h3><span>${r.role}</span></div></div><div class="pane-body">${esc(d.body)}</div><details class="review-editor"><summary>Edit update</summary><label class="sr" for="review-${d.id}">Edit ${r.role} update</label><textarea id="review-${d.id}" data-review="${d.id}">${esc(d.body)}</textarea></details><button class="btn btn-line" data-open="${d.id}">${d.id==='social'?'Open Instagram':'Open conversation'}</button></article>`;}).join('')}</div>${approvalButtons()}<p id="pack-error" class="error-text" role="alert"></p></section>`;}
function approvalButtons(){return `<div class="pack-actions"><button class="btn btn-ok" data-action="approve" ${pack.approved?'disabled':''}>${pack.approved?'Approved':'Approve updates'}</button><button class="btn btn-line" data-action="export" ${pack.approved?'':'disabled'}>Download updates</button></div>`;}
function rolePage(id){
  const r=ROLES[id];if(!r)return workspace();const d=pack?.drafts.find(d=>d.id===id);
  if(id==='social')return instagramPage(r,d);
  return `<div class="hello role-hello">${avatar(r.agent,true)}<div><h1>${r.title}</h1><p>${r.role}</p></div></div><section class="card role-conversation"><div class="founder-thread" aria-live="polite"><div class="chat-message agent-message"><b>${r.name}</b><p>${r.greeting}</p></div>${d?`<div class="chat-message agent-message"><b>${r.name}</b><p>${esc(d.body)}</p></div>`:''}${chatMessages(roleMessages[id])}</div><form class="message-composer" id="role-form" data-role="${id}"><label class="sr" for="role-note">Message ${r.name}</label><textarea id="role-note" placeholder="Message ${r.name}…">${esc(roleInputs[id])}</textarea><button class="send-message" aria-label="Send message">↑</button></form></section>${d&&id==='admin'?editor(d):''}`;
}
function instagramPage(r,d){return `<div class="hello role-hello">${avatar(r.agent,true)}<div><h1>Kooka Stories</h1><p>Instagram</p></div></div><section class="card instagram-card"><div class="instagram-top">${avatar('content')}<div><b>${esc(CONTEXT.instagramHandle)}</b><span>${d?esc(CONTEXT.publicName):'Stories from your site'}</span></div><span class="instagram-word">Instagram</span></div><div class="instagram-art"><span>${d?'The details behind the roofline.':'Your next story starts here.'}</span></div><div class="instagram-icons" aria-hidden="true">♡ &nbsp; ◯ &nbsp; ↗</div><p class="instagram-caption" data-public-caption>${esc(d?d.body:r.greeting)}</p></section>${d?editor(d):''}`;}
function editor(d){const issues=d.id==='social'?publicIssues(d.body):[];const heading={admin:'Site action pack',client:'Client update',social:'Instagram caption'}[d.id];return `<section class="card draft-editor"><div class="editor-heading"><h2>${heading}</h2><span>${pack.approved?'Approved':'Draft'}</span></div><label class="sr" for="draft-body">Edit ${heading}</label><textarea id="draft-body" data-draft="${d.id}">${esc(d.body)}</textarea>${d.id==='social'?`<p id="privacy-result" class="privacy-result ${issues.length?'has-error':''}" aria-live="polite">${issues.length?`Remove private information: ${issues.join(', ')}`:`Public name: ${esc(CONTEXT.publicName)}`}</p>`:''}<details class="evidence"><summary>Sources</summary>${d.citations.map(id=>sourceHtml(SOURCES.find(s=>s.id===id))).join('')}</details></section>`;}
function sourceHtml(s){return `<div class="source-detail"><b>${esc(s.title)}</b><p>${esc(s.evidence)}</p><small>${esc(s.file)}</small></div>`;}
function say(text,who='agent'){messages.push({who,text});render();}
function setPhoto(next){if(photo?.url?.startsWith('blob:'))URL.revokeObjectURL(photo.url);photo=next;pack=null;}

async function acceptPhoto(file){
  if(busy)return;
  const uploadToken=++sequence;busy=true;
  try{
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024)throw new Error('Please choose a JPEG, PNG or WebP photo smaller than 12 MB.');
    const bitmap=await createImageBitmap(file);bitmap.close();
    if(uploadToken!==sequence)return;
    const note=inputNote.trim();inputNote='';setPhoto({url:URL.createObjectURL(file),name:file.name});roleMessages={admin:[],client:[],social:[]};
    await prepare(note);
  }catch(err){if(uploadToken!==sequence)return;busy=false;say(err.message);}
}
async function prepare(note){
  const token=++sequence;busy=true;pack=null;say(note||'Shared a site photo.','you');
  const next=buildPhotoPack({note,photoName:photo.name});$('#trace').innerHTML='';
  for(const s of next.steps){if(token!==sequence)return;map.play(s);$('#trace').insertAdjacentHTML('beforeend',`<li>${esc(s.detail)}</li>`);await new Promise(resolve=>setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:200));}
  if(token!==sequence)return;pack=next;busy=false;say('I’ve flagged this to Roo, Tally and Kooka. Their updates are ready below — site actions, the client update and an Instagram story.');digger.say('The team’s updates are ready for you.');
}
$('#view').addEventListener('change',e=>{if(e.target.id==='photo-upload'&&e.target.files?.[0])acceptPhoto(e.target.files[0]);});
$('#view').addEventListener('dragover',e=>{if(e.target.closest('#photo-drop-zone')){e.preventDefault();$('#photo-drop-zone').classList.add('dragging');}});
$('#view').addEventListener('dragleave',e=>{const zone=$('#photo-drop-zone');if(zone&&!zone.contains(e.relatedTarget))zone.classList.remove('dragging');});
$('#view').addEventListener('drop',e=>{if(!e.target.closest('#photo-drop-zone'))return;e.preventDefault();$('#photo-drop-zone').classList.remove('dragging');if(e.dataTransfer.files[0])acceptPhoto(e.dataTransfer.files[0]);});
$('#view').addEventListener('paste',e=>{if(page!=='workspace')return;const f=[...(e.clipboardData?.files||[])].find(f=>f.type.startsWith('image/'));if(f){e.preventDefault();acceptPhoto(f);}});

$('#view').addEventListener('submit',e=>{
  e.preventDefault();if(busy)return;
  if(e.target.id==='role-form'){const id=e.target.dataset.role,text=$('#role-note').value.trim();if(!text)return;roleInputs[id]='';roleMessages[id].push({who:'you',text});roleMessages[id].push({who:'agent',name:ROLES[id].name,text:roleAnswer(id,text)});render();return;}
  if(e.target.id!=='founder-form')return;
  const text=$('#founder-note').value.trim();if(!text)return;inputNote='';say(text,'you');
  if(!pack){say('Please drop your latest site photo here, and I’ll flag it to the rest of the team.');return;}
  if(/\b(why|source|evidence|basis)\b/i.test(text)){say('This presentation uses fictional project details and a generic framing workflow. Roo has the inspection and documentation follow-up. You can read each update’s reference notes on its page.');return;}
  if(/\b(short(?:en|er)?|concise|brief)\b/i.test(text)){
    const id=/instagram|social|story/i.test(text)?'social':/client|tally/i.test(text)?'client':'admin';const d=pack.drafts.find(d=>d.id===id);
    d.body=shortUpdates()[id];pack.approved=false;say(`I’ve shortened ${ROLES[id].name}’s update.`);return;
  }
  say('Roo has the site actions, Tally has the client update, and Kooka has the Instagram story. Open their pages to continue the conversation or review an update.');
});
function roleAnswer(id,text){
  if(!pack)return id==='client'?'I’ll have a project update for you once the site manager shares the latest progress. You can ask me about the next steps then.':'Once the site manager shares an update, I’ll organise the project actions here.';
  if(id==='client'){
    if(/price|margin|markup|supplier|profit|internal|quote|cost/i.test(text))return 'I can help with your progress and next steps. For pricing or contract questions, I’ll refer you to your project contact.';
    if(/bank|lender|claim|pay/i.test(text))return 'The next progress claim is planned after the required sign-off and lender checks. We’ll keep you informed before the paperwork progresses.';
    if(/when|date|inspect|certif/i.test(text))return 'The team will confirm inspection readiness and arrange the certifier’s visit. The appointment is not confirmed yet; we’ll let you know once it is booked.';
    if(/roof|pitch|fall/i.test(text))return 'The team will review the roof drainage and framing details against the applicable drawings as part of the next steps.';
    return 'The timber framing and roof structure are taking shape. Next, the team will confirm readiness for inspection and keep you updated on the following milestones.';
  }
  if(/drawing|roof|pitch/i.test(text))return 'Check the relevant wall, roof and drainage details against current issued drawings. Record any engineer or certifier confirmation required before the work is covered.';
  if(/claim|bank|lender/i.test(text))return 'Prepare progress photos and the required claim documents. Hold submission until inspection sign-off and lender eligibility checks are complete.';
  return 'Next actions: confirm readiness with the site manager, request the framework inspection, reconcile drawing revisions, and prepare the frame claim evidence. No appointment or submission is confirmed yet.';
}
$('#view').addEventListener('input',e=>{
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
  if(b.dataset.open){page=b.dataset.open;render();window.scrollTo(0,0);return;}
  if(b.dataset.action==='approve'){try{pack=approvePack(pack);render();}catch(err){$('#pack-error').textContent=err.message;}}
  if(b.dataset.action==='export'&&pack?.approved){const text=['# Approved construction update pack','Local approval only. Nothing dispatched.',...pack.drafts.map(d=>`## ${d.title}\nAudience: ${d.to}\nChannel: ${d.channel}\n\n${d.body}\n\nEvidence: ${d.citations.join(', ')}`)].join('\n\n');const url=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));const a=document.createElement('a');a.href=url;a.download='approved-construction-updates.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
});
document.querySelector('.roles').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b){page=b.dataset.page;render();window.scrollTo(0,0);}});
$('#resetBtn').addEventListener('click',()=>{sequence++;busy=false;setPhoto(null);messages=[];inputNote='';roleMessages={admin:[],client:[],social:[]};roleInputs={admin:'',client:'',social:''};$('#trace').innerHTML='';map=createMap($('#agentMap'),{},pics);page='workspace';render();});
$('#danceBtn').addEventListener('click',()=>digger.dance());
$('#soundBtn').addEventListener('click',e=>{const on=e.target.getAttribute('aria-pressed')!=='true';e.target.setAttribute('aria-pressed',String(on));e.target.textContent=on?'Voice on':'Voice off';digger.setSound(on);});
render();
