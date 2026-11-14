# Founder Intelligence

A multi-agent knowledge platform for small businesses. It captures what the business learns every day, holds it in one knowledge base with three access tiers, and puts a router in front of specialist agents for crew, customers, office and content. The founder only sees what needs their judgement.

This repository is a **hackathon prototype** (WSTI Festi 2026), built first for **construction and contractors**. **All data is labelled dummy data**; see [docs/DATA.md](docs/DATA.md).

**Live app:** https://business-analyst-services.github.io/founder-intelligence/

## Try it

1. Press **Play the 7 am rush**. Five messages arrive; the crew answers what it can.
2. As the **Founder**, look at **Needs you**. For each reply, choose **Send**, **Change** or **Don't send**. Tap **Why is this here?** for the reason and the source.
3. Use **See it as** to switch to **Site crew**, **Homeowner**, **Office** or **Public** and ask your own questions. Replies you send as the founder appear in their chats.

Things to try as the site crew: ask about party-wall insulation (Roo answers straight away), studs at 600 (doesn't match the drawings, so it comes to you), markup (private) and decking nails (nobody knows yet: answer it as the founder, then ask again).

## Meet the crew

Every agent is a low-poly Australian animal in a hard hat and hi-vis, in the same style as [SFIA Agent Studio](https://business-analyst-services.github.io/SFIA-agent-Studio/)'s menagerie.

| Agent | Who | Why that animal |
|---|---|---|
| Router | **Digger** the wombat, in the foreman's white hat | Australia's champion digger runs the site. He talks you through each message and dances when the crew gets it right. Turn on **Voice** to hear him (browser speech, off by default). |
| Capture | **Lyra** the lyrebird | Copies every sound it hears |
| Curator | **Bower** the bowerbird | Collects and sorts the good stuff (and loves blue things) |
| Teamwork | **Roo** the kangaroo | Tape measure in the pouch, answers the crew |
| Commercial | **Tally** the numbat | Clipboard in hand, counts and codes |
| Content | **Kooka** the kookaburra | Camera ready, tells the stories |

## How the agents work

See **[docs/agents.md](docs/agents.md)**. In short: capture → router → curator → teamwork, commercial or content → sent or founder gate. The router locks each request to the sender's tiers and jobs; the curator searches knowledge *as the sender*; agents may only send answers that quote approved knowledge the person may see. Everything else waits for the founder. Founder answers and edits become rules the agents use next time.

**What is real and what is simulated.** Real: the agent chain, tier enforcement, conflict check, autonomy rule, review gate, learning loop and audit trail. Simulated: speech-to-text, vision (you pick what a photo shows) and each agent's reasoning, which is rule-based rather than a language model.

## Run it

```bash
npm start      # http://localhost:8080
npm test       # 27 tests: tiers, routing, escalation, autonomy, review gate, learning loop
```

No build step and no package dependencies (three.js is vendored). Plain HTML, CSS and ES modules. App state is kept in the browser (localStorage); **Reset** clears it.

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

All people, businesses, addresses and figures are fictional.
