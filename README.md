# Construction and Contractor Intelligence

Empower your business to scale.

The presentation has four role pages: **Digger / Site Manager**, **Roo / Team**, **Tally / Client**, and **Kooka / Instagram**. Drop a site photo into
**Talk to Bower** as Digger to automatically prepare three parallel updates, assigned tasks and reminder drafts. Initial
screens stay neutral until a photo is received. The presentation uses a fictional
project, personal and business names with generic scenario details; live image recognition is not implemented.

See [the demo walkthrough and source register](docs/photo-demo.md). The original
agent architecture remains intact. Vision, drafting and dispatch are simulated.
Real assets stay in the ignored `private-demo/` folder and are never required for
a public clone: attendees can use the upload controls instead.

A multi-agent knowledge platform for small businesses. It captures what the business learns every day, holds it in one knowledge base with three access tiers, and puts a router in front of specialist agents for crew, customers, office and content. The founder only sees what needs their judgement.

This repository is a **hackathon prototype** (WSTI Festi 2026), built for **construction and contractors**. The public demo uses entirely fictional project and contact data with a generic framing workflow. No actual project records or images are included. The original `data/*.json` engine fixtures remain labelled dummy data; see [docs/DATA.md](docs/DATA.md).

**Live app:** https://zoed-design.github.io/founder-intelligence/

[How to edit the demo](docs/editing-demo.md) · Project details: [`src/demo-config.js`](src/demo-config.js)

## Try it

1. As Digger, drop a site photo into **Talk to Bower**, paste an image, or use the inline +.
2. Three updates appear side by side automatically.
3. Open **Team** or **Client** to ask Bower questions in that role, with audience-appropriate references.
4. Open **Instagram** to review Kooka's public-safe caption and preview.
5. Return to Digger to approve and download the updates. Nothing is sent externally, and reminder drafts are not scheduled.

The active UI has no morning rush, sample-photo buttons, Markdown upload, or
manual preparation button. The core engine retains its Markdown-reference API.
Digger has continuous idle animation, Dance and optional Voice. Tally's avatar
is a human mother/homeowner wearing ordinary clothes, without a hard hat.

## Meet the crew

The crew uses low-poly Australian animals, with a human parent/homeowner persona for Tally. Team characters wear hard hats; Tally wears everyday clothes.

| Agent | Who | Why that animal |
|---|---|---|
| Router | **Digger** the wombat, in the foreman's white hat | Australia's champion digger runs the site. He talks you through each message and dances when the crew gets it right. Turn on **Voice** to hear him (browser speech, off by default). |
| Collect & organize | **Lyra** the lyrebird | Brings fragmented information together in the Wiki |
| Find, reference & allocate tasks | **Bower** the bowerbird | Finds useful knowledge and coordinates the next actions (and loves blue things) |
| Teamwork | **Roo** the kangaroo | Tape measure in the pouch, answers the crew |
| Client | **Tally**, the homeowner persona | Friendly parent, no construction hat |
| Content | **Kooka** the kookaburra | Camera ready, tells the stories |

## How the agents work

See **[docs/agents.md](docs/agents.md)**. In short: capture → router → curator → teamwork, commercial or content → sent or founder gate. The router locks each request to the sender's tiers and jobs; the curator searches knowledge *as the sender*; agents may only send answers that quote approved knowledge the person may see. Everything else waits for the founder. Founder answers and edits become rules the agents use next time.

**What is real and what is simulated.** Real: the agent chain, tier enforcement, conflict check, autonomy rule, review gate, learning loop and audit trail. Simulated: speech-to-text, vision (you pick what a photo shows) and each agent's reasoning, which is rule-based rather than a language model.

## Run it

```bash
npm start      # http://localhost:8080
npm test       # 33 tests including photo workflow, privacy and local approval
```

No build step and no package dependencies (three.js is vendored). Plain HTML, CSS and ES modules. The focused demo holds uploads and drafts in memory; **New session** or reload clears them.

## Layout

| Path | What it is |
|---|---|
| `src/engine.js` | Each agent's rules: identify, bind job, tier-limited retrieval, classify, conflicts, drafting, review gate, learning |
| `src/agents.js` | Agent runtime: runs the chain, records steps and handoffs, applies the autonomy rule |
| `src/map.js` | The animated agent map |
| `src/crew.js` | The crew: 3D characters, portraits and Digger the mascot (three.js) |
| `vendor/three.min.js` | three.js r152, MIT licence (same build as SFIA Agent Studio) |
| `app.js`, `index.html`, `styles.css` | The multi-role app |
| `data/*.json` | Labelled dummy data and the role cards |
| `tests/` | Node test runner, no dependencies |
| `docs/` | Five Ws, architecture, agents, data register, glossary, ADRs, real-data guide |

Every push to `main` runs the tests; GitHub Pages deploys only if they pass.

## Docs

- [How the agents work](docs/agents.md)
- [Five Ws: scope the problem](docs/five-ws.md)
- [Architecture](docs/architecture.md)
- [Data register](docs/DATA.md) and [swapping in real data](docs/real-data.md)
- [Glossary](docs/glossary.md) · [ADRs](docs/adr/)

## Credits

Business Analyst Services, with the construction vertical brief by the team. Pattern follows [SFIA Agent Studio](https://business-analyst-services.github.io/SFIA-agent-Studio/): one front door, a roster of role agents, a visible trail of routing, checks and approvals.

three.js © 2010-2023 three.js authors, MIT licence.

The public presentation uses fictional project aliases and demo identifiers. Original source assets are excluded from Git.
