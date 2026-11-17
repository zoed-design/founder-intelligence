import {buildSamplePack, answerSampleQuestion} from './sample-project.js?v=image-wiki-1';
// Focused scenario adapter. The existing general message engine stays intact.
// Generic fixtures remain available. An explicitly loaded reviewed sample pack uses source-backed checks.
// No vision/LLM API calls or external dispatch are used.
import { CONTEXT } from './demo-config.js?v=image-wiki-1';
export { CONTEXT } from './demo-config.js?v=image-wiki-1';

export const SOURCES = [
  { id: 'photo', title: 'Photo input', file: 'Session attachment', evidence: 'The uploaded photo is an input to this fixed framing scenario. No image recognition, measurement or compliance verification is performed.' },
  { id: 'chat', title: 'Example site note', file: 'DEMO-NOTE', evidence: 'Fictional scenario: a site update reports framing progress and requests routine inspection coordination. It is not a real conversation record.' },
  { id: 'roof', title: 'Example roof context', file: 'DEMO-ROOF', evidence: 'Generic scenario: roof drainage and structural details should be checked against the applicable current drawings. No dimensions or engineering approvals are asserted.' },
  { id: 'cdc', title: 'Example approval reference', file: 'DEMO-CDC-001', evidence: 'Fictional identifier only. No real approval document is bundled or verified. Confirm requirements before undertaking real work.' },
  { id: 'structure', title: 'Example structural reference', file: 'DEMO-STRUCT-001', evidence: 'Fictional reference for demonstrating a drawing-review action. No actual drawing numbers, dimensions or project revisions are used.' },
  { id: 'schedule', title: 'Example project sequence', file: 'DEMO-SCHEDULE', evidence: 'Generic sequence: report progress, confirm inspection readiness, review relevant documentation, and prepare the next communication. No appointment or completion date is assumed.' },
  { id: 'progress', title: 'Client progress note', file: 'DEMO-PROGRESS', evidence: 'Fictional customer-safe note: framing progress has been reported. Inspection readiness, the appointment and the following milestones still need confirmation.' },
  { id: 'claim', title: 'Example claim preparation note', file: 'DEMO-CLAIM', evidence: 'Fictional internal workflow: assemble progress photos and required supporting documents. Hold any claim submission until inspection sign-off and eligibility checks are complete.' },
  { id: 'coaching', title: 'Prototype employee coaching procedure', file: 'DEMO-COACH', evidence: 'Prototype workflow guidance, not a project record: check current issued instructions and source references, work through the approved sequence, record the checks and open questions, and ask the site manager to review changes, conflicting instructions or safety concerns. Coaching is not approval to change the work.' },
  { id: 'public-roof', title: 'Public design note', file: 'DEMO-PUBLIC-NOTE', evidence: 'Generic public storytelling about careful framing and roof drainage. No private records or specific technical measurements are cited.' },
  { id: 'brief', title: 'Fictional presentation scenario', file: 'src/demo-config.js', evidence: 'All project aliases, customer and team names, engineering references, certifier and lender names are invented presentation fixtures.' },
];

export function publicIssues(text) {
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const street = CONTEXT.address.split(',')[0].replace(/^\d+\s*/, '');
  const checks = [
    [new RegExp(`\\b${escape(CONTEXT.client)}\\b`, 'i'), 'Client name'], [new RegExp(escape(street), 'i'), 'Exact project location'],
    [/\b(?:18|18a|42|42a)\b/i, 'Street number'], [/DEMO-CDC|DEMO-STRUCT-001|DEMO-ARCH-001|DEMO-LOT-001/i, 'Private project identifier'],
    [new RegExp(`\\b(?:${[CONTEXT.admin, CONTEXT.certifier, CONTEXT.lender, 'Alex Reed', 'Sam Cole', 'S Square'].map(escape).join('|')})\\b`, 'i'), 'Internal contact or lender'],
    [/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i, 'Email address'], [/\+?\d[\d ()-]{8,}\d/, 'Phone or account number'],
    [/\b\d+\s+[a-z][a-z ]{0,35}\s(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr)\b/i, 'Street address'],
  ];
  return checks.filter(([re]) => re.test(text)).map(([,label]) => label);
}

