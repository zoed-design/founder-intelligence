// Reviewed project records drive deterministic checks. Documents are data, never executable instructions.
const FILE = /^sample-data\/[a-z0-9._-]+(?:#page=\d+)?$/i;
const finite = (n, label) => { if (!Number.isFinite(n) || Math.abs(n) > 10000) throw new Error(`Invalid sample ${label}.`); return n; };
const round = n => Math.round(n * 1000) / 1000;
const metres = n => round(n).toFixed(2);
const day = s => s ? new Date(`${s}T00:00:00Z`).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}) : 'not recorded';

export function validateSampleProject(p) {
  if (p?.schemaVersion !== 1 || typeof p.title !== 'string' || typeof p.publicName !== 'string') throw new Error('Unsupported sample project.');
  for (const key of ['pitchDegrees','wallTopRL','roofFFLRL','levelOneFFLRL']) finite(p.drawing?.[key], key);
  for (const key of ['estimatedHeightM','additionalHeightMm','pitchDegrees']) finite(p.conversation?.[key], key);
  if (!Array.isArray(p.schedule?.rows) || !p.schedule.rows.some(r=>r.sourceRow===78)) throw new Error('The sample roof-covering record is missing.');
  for (const row of p.schedule.rows) {
    if (!Number.isInteger(row.sourceRow) || typeof row.stage!=='string' || typeof row.task!=='string') throw new Error('Invalid sample schedule row.');
    for (const key of ['start','finish']) if (row[key]!==null && (!/^\d{4}-\d{2}-\d{2}$/.test(row[key]) || !Number.isFinite(Date.parse(row[key])))) throw new Error('Invalid sample date.');
  }
  if (!Array.isArray(p.checklist) || !p.checklist.length || !Array.isArray(p.sources) || !Array.isArray(p.downloads)) throw new Error('Sample sources are incomplete.');
  const ids=new Set();
  for (const s of p.sources) {
    if (!/^sample-[a-z-]+$/.test(s.id) || ids.has(s.id) || !FILE.test(s.url) || !['internal','customer-safe','public'].includes(s.tier)) throw new Error('Invalid sample source.');
    ids.add(s.id);
  }
  for (const id of ['sample-chat','sample-roof','sample-elevation','sample-structure','sample-schedule','sample-oc','sample-progress','sample-public']) if (!ids.has(id)) throw new Error('A required sample reference is missing.');
  if (p.downloads.some(s=>!FILE.test(s.url))) throw new Error('Invalid sample download.');
  return p;
}

export function sampleFindings(project) {
  const p=validateSampleProject(project),d=p.drawing,c=p.conversation;
  const wallHeightM=round(d.wallTopRL-d.levelOneFFLRL);
  const roofHeightM=round(d.roofFFLRL-d.levelOneFFLRL);
  const differenceMm=round((d.wallTopRL-d.roofFFLRL)*1000);
  const roofCovering=p.schedule.rows.find(r=>r.sourceRow===78);
  return {wallHeightM,roofHeightM,differenceMm,roofCovering,
    chatMatchesHeight:Math.abs(c.additionalHeightMm-differenceMm)<1,
    chatMatchesPitch:c.pitchDegrees===d.pitchDegrees,
    missingRoofDates:!roofCovering.start||!roofCovering.finish};
}

function roofFinding(p,f) {
  return `The elevation labels give ${metres(f.roofHeightM)} m from level 1 FFL to roof FFL and ${metres(f.wallHeightM)} m to top of wall: a ${f.differenceMm} mm difference. The conversation requests ${p.conversation.additionalHeightMm} mm in the middle; this ${f.chatMatchesHeight?'matches':'does not match'} that level difference. The drawing labels a ${p.drawing.pitchDegrees}° fall and the chat states ${p.conversation.pitchDegrees}°; these ${f.chatMatchesPitch?'agree':'need reconciliation'}. These are drawing-level checks, not measurements of the photo or approval of a uniform wall height.`;
}
function scheduleFinding(p,f) {
  const row=f.roofCovering;
  return `${row.stage||row.task} (source row ${row.sourceRow}): start ${day(row.start)}; finish ${day(row.finish)}. ${f.missingRoofDates?'The supplied schedule is missing a roof-covering date.':'These are schedule entries, not confirmation of a booking or actual completion.'} No inspection sign-off or confirmed appointment is supplied.`;
}
function checklist(p) { return p.checklist.map(r=>`Item ${r.number}: ${r.requirement}.`).join('\n'); }

