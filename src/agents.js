// Agent runtime. Runs one message through the agents and records every step,
// tool call and handoff as a trace. The app animates the trace on the agent map.
//
// Each agent's reasoning is rule-based (see engine.js). What is real here is the
// structure an AI agent system needs: role cards, tier-limited tools, handoffs,
// an autonomy policy and a review gate. Any single agent's rules can later be
// swapped for a model call without changing the rest (docs/agents.md).

import { route, draft, CONFIDENCE_THRESHOLD } from './engine.js';

export const DEFAULT_POLICY = { autoAnswer: true };

// An agent may send without the founder only when it is quoting approved
// knowledge the person is allowed to see, with nothing unusual about the request.
export function canAutoSend(d, r, policy = DEFAULT_POLICY) {
  return Boolean(
    policy.autoAnswer
    && d.kind === 'answer'
    && !d.escalated
    && r.conflicts.length === 0
    && d.citations.length > 0
    && r.confidence >= CONFIDENCE_THRESHOLD,
  );
}

export function orchestrate(item, data, { policy = DEFAULT_POLICY, clock = () => '' } = {}) {
  const steps = [];
  const step = (agent, action, detail, extra = {}) => steps.push({ t: clock(), itemId: item.id, agent, action, detail, ...extra });

  // Capture
  const how = item.simulatedVision ? 'read photo (simulated vision)' : item.channel === 'voice' ? 'transcribed voice note' : `read ${item.channel || 'message'}`;
  step('source', 'sent', `${item.id} via ${item.channel}`, { to: 'capture' });
  step('capture', how, item.simulatedVision ? `Sees: ${item.simulatedVision.observed.join(', ')} (confidence ${item.simulatedVision.confidence})` : `“${(item.transcript || '').slice(0, 80)}${(item.transcript || '').length > 80 ? '…' : ''}”`, { to: 'router' });

  // Router: who, which tiers
  const r = route(item, data);
  const label = r.who.person?.label || 'Unknown sender';
  step('router', 'identified sender', `${label} · may see [${r.who.access.join(', ')}]${r.who.projectScoped ? ` · own jobs only (${r.who.projects.join(', ')})` : ''}`);
  step('router', 'classified', `Intent: ${r.intent}`, { to: 'curator' });

  // Curator: bind, search with the sender's tiers, check
  step('curator', 'bound job', r.project ? `${r.project.id} · ${r.project.name}` : 'No job identified');
  step('curator', 'tool: search_knowledge', `Searched as ${label}: ${r.retrieval.hits.length} visible, ${r.retrieval.withheld.length} withheld${r.retrieval.withheld.length ? ` (${r.retrieval.withheld.map((w) => w.id).join(', ')})` : ''}`, { tool: 'search_knowledge', to: 'kb' });
  r.conflicts.forEach((c) => step('curator', 'conflict', `Asked ${c.asked}, approved ${c.approved} (${c.entryId})`));

  if (r.escalate) step('router', 'escalated', r.escalateReason, { to: 'gate' });
  if (r.agent !== 'curator') step('curator', 'handoff', `To ${r.agent} agent`, { to: r.agent });

  // Specialist drafts; autonomy policy decides send or gate
  const drafts = draft(r, data).map((d) => {
    step(d.agent, 'drafted', `${d.id}: ${d.title} [${d.tier}]`, { draftId: d.id });
    if (canAutoSend(d, r, policy)) {
      step(d.agent, 'auto-sent', `${d.id} quotes approved ${d.citations.join(', ')} → ${d.to}`, { draftId: d.id, to: 'delivered' });
      return { ...d, status: 'auto-sent', decidedBy: `${d.agent} agent (policy)` };
    }
    step(d.agent, 'queued for founder', `${d.id}${d.escalated ? ' · escalated' : ''}`, { draftId: d.id, to: 'gate' });
    return d;
  });

  return { route: r, drafts, steps };
}
