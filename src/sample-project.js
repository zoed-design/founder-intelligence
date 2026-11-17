import {takeoffKnowledge} from './takeoff-knowledge.js?v=image-wiki-1';
import {findWikiMessage,wikiMessageSources} from './session-wiki.js?v=image-wiki-1';
import {answerPlanningQuestion} from './planning-knowledge.js?v=image-wiki-1';
const FILE=/^sample-data\/[a-z0-9._-]+(?:#page=\d+)?$/i;
const day=s=>s?new Date(s+'T00:00:00Z').toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):'not recorded';
const round=n=>Math.round(n*1000)/1000;
export function validateSampleProject(p){
 if(p?.schemaVersion!==2||p.id!=='demo-18-maroubra'||typeof p.title!=='string'||typeof p.publicName!=='string')throw new Error('Unsupported sample project.');
 for(const [obj,keys] of [[p.drawing,['pitchDegrees','wallTopRL','roofFFLRL','levelOneFFLRL']],[p.conversation,['estimatedHeightM','additionalHeightMm','pitchDegrees']]])for(const key of keys)if(!Number.isFinite(obj?.[key])||Math.abs(obj[key])>10000)throw new Error('Invalid sample numeric value.');
 if(!Array.isArray(p.schedule?.rows)||!p.schedule.rows.length)throw new Error('Sample schedule is missing.');
 const rows=new Set();for(const r of p.schedule.rows){if(!Number.isInteger(r.sourceRow)||rows.has(r.sourceRow)||typeof r.task!=='string'||typeof r.stage!=='string')throw new Error('Invalid sample schedule row.');rows.add(r.sourceRow);for(const key of ['start','finish'])if(r[key]!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(r[key])||new Date(r[key]).toISOString().slice(0,10)!==r[key]))throw new Error('Invalid sample date.');}
 for(const key of ['roofCovering','roofFrame','practicalCompletion','ocChecklist','ocSubmission','ocReceipt'])if(!rows.has(p.schedule.milestones?.[key]))throw new Error('A required sample milestone is missing.');
 if(!Array.isArray(p.checklist)||!p.checklist.some(x=>x.number===21))throw new Error('Sample checklist is incomplete.');
 const ids=new Set();for(const s of p.sources||[]){if(!/^sample-[a-z-]+$/.test(s.id)||ids.has(s.id)||!FILE.test(s.url)||!['internal','customer-safe','public'].includes(s.tier))throw new Error('Invalid sample source.');ids.add(s.id);}
 for(const id of ['sample-chat','sample-roof','sample-elevation','sample-structure','sample-schedule','sample-oc','sample-progress','sample-public','sample-photo','sample-markup'])if(!ids.has(id))throw new Error('A required sample reference is missing.');
 if(p.assets?.illustrativeWhatsappHash&&!/^[a-f0-9]{64}$/.test(p.assets.illustrativeWhatsappHash))throw new Error('Invalid illustrative screenshot hash.');
 if(!Array.isArray(p.downloads)||p.downloads.some(s=>!FILE.test(s.url))||!FILE.test(p.assets?.photo)||!FILE.test(p.assets?.roofMarkup)||!/^[a-f0-9]{64}$/.test(p.assets?.whatsappHash))throw new Error('Invalid sample asset.');return p;
}
const milestone=(p,key)=>p.schedule.rows.find(r=>r.sourceRow===p.schedule.milestones[key]);
export function sampleFindings(project){const p=validateSampleProject(project),d=p.drawing,c=p.conversation;return {wallHeightM:round(d.wallTopRL-d.levelOneFFLRL),roofHeightM:round(d.roofFFLRL-d.levelOneFFLRL),differenceMm:round((d.wallTopRL-d.roofFFLRL)*1000),roofCovering:milestone(p,'roofCovering'),chatMatchesHeight:Math.abs(c.additionalHeightMm-round((d.wallTopRL-d.roofFFLRL)*1000))<1,chatMatchesPitch:c.pitchDegrees===d.pitchDegrees,missingRoofDates:!milestone(p,'roofCovering').start||!milestone(p,'roofCovering').finish};}
function roofFinding(p,f){return `The elevation gives ${f.roofHeightM.toFixed(2)} m from level 1 FFL to roof FFL and ${f.wallHeightM.toFixed(2)} m to top of wall: a ${f.differenceMm} mm difference. The chat requests ${p.conversation.additionalHeightMm} mm; this ${f.chatMatchesHeight?'matches':'does not match'} the level difference. The drawing labels a ${p.drawing.pitchDegrees}° fall; the chat states ${p.conversation.pitchDegrees}° (${f.chatMatchesPitch?'matching':'needs reconciliation'}). These are drawing-level checks, not photo measurements or a uniform wall-height instruction. Check openings and the local profile before changing the takeoff.`;}
function scheduleFinding(p,key){const r=milestone(p,key);return `${r.task}: projected start ${day(r.start)}; projected completion ${day(r.finish)} (Maroubra!E${r.sourceRow}:F${r.sourceRow}).`;}
function checklistText(p,selected){return p.checklist.filter(x=>!selected||selected.includes(x.number)).map(x=>`Item ${x.number}: ${x.requirement}.`).join('\n');}
function clientDates(p,kind){
 if(kind==='roof')return `I know the roof milestone matters when you’re planning ahead. The current project schedule plans roof covering from ${day(milestone(p,'roofCovering').start)} to ${day(milestone(p,'roofCovering').finish)}. ${milestone(p,'roofCovering').note||''} We’re working to that projected window and will confirm any changes with you. This is a planned finish, not confirmation that the roof is complete or an inspection is signed off. We’ll keep you posted at the next milestone and sooner if the site manager confirms a change.`;
 if(kind==='oc')return `I understand how important it is to plan your move. The schedule currently projects receipt of the Occupation Certificate (OC) on ${day(milestone(p,'ocReceipt').finish)}. It plans the updated checklist for ${day(milestone(p,'ocChecklist').start)} and completion/submission of the requirements for ${day(milestone(p,'ocSubmission').finish)}. This is a planning target. The responsible certifier must issue the OC and the required approvals must be confirmed before move-in; the schedule alone does not confirm permission to occupy.`;
 const r=milestone(p,'practicalCompletion');return r.finish?`I know a reliable finish date helps you plan. The Practical Completion milestone is projected for ${day(r.finish)}. It remains a planning target, subject to confirmation by the site manager; it is separate from an issued OC and permission to move in. We’ll keep you informed as inspections and other dependencies are reviewed, and explain any confirmed change to the program.`:`I know having a reliable finish date matters to you. The schedule’s Practical Completion milestone has no projected date, so I don’t want to give you an unsupported whole-project finish date. The separate OC receipt target is ${day(milestone(p,'ocReceipt').finish)}; that is not a confirmed construction finish or move-in date. Digger needs to confirm the practical-completion milestone. We’ll keep you posted as the site team reviews inspections and other dependencies, with a revised projection once the program is confirmed.`;
}
export function sampleBrandStory(p){return `The care behind the roofline. 🏡

At our ${p.publicName}, the framework is taking shape—and with it, the outline of a future home.

Before a roof becomes shelter, there are details to work through—and people making sure those details receive the attention they deserve.

This framing-stage photo captures one chapter of that process: the timber structure taking shape, with the work that will eventually sit behind the finished ceilings still visible.

Building a home is a sequence of decisions, checks and conversations. Sharing that journey gives our clients a clearer picture of the care behind their future home.

Progress you can see. Care in the details you might never see.

#BehindTheBuild #RoofFraming #ConstructionDetails #SydneyBuilders #BuildingWithCare`;}