export function buildSamplePack({project,photoName='',note=''}={}) {
  const p=validateSampleProject(project),f=sampleFindings(p);
  const admin=`Roof takeoff review for ${p.title}\n\nSource finding\n${roofFinding(p,f)}\n\nRoo’s next steps\n1. Compare the local wall and roof profile with the current issued drawings before correcting the takeoff. Check openings and changing heights; do not apply the top-of-wall difference uniformly.\n2. Record the calculation and the drawing revision, then send the proposed correction to Digger for review. The structural-notes excerpt does not approve a change.\n3. ${scheduleFinding(p,f)} Record the roofing dates once confirmed.\n4. Prepare the relevant documents from the supplied OC checklist:\n${checklist(p)}\n\nDigger reviews the proposed takeoff correction and any change before work or ordering. ${photoName?'The attached photo has not been analysed. ':''}Nothing has been booked, ordered, sent or signed off.${note.trim()?`\n\nUser-provided note (unverified):\n${note.trim()}`:''}`;
  const client=`Hi Demo Homeowner,\n\nThe team is reviewing the roof details for ${p.title} against the project drawings before confirming the next steps.\n\nThe supplied records do not confirm a roof-covering appointment or inspection sign-off. We’ll share the date and next milestone once they are confirmed. We’ll also keep the weekly progress update current.\n\nThis draft does not confirm completed work or eligibility for a progress claim.`;
  const social=`The care behind the roofline.\n\nAt our ${p.publicName}, careful drawing review and coordination are part of the work behind the finished home.\n\nA story about the details, people and decisions along the way—ready for the site manager’s review. This draft makes no new completion claim.\n\n#${p.publicName.replace(/\s/g,'')} #ConstructionDetails`;
  const drafts=[
    {id:'admin',agent:'teamwork',tier:'internal',title:'Roof takeoff coaching guide',to:'Kira',channel:'Employee coaching draft',body:admin,citations:['sample-chat','sample-roof','sample-elevation','sample-structure','sample-schedule','sample-oc'],status:'draft',taskTitle:'Review the roof takeoff and record the missing dates',reminder:'Follow up on Digger’s takeoff decision and the roof-covering dates.'},
    {id:'client',agent:'commercial',tier:'customer-safe',title:'Client review update',to:'Demo Homeowner',channel:'WhatsApp draft',body:client,citations:['sample-progress'],status:'draft',taskTitle:'Prepare a confirmed milestone update for the client',reminder:'Update the client after the next date and milestone are confirmed.'},
    {id:'social',agent:'content',tier:'public',title:'Client story',to:p.publicName,channel:'Instagram draft',body:social,citations:['sample-public'],status:'draft',taskTitle:'Prepare the client story without a completion claim',reminder:'Ask Digger to review the story before any external use.'},
  ];
  const steps=[
    {agent:'source',to:'router',alsoTo:'capture',detail:'Reviewed sample records reach both Digger and Lyra.'},
    {agent:'router',to:'capture',detail:'Digger shares the selected project context with Lyra.'},
    {agent:'capture',to:'router',detail:'Lyra returns the labelled conversation, drawings, schedule and checklist.'},
    {agent:'capture',to:'kb',detail:'Lyra organises the reviewed sample records in the session Wiki.'},
    {agent:'router',to:'curator',detail:'Digger asks Bower to compare the source records.'},
    {agent:'curator',to:'kb',detail:'Bower retrieves the drawing levels, roof fall, conversation and schedule entries.'},
    {agent:'kb',to:'curator',detail:`Calculated ${f.differenceMm} mm between roof FFL and top of wall; checked the chat and ${p.drawing.pitchDegrees}° drawing fall.`},
    {agent:'curator',to:'router',detail:'Bower flags a takeoff review and missing roof dates, with source links. No work is approved.'},
    ...drafts.map(d=>({agent:'curator',to:d.agent,detail:`Bower allocates ${d.taskTitle.toLowerCase()}; the reminder remains a draft.`})),
  ].map((s,i)=>({...s,action:'prepared',itemId:p.id,t:String(i+1)}));
  return {drafts,steps,photoName,sourceNote:note,approved:false,sampleProject:p,sources:p.sources,findings:f};
}

