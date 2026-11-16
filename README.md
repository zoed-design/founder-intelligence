# Construction and Contractor Intelligence

Empower your business to scale.

The presentation has four role pages: **Digger / Site Manager**, **Roo / Employee Coach**, **Tally / Client**, and **Kooka / Client Stories**. Choose **Load sample project** under Talk to Bower to use reviewed extracts of the founder’s real project records. The public address and professional identities are aliases.

The sample check compares drawing levels with the site conversation, finds the **800 mm** difference, cross-checks the **5°** fall and flags missing roof-covering dates. Roo receives a takeoff-review task; Tally and Kooka receive audience-appropriate drafts. Every finding has a source link. Digger reviews, edits, approves and downloads locally.

See [the sample-data demo guide](docs/sample-data-demo.md) and [public sample register](sample-data/README.md). The partly anonymised full source files are excluded from Git. The original general engine and a generic photo-only demonstration remain available. Photo content is not analysed.

A multi-agent knowledge platform for small businesses. It captures what the business learns every day, holds it in one knowledge base with three access tiers, and puts a router in front of specialist agents for crew, customers, office and content. The founder only sees what needs their judgement.

This repository is a **hackathon prototype** (WSTI Festi 2026), built for **construction and contractors**. The public demo includes selected de-identified project extracts and reviewed structured facts. Raw project packs, third-party contact lists, original approvals and chat images are not included. The original `data/*.json` engine fixtures remain labelled dummy data; see [docs/DATA.md](docs/DATA.md).

**Live app:** https://zoed-design.github.io/founder-intelligence/

[How to edit the demo](docs/editing-demo.md) · Project details: [`src/demo-config.js`](src/demo-config.js)

## Try it

1. Choose **New session**, then **Load sample project** below Talk to Bower.
2. Review Bower’s drawing/chat comparison and the three drafts. Open **Source references** to inspect the supporting extract.
3. Ask: **Why is there an 800 mm difference?** or **When is roof covering scheduled?**
4. Open **Roo · Employee Coach** and ask how to prepare for inspection. Ask about changing the roof structure to demonstrate Digger review.
5. Return to Digger, review and edit, then **Approve updates** and **Download updates**. The export includes source links. No message or reminder is dispatched.

You can also upload a photo after loading the sample project. It is an attachment to that selected case; no image recognition or measurement is performed. Uploading a photo without loading the sample retains the generic template demonstration. New session clears the selected case, files and drafts.

The palette and animated crew are unchanged. There is no morning scenario, external sending or new dashboard.

## Meet the crew

The crew uses low-poly Australian animals, with a human parent/homeowner persona for Tally. Team characters wear hard hats; Tally wears everyday clothes.

| Agent | Who | Why that animal |
|---|---|---|
| Router | **Digger** the wombat, in the foreman's white hat | Australia's champion digger runs the site. He talks you through each message and dances when the crew gets it right. Turn on **Voice** to hear him (browser speech, off by default). |
| Collect & organize | **Lyra** the lyrebird | Brings fragmented information together in the Wiki |
| Find, reference & allocate tasks | **Bower** the bowerbird | Finds useful knowledge and coordinates the next actions (and loves blue things) |
| Employee Coach | **Roo** the kangaroo | Explains the steps, answers employee questions and flags issues for Digger review |
| Client | **Tally**, the homeowner persona | Friendly parent, no construction hat |
| Client Stories | **Kooka** the kookaburra | Camera ready, tells the story behind the client's project |

## How the agents work

See **[docs/agents.md](docs/agents.md)**. In short: capture → router → curator → teamwork, commercial or content → sent or founder gate. The router locks each request to the sender's tiers and jobs; the curator searches knowledge *as the sender*; agents may only send answers that quote approved knowledge the person may see. Everything else waits for the founder. Founder answers and edits become rules the agents use next time.

**Working prototype:** reviewed sample records drive the drawing calculations, schedule-gap checks, source references and audience-specific drafts. The engine also contains demonstration role policies, review gates and an audit trail. Reasoning is rule-based; there is no live LLM, speech transcription or image analysis. Production connections and authentication remain roadmap work.

## Run it

```bash
npm start      # http://localhost:8080
npm test       # core engine, source checks, audience scope and local approval
```

No build step and no package dependencies (three.js is vendored). Plain HTML, CSS and ES modules. The focused demo holds uploads and drafts in memory; **New session** or reload clears them.

## Layout

| Path | What it is |
|---|---|
| `src/engine.js` | Each agent's rules: identify, bind job, tier-limited retrieval, classify, conflicts, drafting, review gate, learning |
| `src/agents.js` | Agent runtime: runs the chain, records steps and handoffs, applies the autonomy rule |
| `src/sample-project.js` | Reviewed sample validation, source arithmetic, schedule checks and audience-specific answers |
| `sample-data/` | Public extracts, source register and reviewed project facts |
| `src/map.js` | The animated agent map |
| `src/crew.js` | The crew: 3D characters, portraits and Digger the mascot (three.js) |
| `vendor/three.min.js` | three.js r152, MIT licence (same build as SFIA Agent Studio) |
| `demo.js`, `index.html`, `demo.css` | The current four-role prototype |
| `app.js`, `styles.css` | Original app and shared styles |
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

The public presentation uses fictional project aliases. Only the reviewed extract pack in sample-data/ is included; full original source files and private preprocessing artifacts are excluded from Git.
