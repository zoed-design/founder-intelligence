# Construction and Contractor Intelligence

Empower your business to scale.

The current hackathon prototype covers **one project: 18 Maroubra Street, Maroubra, Sydney**. Its four role pages are Digger / Site Manager, Roo / Employee Coach, Tally / Client and Kooka / Brand Stories. The original architecture and warm cream, brown and blue palette are preserved.

**Live app:** https://zoed-design.github.io/founder-intelligence/

Drop a site photo to allocate three source-linked drafts. The project’s reviewed Wiki is already available; no separate sample-loading step is required. Lyra can also collect and tag manually supplied WhatsApp text into the session Wiki. Bower references the schedule, CDC drawing extracts, structural notes, OC checklist, photo context, roof markup and chat transcript. See [the source register](sample-data/README.md) for the seven supplied files and precise publication limits.

Bower also uses a reviewed Randwick / NSW planning-reference snapshot, checked 17 November 2026. Try “Can I build a duplex in Randwick Council?” before uploading a photo. Answers cite official guidance, distinguish conditional standards from approval, and identify missing site information. See [planning coverage and limits](docs/planning-references.md). No live cloud synchronisation or general legal engine is connected.

The public website has five separate pages: [Mission](landing/index.html), [The Crew](landing/crew.html), [Prototype guide and downloads](landing/prototype.html), [Team](landing/team.html), and [Data & AI](landing/data-ai.html). The home page shows brief linked summaries. The [submission summary](docs/project-submission-summary.md) and [16:9 banner](landing/assets/construction-intelligence-banner.jpg) use the current project name and branding.

## Try it

1. Choose New session. Drop the supplied site photo, or open Wiki and choose Use supplied site photo.
2. Review the Roo, Tally and Kooka drafts and open their references.
3. As Tally, ask “When will roof covering finish?”, “When will the entire project finish?” and “When will I receive my OC to move in?” Dates are projections from the supplied mock-up schedule. An undated milestone remains unknown.
4. As Roo, ask “Do I need a certificate for roof covering?” or “When should I arrange an inspection after the roof?” References identify the relevant checklist items and the limits of the inspection information. Proposed changes are flagged for Digger.
5. Download the illustrative WhatsApp image from the Prototype guide, or in Digger, choose Add a WhatsApp message. Paste text, upload .txt/.md or select the supplied screenshot. Review the transcript, then Collect into Wiki. Ask “What did Mark say in the WhatsApp message?” The new message is cited as an unverified local source. Roo prepares coaching for review; the recognised demo transcript links the roof drawing references.
6. Review, edit, Approve updates and Download updates. Nothing is sent, scheduled or posted.

The supplied screenshot is recognised by its hash and uses a reviewed transcript. Other screenshots need manually pasted text. Photos are attachments without image analysis. Imported messages do not override schedule dates, issued drawings or client facts. Browser-session state clears on reload or New session; the bundled one-project Wiki remains available. Full original PDF packs still contain identifying material and are not published or fully searchable. All static downloads are public; role views are not production authentication.

## Meet the crew

The crew uses low-poly Australian animals, with a human parent/homeowner persona for Tally. Team characters wear hard hats; Tally wears everyday clothes.

| Agent | Who | Why that animal |
|---|---|---|
| Router | **Digger** the wombat, in the foreman's white hat | Australia's champion digger runs the site. He talks you through each message and dances when the crew gets it right. Turn on **Voice** to hear him (browser speech, off by default). |
| Collect & organize | **Lyra** the lyrebird | Brings fragmented information together in the Wiki |
| Find, reference & allocate tasks | **Bower** the bowerbird | Finds useful knowledge and coordinates the next actions (and loves blue things) |
| Employee Coach | **Roo** the kangaroo | Explains the steps, answers employee questions and flags issues for Digger review |
| Client | **Tally**, the homeowner persona | Friendly parent, no construction hat |
| Brand Stories | **Kooka** the kookaburra | Camera ready, tells the story behind the client's project |

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
