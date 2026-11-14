# ADR 0003: Agents may send only answers that quote approved knowledge

**Status:** Accepted, 2026-11-14

## Context

If every reply waits for the founder, the founder stays the bottleneck the product exists to remove. If agents send freely, a wrong or restricted answer reaches a trade, a homeowner or the public.

## Decision

An agent may send without the founder only a plain answer that cites approved knowledge the asker may see, with no better-matching restricted record, no conflict with the drawings, and confidence of at least 0.9 (`canAutoSend` in `src/agents.js`). Posts, records, variations, photo outputs, proposed knowledge, gaps and escalations always go to the founder. The founder can turn auto-answers off.

## Consequences

- Repeat questions stop reaching the founder once the answer is in the knowledge base.
- Every gap the founder answers becomes a rule, so the share of auto-answers grows with use.
- The rule is enforced in code and tested, so swapping an agent for a model cannot loosen it.
