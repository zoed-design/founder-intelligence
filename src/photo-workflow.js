// Focused scenario adapter. The existing general message engine stays intact.
// Public release: entirely fictional fixtures and generic workflow templates.
// No real project records, personal contacts or vision/LLM API calls are used.
import { CONTEXT } from './demo-config.js';
export { CONTEXT } from './demo-config.js';

export const SOURCES = [
  { id: 'photo', title: 'Photo input', file: 'Session attachment', evidence: 'The uploaded photo is an input to this fixed framing scenario. No image recognition, measurement or compliance verification is performed.' },
  { id: 'chat', title: 'Example site note', file: 'DEMO-NOTE', evidence: 'Fictional scenario: a site update reports framing progress and requests routine inspection coordination. It is not a real conversation record.' },
  { id: 'roof', title: 'Example roof context', file: 'DEMO-ROOF', evidence: 'Generic scenario: roof drainage and structural details should be checked against the applicable current drawings. No dimensions or engineering approvals are asserted.' },
  { id: 'cdc', title: 'Example approval reference', file: 'DEMO-CDC-001', evidence: 'Fictional identifier only. No real approval document is bundled or verified. Confirm requirements before undertaking real work.' },
  { id: 'structure', title: 'Example structural reference', file: 'DEMO-STRUCT-001', evidence: 'Fictional reference for demonstrating a drawing-review action. No actual drawing numbers, dimensions or project revisions are used.' },
  { id: 'schedule', title: 'Example project sequence', file: 'DEMO-SCHEDULE', evidence: 'Generic sequence: report progress, confirm inspection readiness, review relevant documentation, and prepare the next communication. No appointment or completion date is assumed.' },
  { id: 'public-roof', title: 'Public design note', file: 'DEMO-PUBLIC-NOTE', evidence: 'Generic public storytelling about careful framing and roof drainage. No private records or specific technical measurements are cited.' },
  { id: 'brief', title: 'Fictional presentation scenario', file: 'src/demo-config.js', evidence: 'All project aliases, customer and team names, engineering references, certifier and lender names are invented presentation fixtures.' },
];

export function publicIssues(text) {
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const street = CONTEXT.address.split(',')[0].replace(/^\d+\s*/, '');
  const checks = [
    [new RegExp(`\\b${escape(CONTEXT.client)}\\b`, 'i'), 'Client name'], [new RegExp(escape(street), 'i'), 'Exact project location'],
    [/\b(?:42|42a)\b/i, 'Street number'], [/DEMO-CDC|DEMO-STRUCT-001|DEMO-ARCH-001|DEMO-LOT-001/i, 'Private project identifier'],
    [new RegExp([CONTEXT.admin, CONTEXT.certifier, CONTEXT.lender].map(escape).join('|'), 'i'), 'Internal contact or lender'],
    [/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i, 'Email address'], [/\+?\d[\d ()-]{8,}\d/, 'Phone or account number'],
    [/\b\d+\s+[a-z][a-z ]{0,35}\s(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr)\b/i, 'Street address'],
  ];
  return checks.filter(([re]) => re.test(text)).map(([,label]) => label);
}

export function buildPhotoPack({ note = '', photoName = '', briefName = '', briefText = '' } = {}) {
  if (!photoName && !briefName) throw new Error('Add a site photo or Markdown brief first.');
  const c = CONTEXT;
  const inputSources = [photoName ? 'photo' : null, 'chat', 'cdc', 'structure', 'schedule', 'brief'].filter(Boolean);
  const admin = `Hi ${c.admin},\n\nPlease coordinate the framing follow-up for ${c.address}. ${photoName ? 'A site photo accompanies this update.' : 'This update uses the attached reference note.'}\n\n1. Contact ${c.certifier} to confirm the relevant inspection requirements and request an available appointment. Confirm site readiness with the site manager before booking.\n\n2. Review the relevant wall, roof and drainage details against current issued drawings. Record any required professional confirmation before the work is covered.\n\n3. Prepare the next progress claim evidence pack for ${c.lender}: progress photos, the inspection report once available, and the required supporting documents. Hold submission pending sign-off and eligibility checks.\n\nSuggested schedule note: Framing progress reported — inspection readiness and sign-off to be confirmed.\n\nExample references: ${c.consent}; ${c.engineer}. No schedule, booking or lender system has been changed.${note.trim() ? `\n\nUser-provided note (unverified):\n${note.trim()}` : ''}${briefText.trim() ? `\n\nUser-provided reference (${briefName}; unverified):\n${briefText.trim()}` : ''}`;
  const client = `Hi ${c.client},\n\nThe latest site update reports framing progress at ${c.address}. This stage helps bring the future rooms and roof structure into focus.\n\nNext, the team will confirm inspection readiness and arrange the relevant certifier visit before the work is covered. We’ll confirm the appointment once it is booked.\n\nAfter the required sign-off and checks, we plan to prepare the next progress claim. We’ll keep you informed about the paperwork and following milestones.`;
  const social = `The details behind the build.\n\nA framing milestone at our ${c.publicName}. Careful structural work and thoughtful roof drainage are part of the design process from the start.\n\nGood craftsmanship means paying attention to the details behind the finished home.\n\n#${c.publicName.replace(/\s/g, '')} #TimberFraming #Craftsmanship`;
  const drafts = [
    { id: 'admin', agent: 'teamwork', tier: 'internal', title: 'Construction admin', to: c.admin, channel: 'Email draft', body: admin, citations: inputSources, status: 'draft' },
    { id: 'client', agent: 'commercial', tier: 'customer-safe', title: 'Client milestone update', to: c.client, channel: 'WhatsApp draft', body: client, citations: ['photo', 'brief'].filter(id => id !== 'photo' || photoName), status: 'draft' },
    { id: 'social', agent: 'content', tier: 'public', title: 'Instagram story', to: c.publicName, channel: 'Instagram draft', body: social, citations: ['public-roof'], status: 'draft' },
  ];
  const steps = [
    { agent: 'source', to: 'router', alsoTo: 'capture', detail: 'New input shared with both Digger and Lyra.' },
    { agent: 'capture', to: 'router', detail: 'Lyra shares the attachment and available context with Digger. Vision is simulated.' },
    { agent: 'router', to: 'capture', detail: 'Digger shares the coordination context with Lyra.' },
    { agent: 'capture', to: 'kb', detail: 'Lyra demonstrates collecting, labeling and organizing the input into Wiki knowledge. This demo does not write to an external Wiki.' },
    { agent: 'router', to: 'questions', detail: 'Digger asks for the relevant workflow references for the team.' },
    { agent: 'questions', to: 'curator', detail: 'Bower receives the information request.' },
    { agent: 'curator', to: 'kb', detail: 'Bower looks up the relevant fictional reference notes in the demo Wiki.' },
    { agent: 'kb', to: 'curator', detail: 'Bower filters the reference notes for the request and keeps unverified completion claims out of the drafts.' },
    { agent: 'curator', to: 'result', detail: 'Bower returns relevant information with source references for review.' },
    ...drafts.map(d => ({ agent: 'curator', to: d.agent, detail: `${d.title} prepared for ${d.to}` })),
    { agent: 'content', to: 'gate', detail: 'Public text screened; one combined review pack is ready. Nothing sent.' },
  ].map((s, i) => ({ ...s, action: 'prepared', itemId: 'PHOTO-PACK', t: String(i+1) }));
  return { drafts, steps, photoName, briefName, sourceNote: note, approved: false };
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
