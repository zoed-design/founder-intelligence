# ADR 0002: Simulate the AI steps, keep the governance real

**Status:** Accepted, 2026-11-14

## Context

Speech-to-text, vision and drafting need models, keys and network. For a hackathon demo these add risk without changing what we want judges to see: who can see what, what gets escalated, and that a human approves.

## Decision

Simulate three steps with data and templates:

| Step | Simulated by | Real replacement |
|---|---|---|
| Speech-to-text | `transcript` in `inbox.json` | Any transcription model, run in the capture agent |
| Vision | `simulatedVision` block | A vision model returning the same fields (`observed`, `projectHint`, `confidence`) |
| Drafting | Templates in `draft()` | A model call given only the `hits` the router allowed, with the output tier stated |

Keep real: identity, tier enforcement, job binding, conflict check, escalation, citation rule, review gate, feedback loop, audit.

## Rules for the real replacement

- The model receives only retrieved entries the asker may see; it never queries the knowledge base itself.
- Its output is a draft, checked by `citable()` and the review gate like any template output.
- Confidence comes from the model or a calibrated score, and the 0.9 threshold is re-tested on real cases.
- Choose models per step by testing representative tasks for capability against cost.

## Consequences

The demo is honest about what is simulated (labelled on the page and in DATA.md), and the swap is local to the capture step and `draft()`.
