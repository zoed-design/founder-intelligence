# How the agents work

The current photo-led demo uses the simple [crew roles and information flow](crew-roles.md): messages reach Digger and Lyra; Lyra collects and organizes the Wiki; Bower finds references and allocates task and reminder drafts. Digger, Roo, Tally and Kooka can each ask Bower questions. The sections below document the preserved original general-purpose engine; they are not a description of live integrations in the photo demo.

## In one sentence

Every message passes through a chain of agents, each with its own job, its own permitted knowledge and its own limit on what it may do without the founder. The chain is real; each agent's *thinking* is rule-based in this prototype.

## The chain

```
Message in → Capture → Router → Curator → Teamwork | Commercial | Content → sent, or Founder gate
                                   │                                              │
                                   └──── search_knowledge (sender's tiers) ───────┴──► Knowledge base (rules learned)
```

| Agent | Does | Uses | May act alone? |
|---|---|---|---|
| **Capture** (Lyra the lyrebird) | Turns voice, photos and messages into text and facts | Transcripts and simulated vision in this prototype | Yes: nothing it produces leaves the system |
| **Router** (Digger the wombat) | Identifies the sender, locks their access tiers, classifies the request, escalates | Directory and role rules | Yes, and it escalates anything structural, contractual, restricted or under 0.9 confidence |
| **Curator** (Bower the bowerbird) | Binds the job, searches knowledge *as the sender*, checks for conflicts, proposes new knowledge | `search_knowledge` tool limited to the sender's tiers and jobs | No: proposals, photo records and conflicts go to the founder |
| **Teamwork** (Roo the kangaroo) | Answers crew questions from drawings and standards; drafts certifier records | Customer-safe and public knowledge | Only answers that quote approved knowledge the person may see |
| **Commercial** (Tally the numbat) | Claims, coding, variations, homeowner questions | Internal for coding; customer-safe for anything sent out | Only plain claim and progress answers; never money, scope or variations |
| **Content** (Kooka the kookaburra) | Public questions; posts in the founder's voice | Public knowledge only | Only public answers; every post goes to the founder |

Role cards are in [`data/agents.json`](../data/agents.json). The runtime is [`src/agents.js`](../src/agents.js); each agent's rules are in [`src/engine.js`](../src/engine.js).

## The autonomy rule

An agent may send without the founder only when **all** of these hold:

1. It is a plain answer, not a post, record, variation, photo output or new knowledge.
2. It quotes approved knowledge, with a citation.
3. The asker is allowed to see that knowledge (tier and job).
4. Nothing was withheld that matched better, there's no conflict with the drawings and confidence is at least 0.9.

Approved knowledge has already been through the founder, so quoting it is safe. Everything else waits at the gate. The founder can turn auto-answers off entirely in *Agents and policy*.

## The learning loop

- **Knowledge gap.** No approved answer, so the founder writes one. Their answer is saved as a rule at the asker's tier, and next time the agent answers on its own.
- **Founder edit.** Any sentence the founder adds to a draft becomes a rule, at the tier they choose.
- **Staff update.** "FYI from now on…" is proposed as knowledge by the curator and added only when the founder approves it.

## What is simulated

| Step | In this prototype | With a model |
|---|---|---|
| Speech-to-text | Typed text or demo transcripts | Transcription model in Capture |
| Vision | The sender picks what the photo shows | Vision model returning the same fields |
| Classification, drafting | Keyword rules and templates | A Claude call per agent, its role card as instructions, given only the knowledge the router allowed |

Swapping any one agent for a model call changes only that agent's function. The router's tier lock, the citation rule, the autonomy rule, the review gate and the audit trail stay as they are and are covered by the tests.