export function buildSamplePack({project,photoName='',note='',wikiEntries=[]}={}){
 const p=validateSampleProject(project),f=sampleFindings(p);
 const hasConversation=wikiEntries.some(e=>/800|5\s*(?:°|degree)|takeoff|markup/i.test(e.text))||/takeoff|markup|height|pitch|800|elevation/i.test(note);
 const admin=`Roofing follow-up for ${p.title}\n\n1. ${scheduleFinding(p,'roofFrame')}\n2. ${scheduleFinding(p,'roofCovering')} ${f.roofCovering.note||''}\n3. Confirm the applicable frame/roof inspection hold points with Digger and the responsible certifier before covering relevant work. A missing inspection detail is not evidence that inspection is unnecessary. Record readiness and the confirmed booking.\n4. Ask the roofing contractor for the Metal sheet (Colorbond) roofing certificate listed at OC checklist item 21; collect the structural engineer’s inspection reports listed at item 2. Check names, installed system and document references against the issued project documents.\n5. Track outstanding items, responsible people and follow-up dates; ask Digger to review discrepancies before changing work or promising dates.${hasConversation?`\n\nSeparately, the reported chat / markup needs a takeoff review: ${roofFinding(p,f)}`:''}\n\n${photoName?'A site photo accompanies this update. It does not establish dimensions, inspection readiness or completion. ':''}Nothing is booked, sent or certified.${note.trim()?`\n\nUser note (unverified):\n${note.trim()}`:''}`;
 const drafts=[
 {id:'admin',agent:'teamwork',tier:'internal',title:'Roofing employee coaching guide',to:'Kira',channel:'Employee coaching draft',body:admin,citations:['sample-schedule','sample-oc','sample-structure',...(hasConversation?['sample-chat','sample-roof','sample-elevation','sample-markup']:[])],taskTitle:'Coordinate roof follow-up and check the certificate requirements',reminder:'Confirm inspection hold points, certificates and any actual program changes with Digger.'},
 {id:'client',agent:'commercial',tier:'customer-safe',title:'Client roof progress update',to:'Demo Homeowner',channel:'WhatsApp draft',body:`Hi, here’s the current roofing plan for your home at ${p.title}.\n\n${clientDates(p,'roof')}\n\nWe’ll keep you updated on the next milestone and any confirmed changes.`,citations:['sample-progress'],taskTitle:'Explain the roof-covering plan clearly to the client',reminder:'Confirm changes before sending the next milestone or weekly update.'},
 {id:'social',agent:'content',tier:'public',title:'Brand story',to:p.publicName,channel:'Instagram draft',body:sampleBrandStory(p),citations:['sample-public'],taskTitle:'Prepare the brand story for human review',reminder:'Get Digger’s approval before using the story externally.'}
 ].map(d=>({...d,status:'draft'}));
 const steps=[{agent:'source',to:'router',alsoTo:'capture',detail:'The site update reaches Digger and Lyra for the one selected project.'},{agent:'router',to:'capture',detail:'Digger shares the site context with Lyra.'},{agent:'capture',to:'router',detail:'Lyra returns labelled project context to Digger.'},{agent:'capture',to:'kb',detail:'Lyra organises this site update and its available context in the session Wiki.'},{agent:'router',to:'curator',detail:'Digger asks Bower for references and next steps.'},{agent:'curator',to:'kb',detail:'Bower retrieves the projected roof dates and document requirements.'},{agent:'kb',to:'curator',detail:'The Wiki returns source rows, checklist items and drawing references.'},{agent:'curator',to:'router',detail:'Bower returns the planned dates and flags uncertainties for Digger review.'},...drafts.map(d=>({agent:'curator',to:d.agent,detail:`Bower allocates: ${d.taskTitle}.`}))].map((s,i)=>({...s,action:'prepared',itemId:p.id,t:String(i+1)}));
 return {drafts,steps,photoName,sourceNote:note,approved:false,sampleProject:p,wikiEntries,sources:[...p.sources,...(p.regulatory?.references||[]),...wikiMessageSources(wikiEntries)],findings:f};
}
function answerSingleQuestion({question='',audience='workspace',pack}={}){
 if(/\b(?:weather|rain\w*|forecast|storm\w*)\b|天气|下雨|降雨/i.test(question))return {text:'That’s a good question. I don’t have a confirmed forecast to assess the impact on your work. Digger should check the current site conditions and programme before confirming a change.',citations:[],needsReview:true,reviewReason:'Forecast and site conditions need confirmation.'};
 const planning=answerPlanningQuestion({question,audience,registry:pack.sampleProject.regulatory});if(planning)return planning;
 const p=pack.sampleProject,f=sampleFindings(p),internal=['workspace','admin'].includes(audience),q=question;
 const result=(text,citations=[])=>({text,citations});
 if(!internal&&/price|margin|markup|supplier|profit|internal|quote|cost|lender|bank|contract|drawing|height|pitch|800|FFL|millimetre|technical|mark\b|kira\b|whatsapp|private/i.test(q))return result(audience==='social'?'Digger needs to review that request before any public use.':'I can help with the project plan and milestones. Digger reviews technical, pricing and private team questions.');
 if(audience==='social'&&/story|caption/i.test(q)&&!/source|reference|approved|finished|complete|passed|certified|inspection/i.test(q))return result(sampleBrandStory(p),['sample-public']);
 if(audience==='social')return /story|caption|source|reference|progress|roof|next|task|remind|date|finish/i.test(q)?result(`The reviewed story context supports careful drawing review and coordination at ${p.publicName}. It does not approve a completion claim or private schedule dates. The story remains a draft.`,['sample-public']):result('There is no supported public story context for that question.');
 const oc=/\b(?:OC|OCC)\b|occupan|occupation|move.?in/i.test(q),when=/when|date|time|finish|complet|receive|ready|how long|move.?in/i.test(q);
 const extraSchedule=lookupSchedule(p,q,internal);if(extraSchedule)return result(extraSchedule,['sample-progress']);
 if(!internal){
  if(oc&&when)return result(clientDates(p,'oc'),['sample-progress']);
  if((/whole|entire|practical|handover|overall/i.test(q)||(/project|construction|building|house|home/i.test(q)&&when&&!/roof/i.test(q))))return result(clientDates(p,'project'),['sample-progress'],'project');
  if(/roof/i.test(q))return result(clientDates(p,'roof'),['sample-progress'],'roof');
  if(/schedule|progress|milestone|next|source|reference/i.test(q))return result(clientDates(p,'roof')+'\n\n'+clientDates(p,'project'),['sample-progress'],'project');
  if(when&&/^when (?:will )?it finish\??$/i.test(q.trim()))return result('Which milestone would you like to check: roof covering, practical completion or receipt of the OC?');
  if(when)return retrieveRelevant(question,audience,pack);
  return retrieveRelevant(question,audience,pack);
 }
 const knowledge=pack.wikiEntries?.map(e=>takeoffKnowledge(e,p)).filter(Boolean).at(-1);if(knowledge&&/takeoff|SOP|estimat|quantit|ordering|useful knowledge/i.test(q))return {text:knowledge.body,citations:knowledge.citations,needsReview:true,reviewReason:'Takeoff SOP draft needs Digger review before estimating or ordering use.'};
 if(/whatsapp|message|chat|what did (?:mark|kira)|latest (?:note|update)/i.test(q)){
  const entry=/latest|most recent|last message/i.test(q)?pack.wikiEntries?.at(-1):(findWikiMessage(q,pack.wikiEntries)||pack.wikiEntries?.at(-1));
  if(entry?.attachment&&!entry.text)return {text:'The original WhatsApp screenshot and its drawings are attached to this Wiki source. Digger’s visual review is pending, so I’m keeping the image available rather than guessing its contents.',citations:[entry.id],needsReview:true,reviewReason:'Read the original screenshot and confirm its drawing context.'};
  if(entry)return result(`Lyra collected this message into the ${p.title} Wiki, tagged ${entry.tags.join(', ')}:\n\n${entry.text}\n\nUser-supplied and unverified. It does not replace the issued drawings, projected schedule or certifier’s decision.`,[entry.id]);
  return result(`The supplied WhatsApp transcript records Kira’s 2.7 m estimate, Mark’s 800 mm correction and a 5° fall. It is a reported conversation, not an approved change.`,['sample-chat','sample-markup']);
 }
 if(/source|evidence|basis|reference|wiki/i.test(q)&&!/inspect|certific|roof|when|date/i.test(q))return result('Bower uses this one project’s reviewed schedule rows, CDC drawing extracts, structural notes, OC checklist, site photo, roof markup and WhatsApp transcript. Manually imported messages appear separately as unverified session sources.',['sample-schedule','sample-roof','sample-elevation','sample-structure','sample-oc','sample-photo','sample-markup','sample-chat']);
 if(/\broof(?:ing)?\b|colorbond|metal sheet/i.test(q)&&/certificate|certification|document/i.test(q))return result(`Yes—the supplied OC checklist includes item 21: “Metal sheet (Colorbond) roofing certificate.” Confirm that this item applies to the installed roof system and ask the roofing contractor for the required certificate in the certifier’s accepted form. Item 2 separately requests structural engineer’s inspection reports. A certificate and an inspection booking are different records; these samples do not show that either is complete.`,['sample-oc']);
 if(/inspect|certifier visit|hold.?point|before.*cover/i.test(q))return result(`Work with Digger to confirm the applicable frame/roof inspection hold points with the responsible certifier while the relevant work remains visible. The supplied excerpts do not establish the exact mandatory roof inspection stage, booking date or notice period. This does NOT mean an inspection is unnecessary. Ask the responsible certifier to confirm the required hold points; do not invent an appointment.\n\n${scheduleFinding(p,'roofFrame')}\n${scheduleFinding(p,'roofCovering')}\n\nUse those projected windows to coordinate readiness; obtain confirmation before covering work that requires inspection. Keep structural engineer’s inspection reports (OC item 2) and, if applicable, the Metal sheet (Colorbond) roofing certificate (item 21). Record the inspection result and outstanding documents.`,['sample-schedule','sample-structure','sample-oc']);
 if(oc&&when)return result(clientDates(p,'oc')+'\n\n'+scheduleFinding(p,'ocReceipt'),['sample-schedule','sample-oc']);
 if((/whole|entire|practical|handover|overall/i.test(q)||(/project|construction|building|house|home/i.test(q)&&when&&!/roof/i.test(q))))return result(clientDates(p,'project'),['sample-schedule'],'project');
 if(/roof|roofing|roof cover/i.test(q)&&when)return result(scheduleFinding(p,'roofCovering')+' '+(f.roofCovering.note||'')+'\n\nThese are projected dates, not actual completion. Confirm actual readiness and any approved changes with Digger before making a commitment.',['sample-schedule'],'roof');
 const certificate=lookupCertificate(p,q);if(certificate)return result(certificate,['sample-oc']);
 if(oc||/checklist|certificate|compliance|documents/i.test(q))return result(ocPreparation(p),['sample-oc','sample-structure','sample-schedule']);
 if(/height|pitch|fall|wall|800|FFL|takeoff|estimate|measure|difference|elevation|markup/i.test(q))return result(roofFinding(p,f)+' Digger reviews the proposed correction before work or ordering.',['sample-chat','sample-roof','sample-elevation','sample-structure','sample-markup']);
 if(/roof|framing|truss/i.test(q))return result(scheduleFinding(p,'roofCovering')+' Check readiness with Digger, confirm the inspection hold points with the certifier, and collect the roof certificate listed at OC item 21.',['sample-schedule','sample-oc']);
 if(/claim|loan|lender|bank|cashflow|sign.?off|completed|finished/i.test(q))return result('The records do not establish actual completion, inspection sign-off, loan drawdown eligibility or an issued OC. A planned date, stage label, message or photo does not establish those outcomes.',['sample-schedule','sample-oc']);
 if(/task|remind|next|action|follow|todo/i.test(q))return result(pack.drafts.map(d=>`${{admin:'Roo',client:'Tally',social:'Kooka'}[d.id]}: ${d.taskTitle}. Reminder draft: ${d.reminder}`).join('\n\n')+'\n\nDigger reviews these drafts. No reminder has been scheduled.',['sample-schedule','sample-oc']);
 const entry=findWikiMessage(q,pack.wikiEntries);if(entry)return result(`A manually imported, unverified Wiki message may be relevant:\n\n${entry.text}\n\nAsk Digger to check it against the issued documents before acting.`,[entry.id]);
 return retrieveRelevant(question,audience,pack);
}
export function shortSampleUpdates(pack){const p=pack.sampleProject,f=sampleFindings(p);return {admin:`For ${p.title}: ${scheduleFinding(p,'roofCovering')} Confirm inspection hold points and OC items 2/21 with the certifier. Record readiness, the responsible person and outstanding documents before following up.`,client:clientDates(p,'roof'),social:`The care behind the roofline at our ${p.publicName}: thoughtful drawing review and coordination. Ready for the site manager’s review. #${p.publicName.replace(/\s/g,'')} #ConstructionDetails`};}