export function buildPhotoPack({ note = '', photoName = '', briefName = '', briefText = '', sampleProject = null, wikiEntries = [] } = {}) {
  if (sampleProject) return buildSamplePack({project:sampleProject,photoName,note,wikiEntries});
  if (!photoName && !briefName) throw new Error('Add a site photo or Markdown brief first.');
  const c = CONTEXT;
  const inputSources = [photoName ? 'photo' : null, 'chat', 'cdc', 'structure', 'schedule', 'coaching', 'brief'].filter(Boolean);
  const admin = `Team coaching for ${c.address}\n\nHi ${c.admin}, here is how to work through the next steps. ${photoName ? 'A site photo accompanies this update.' : 'This update uses the attached reference note.'}\n\n1. Start with the current issued instructions and the references Bower has found. Check the revision before relying on a drawing.\n\n2. Confirm inspection readiness with Digger before requesting an appointment from ${c.certifier}. Record what is ready and what still needs confirmation.\n\n3. Compare the relevant wall, roof and drainage details with the issued drawings. If something conflicts or a change is proposed, flag the question for Digger and obtain the required professional confirmation.\n\n4. Keep a record of your checks and open questions. Ask Roo if you need the steps explained; coaching does not approve a change or confirm completion.\n\nExample references: ${c.consent}; ${c.engineer}. No booking or external record has been changed.${note.trim() ? `\n\nUser-provided note (unverified):\n${note.trim()}` : ''}${briefText.trim() ? `\n\nUser-provided reference (${briefName}; unverified):\n${briefText.trim()}` : ''}`;
  const client = `Hi ${c.client},\n\nThe latest site update reports framing progress at ${c.address}. This stage helps bring the future rooms and roof structure into focus.\n\nNext, the team will confirm inspection readiness and arrange the relevant certifier visit before the work is covered. We’ll confirm the appointment once it is booked.\n\nAfter the required sign-off and checks, we plan to prepare the next progress claim. We’ll keep you informed about the paperwork and following milestones.`;
  const social = `The details behind the build.\n\nA framing milestone at our ${c.publicName}. Careful structural work and thoughtful roof drainage are part of the design process from the start.\n\nGood craftsmanship means paying attention to the details behind the finished home.\n\n#${c.publicName.replace(/\s/g, '')} #TimberFraming #Craftsmanship`;
  const drafts = [
    { id: 'admin', agent: 'teamwork', tier: 'internal', title: 'Employee coaching guide', to: c.admin, channel: 'Team coaching draft', body: admin, citations: inputSources, status: 'draft', taskTitle: 'Coach the employee through the next steps', reminder: 'Follow up on employee questions and any items Digger needs to review.' },
    { id: 'client', agent: 'commercial', tier: 'customer-safe', title: 'Client milestone update', to: c.client, channel: 'WhatsApp draft', body: client, citations: ['photo', 'progress', 'brief'].filter(id => id !== 'photo' || photoName), status: 'draft', taskTitle: 'Prepare the client progress update', reminder: 'Update the client once the inspection appointment is confirmed.' },
    { id: 'social', agent: 'content', tier: 'public', title: 'Brand story', to: c.publicName, channel: 'Instagram draft', body: social, citations: ['public-roof'], status: 'draft', taskTitle: 'Prepare the brand story for review', reminder: 'Revisit the brand story after the site manager approves the public copy.' },
  ];
  const steps = [
    { agent: 'source', to: 'router', alsoTo: 'capture', detail: 'New input shared with both Digger and Lyra.' },
    { agent: 'capture', to: 'router', detail: 'Lyra shares the attachment and available context with Digger. Vision is simulated.' },
    { agent: 'router', to: 'capture', detail: 'Digger shares the coordination context with Lyra.' },
    { agent: 'capture', to: 'kb', detail: 'Lyra demonstrates collecting, labeling and organizing the input into Wiki knowledge. This demo does not write to an external Wiki.' },
    { agent: 'router', to: 'curator', detail: 'Digger asks Bower for references and the team’s next actions.' },
    { agent: 'curator', to: 'kb', detail: 'Bower looks up the relevant fictional reference notes in the demo Wiki.' },
    { agent: 'kb', to: 'curator', detail: 'Bower filters the reference notes for the request and keeps unverified completion claims out of the drafts.' },
    { agent: 'curator', to: 'router', detail: 'Bower returns relevant information with source references to Digger.' },
    ...drafts.map(d => ({ agent: 'curator', to: d.agent, detail: `Bower allocates ${d.taskTitle.toLowerCase()} and prepares a reminder draft.` })),
    { agent: 'content', to: 'curator', detail: 'Kooka returns the public story for review. Tasks and reminder drafts stay in this session; nothing is sent or scheduled.' },
  ].map((s, i) => ({ ...s, action: 'prepared', itemId: 'PHOTO-PACK', t: String(i+1) }));
  return { drafts, steps, photoName, briefName, sourceNote: note, approved: false };
}

export function coachEmployee({question = '', pack, history=[]} = {}) {
  const answer = askBower({question, audience:'admin', pack,history});
  const needsReview = /\b(?:unsafe|danger\w*|change\w*|remove|cut|crack\w*|bypass|conflict\w*|unsure)\b|安全|修改|裂|批准|不确定/i.test(question) || /(?:Digger.*review|review.*Digger)|\b(?:can|may|could|should)\s+(?:i|we)\s+(?:approve|proceed|go ahead)\b/i.test(question);
  if (needsReview) return {
    ...answer,
    text:answer.text+'\n\nThis needs Digger’s review before acting on the proposed change. No work or change has been approved.',
    citations:[...new Set([...answer.citations,'coaching'])],
    needsReview:true,
    steps:[...answer.steps,{agent:'curator',to:'router',itemId:answer.steps[0].itemId}],
  };
  if (!pack) return {...answer,text:'I’m Roo, your Employee Coach. Share the latest site update so I can explain the next steps using the available references. If a question needs a decision, I’ll flag it for Digger.',needsReview:false};
  if(answer.needsReview)return {...answer,needsReview:true};
  if (!answer.citations.length) return {...answer,text:'I don’t have a supported procedure for that question in this demo. Try asking me how to prepare for an inspection, check drawing references or work through the next actions.',needsReview:false};
  return {...answer,needsReview:false,citations:[...new Set([...answer.citations,'coaching'])],text:`Here’s how to work through it:\n\n1. Check the current issued instructions and the references below.\n2. ${answer.text}\n3. Record your checks and open questions. If instructions conflict or a decision is needed, ask Digger to review before proceeding.`};
}