export function answerSampleQuestion({question='',audience='workspace',pack}={}) {
  const p=pack.sampleProject,f=sampleFindings(p),internal=audience==='workspace'||audience==='admin';
  const result=(text,citations=[])=>({text,citations});
  if (!internal) {
    if (/price|margin|markup|supplier|profit|internal|quote|cost|lender|bank|contract|drawing|height|pitch|800|FFL|millimetre|technical/i.test(question)) return result(audience==='social'?'This request needs Digger’s review. The public story has no approved technical measurements or private project details.':'I can share progress and confirmed next steps. Digger reviews technical, pricing and contract questions.');
    if (/source|reference|evidence|wiki|progress|story|caption|roof|date|when|inspect|next|task|remind/i.test(question)) return audience==='social'
      ? result(`The reviewed story context supports careful drawing review and coordination at ${p.publicName}. It does not establish a completed milestone. Kooka’s story and reminder remain drafts.`,['sample-public'])
      : result('The team is reviewing the roof details. The records do not confirm a roof-covering appointment or inspection sign-off. We’ll share the next date and milestone once confirmed. Tally’s update and reminder remain drafts.',['sample-progress']);
    return result('There is no supported answer to that question in the reviewed client context.');
  }
  if (/source|evidence|basis|reference|wiki/i.test(question)) return result('These are reviewed extracts of the supplied real project records. Open the references to check the drawing labels, original schedule row numbers, conversation and OC checklist. The project address and professional identities are aliases.',['sample-chat','sample-roof','sample-elevation','sample-structure','sample-schedule','sample-oc']);
  if (/\bOC\b|checklist|certificate|compliance|documents/i.test(question)) return result(`The supplied OC checklist requests:\n${checklist(p)}\n\nThese are source-stated requirements, not confirmation that the documents are present, valid or sufficient. Check current requirements with the responsible professionals.`,['sample-oc','sample-structure']);
  if (/date|when|schedule|appointment|book|inspect|readiness/i.test(question)) return result(`${scheduleFinding(p,f)} The checklist also requests structural engineer’s inspection reports (item 2). Confirm readiness with Digger before arranging the appropriate inspection.`,['sample-schedule','sample-oc']);
  if (/roof|height|pitch|fall|wall|800|FFL|takeoff|estimate|measure|difference/i.test(question)) return result(`${roofFinding(p,f)}\n\nFlag the takeoff for Digger and verify the relevant wall profile, openings and current issued revision before using a corrected quantity.`,['sample-chat','sample-roof','sample-elevation','sample-structure']);
  if (/claim|loan|lender|bank|cashflow|occupancy|sign.?off|completed|finished/i.test(question)) return result('These samples do not establish actual completion, inspection sign-off, loan drawdown eligibility or an Occupancy Certificate. Bower cannot confirm those outcomes from a stage label, drawing or photo.',['sample-schedule','sample-oc']);
  if (/task|remind|next|action|follow|todo/i.test(question)) return result(pack.drafts.map(d=>`${{admin:'Roo',client:'Tally',social:'Kooka'}[d.id]}: ${d.taskTitle}. Reminder draft: ${d.reminder}`).join('\n\n')+'\n\nDigger reviews these actions. No reminder has been scheduled.',['sample-chat','sample-elevation','sample-schedule','sample-oc']);
  return result('I couldn’t find a supported answer in this sample project. Ask about the roof-height difference, inspection dates, OC documents or source references.');
}

export function shortSampleUpdates(pack) {
  const p=pack.sampleProject,f=sampleFindings(p);
  return {
    admin:`Review the roof takeoff for ${p.title}: drawing levels differ by ${f.differenceMm} mm, and the chat requests ${p.conversation.additionalHeightMm} mm. Check the ${p.drawing.pitchDegrees}° fall, local heights and openings with the issued drawings. Roof-covering dates are ${f.missingRoofDates?'not fully recorded':'schedule entries only'}. Record the proposed correction for Digger’s review; no work is approved.`,
    client:`Hi Demo Homeowner, the team is reviewing the roof details for ${p.title}. We’ll confirm the next date and milestone once available. This update does not confirm inspection sign-off or completed work.`,
    social:`The care behind the roofline at our ${p.publicName}: careful drawing review and coordination, ready for the site manager’s story review. #${p.publicName.replace(/\s/g,'')} #ConstructionDetails`,
  };
}