function ocPreparation(p){return `Start an OC document register for this project, then work through these steps:\n\n1. Get the current project-specific checklist from the responsible certifier and confirm which items apply. ${scheduleFinding(p,'ocChecklist')}\n2. Group the evidence by trade and approval: structural reports, surveys, waterproofing, glazing, electrical/plumbing, roofing, BASIX and external approvals. Use the numbered checklist below to keep the exact requirement with each record.\n3. Assign each applicable item to its contractor or consultant. Ask for the certificate or report in the certifier’s accepted form, with the correct project, work description, issuer, signature and referenced documents.\n4. Track requested, received, checked and outstanding items. Cross-reference inspection reports with certificates; a certificate is not a substitute for a required inspection. Resolve missing or inconsistent documents with Digger.\n5. Confirm the pack with Digger and the certifier before submission. ${scheduleFinding(p,'ocSubmission')}\n\nChecklist references (${p.checklist.length} supplied entries; original item numbers preserved):\n${checklistText(p)}\n\nThese are source-stated requirements. The records do not confirm that each item applies, has been received or is sufficient for an OC.`;}

const terms=q=>(String(q).toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>w.length>2&&!new Set(['for','how','can','get','our','all','any','are','the','not','who','won','ask','what','when','where','which','please','could','would','should','about','this','that','with','have','does','need','will','from','there','they','them','your','into','project','information','tell','give','more','home']).has(w));
export function retrieveRelevant(question,audience,pack){
 const internal=['workspace','admin'].includes(audience),p=pack.sampleProject;
 const keys=terms(question);const items=p.checklist.map(x=>({text:`OC checklist item ${x.number}: ${x.requirement}`,id:'sample-oc',tier:'internal'}));
 const allowed=(pack.sources||p.sources).filter(s=>internal||s.tier===(audience==='social'?'public':'customer-safe')||s.tier==='public').filter(s=>!s.id.startsWith('reg-'));
 const candidates=[...(internal?items:[]),...allowed.map(s=>({text:s.evidence,id:s.id,tier:s.tier}))].map(x=>({...x,score:keys.reduce((n,k)=>n+(new RegExp('\\b'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(x.text)?1:0),0)})).filter(x=>x.score>=2||(x.score===1&&keys.length<=2&&keys[0]?.length>=5)).sort((a,b)=>b.score-a.score).slice(0,3);
 if(candidates.length)return {text:`Here is the relevant information I found in the available records:\n\n${candidates.map(x=>x.text).join('\n\n')}\n\nThese excerpts may help, but they do not settle the full question. Digger should confirm how they apply to your request.`,citations:[...new Set(candidates.map(x=>x.id))],needsReview:true,reviewReason:'Relevant excerpts found; a project-specific answer needs confirmation.'};
 return {text:'That’s a good question. I don’t have a confirmed answer from the available records yet. I’ll put it in Digger’s review queue so it can be checked properly before you rely on it.',citations:[],needsReview:true,reviewReason:'No confirmed answer in the available records.'};
}

function contextQuestion(question,history){
 if(!/^(?:and\b|what about\b|how about\b|when will (?:it|that)\b|who (?:provides|supplies|issues|do i ask)|does that mean)/i.test(question))return question;
 const previous=[...(history||[])].reverse().find(m=>m.who==='you')?.text||'';
 const subject=/roof/i.test(previous)?(/certif/i.test(previous)?'roof covering certificate':'roof covering'):/\bOC\b|occup/i.test(previous)?'OC documents':/duplex|planning|current home/i.test(previous)?'duplex planning':/project|building|house/i.test(previous)?'whole project':'';
 return subject?question+' (about '+subject+')':question;
}
export function answerSampleQuestion({question='',audience='workspace',pack,history=[]}={}){
 const original=question;question=contextQuestion(question,history);
 // Resolve distinct questions independently. User text remains data, never instructions.
 let parts=question.split(/\?\s*(?=\S)|;\s*|\band\s+(?=(?:what|when|how|do|can|will|which|is|are|does)\b)/i).map(x=>x.trim()).filter(Boolean).slice(0,6);
 if(parts.length===1&&/roof/i.test(question)&&/entire|whole|overall/i.test(question)&&/finish|when|date|complet/i.test(question))parts=['When will roof covering finish?','When will the entire project finish?'];
 if(parts.length===1&&/\bOC\b|occupation/i.test(question)&&/documents|prepare|checklist/i.test(question)&&/roof/i.test(question)&&/certif/i.test(question)&&/\band\b/i.test(question))parts=['How do I prepare the OC documents?','What certificate do I need for roof covering?'];
 let result;
 if(parts.length>1){const answers=parts.map((q,i)=>answerSingleQuestion({question:i>0&&/duplex|Randwick|planning/i.test(parts[0])&&!/roof|project|\bOC\b|certificate|weather/i.test(q)?q+' (duplex planning in Randwick)':q,audience,pack}));result={text:answers.map((a,i)=>`${i+1}. ${parts[i]}\n${a.text}`).join('\n\n'),citations:[...new Set(answers.flatMap(a=>a.citations||[]))],needsReview:answers.some(a=>a.needsReview),consultation:answers.some(a=>a.consultation),reviewReason:answers.filter(a=>a.needsReview).map(a=>a.reviewReason||'Further confirmation requested.').join(' ')};}
 else result=answerSingleQuestion({question,audience,pack});
 if(!result.needsReview&&/don.t have|couldn.t find|unavailable|needs to confirm|exact mandatory roof inspection|Digger reviews|Digger needs to review|no projected date/i.test(result.text))result={...result,needsReview:true,reviewReason:'Question needs a confirmed answer from Digger.'};
 // Technical changes require a decision, while routine certificates and preparation can be answered.
 if(audience==='admin'&&/\b(?:change|remove|cut|unsafe|bypass|crack|approve|proceed)\b/i.test(original))result={...result,needsReview:true,reviewReason:'Technical decision or work change requires review.'};
 return result;
}

function lookupSchedule(p,q,internal){
 if(!/when|date|finish|complet|how long|schedule|milestone/i.test(q)||/roof|whole|entire|practical|handover|overall|\bOC\b|occup|project finish|building.*finish|house.*finish|home.*finish/i.test(q))return null;
 const query=q.replace(/brickwork/gi,'brick').replace(/plumb/gi,'plumbing').replace(/electrical/gi,'electrician');
 const keys=terms(query).filter(k=>!['finish','complete','completed','start','schedule','date','milestone','long','take','done','ready','building','construction'].includes(k));
 const rows=p.schedule.rows.map(r=>({...r,score:keys.reduce((n,k)=>n+(new RegExp('\\b'+k+'\\b','i').test(r.task)?3:0)+(new RegExp('\\b'+k+'\\b','i').test(r.process)?1:0),0)})).filter(r=>r.score>0&&(r.start||r.finish)).sort((a,b)=>b.score-a.score||a.sourceRow-b.sourceRow).slice(0,3);
 if(!rows.length)return null;
 return 'Here is what the current program records:\n\n'+rows.map(r=>`${r.task}: ${r.start?'planned start '+day(r.start)+'; ':''}projected finish ${day(r.finish)} (Maroubra!E${r.sourceRow}:F${r.sourceRow}).`).join('\n')+'\n\nThese are projected entries. Digger will confirm readiness and any approved change before a date is treated as a commitment.';
}

function lookupCertificate(p,q){
 if(!/certificate|report|document/i.test(q)||/\bOCC?\b|occupation|all documents|full checklist/i.test(q))return null;
 const keys=terms(q.replace(/windows?/gi,'glazing').replace(/pest/gi,'termite')).filter(k=>!['certificate','certificates','report','reports','document','documents','needed','required','prepare','requirements','specific','applicable'].includes(k));
 const items=p.checklist.filter(x=>keys.some(k=>x.requirement.toLowerCase().includes(k)));
 if(!items.length||items.length>6)return null;
 return 'The supplied OC checklist identifies these relevant records:\n\n'+items.map(x=>`Item ${x.number}: ${x.requirement}`).join('\n')+'\n\nConfirm applicability with the responsible certifier. Request the records from the relevant contractor or consultant, check the project/work details and signatures, then record received and outstanding items for Digger’s review. A certificate does not replace a required inspection.';
}