// Small, audience-scoped Wiki lookup for the demo, not a live model or connector.
export function askBower({ question = '', audience = 'workspace', pack, history=[] } = {}) {
  if (!['workspace', 'admin', 'client', 'social'].includes(audience)) throw new Error('Unknown Bower audience.');
  const actor = {workspace:'router',admin:'teamwork',client:'commercial',social:'content'}[audience];
  const itemId = `QUESTION-${audience}-${question}`;
  const steps = [
    {agent:actor,to:'curator'}, {agent:'curator',to:'kb'},
    {agent:'kb',to:'curator'}, {agent:'curator',to:actor},
  ].map(s=>({...s,itemId}));
  const result = (text, citations=[]) => ({text,citations,steps});
  if (!pack) return result('Share the latest site photo first. I’ll use the demo Wiki to find references and prepare the team’s tasks and reminder drafts for your review.');
  if (pack.sampleProject) return {...answerSampleQuestion({question,audience,pack,history}),steps};
  const internal = audience === 'workspace' || audience === 'admin';
  if (!internal && /price|margin|markup|supplier|profit|internal|quote|cost|lender|bank|contract/i.test(question)) {
    return result(audience === 'client' ? 'I can help with your progress and next steps. For pricing or contract questions, I’ll refer you to your project contact.' : 'I don’t have a public-approved reference for that request. Please ask the site manager to review it.');
  }
  let text, citations;
  if (/\b(?:when|date|inspect\w*|certif\w*|readiness)\b/i.test(question)) {
    if (audience === 'social') return result('There is no public-approved inspection update in the demo Wiki. Ask the site manager to review any inspection claim before using it in a story.');
    text = 'The team will confirm inspection readiness and arrange the certifier’s visit. The appointment is not confirmed yet; we’ll let you know once it is booked.';
    citations = internal ? ['schedule','cdc'] : ['progress'];
  } else if (/drawing|roof|pitch|drain|structure/i.test(question)) {
    text = 'Review the roof, wall and drainage details against the applicable current drawings. Required professional confirmation is still pending.';
    citations = internal ? ['structure','roof'] : audience === 'social' ? ['public-roof'] : ['progress'];
    if (!internal) text = audience === 'social' ? 'The public design note supports a story about careful framing and roof drainage, without technical measurements or private project details.' : 'The customer-safe note reports framing progress. It does not confirm roof measurements or inspection sign-off.';
  } else if (internal && /claim|lender|bank/i.test(question)) {
    text = 'Prepare progress photos and the required claim documents. Hold submission until inspection sign-off and eligibility checks are complete.';
    citations = ['claim'];
  } else if (/task|remind|next|action|follow|todo/i.test(question) && !/source|evidence|basis|why|reference|wiki/i.test(question)) {
    const tasks = pack.drafts.filter(d=>internal || d.id===audience);
    text = tasks.map(d=>`${{admin:'Roo',client:'Tally',social:'Kooka'}[d.id]}: ${d.taskTitle}. Reminder draft: ${d.reminder}`).join('\n\n')+'\n\nThese are drafts for review; no reminder has been scheduled.';
    citations = internal ? ['schedule'] : audience === 'social' ? ['public-roof'] : ['progress'];
  } else if (/source|evidence|basis|why|reference|wiki|progress|story|caption/i.test(question)) {
    citations = internal ? ['chat','schedule','structure'] : audience === 'social' ? ['public-roof'] : ['progress'];
    text = 'Here are the relevant demo Wiki references. These are fictional example notes; the attached photo has not been analyzed or independently verified.';
  } else return result('I couldn’t find a relevant answer in the demo Wiki. Try asking about inspection readiness, roof details, next actions or source references.');
  // Public stories only cite public-approved material, irrespective of intent.
  if (audience === 'social') citations = citations.filter(id=>id==='public-roof');
  return result(text,citations);
}

export function approvePack(pack) {
  if (!pack?.drafts?.length) throw new Error('Prepare a pack first.');
  for (const d of pack.drafts) {
    if (!d.body.trim()) throw new Error(`${d.title} is empty.`);
    if (d.tier === 'public') {
      const issues = publicIssues(d.body);
      if (issues.length) throw new Error(`Public draft needs redaction: ${issues.join(', ')}.`);
      if (!d.body.includes(CONTEXT.publicName)) throw new Error(`Public draft must use ${CONTEXT.publicName}.`);
    }
  }
  return { ...pack, approved: true, drafts: pack.drafts.map(d => ({ ...d, status: 'approved-local' })) };
}
