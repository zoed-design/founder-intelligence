# Founder Intelligence

A multi-agent knowledge platform for small businesses. It captures what the business learns every day, holds it in one knowledge base with three access tiers, and puts a router in front of specialist agents for crew, customers, office and content. The founder only sees what needs their judgement.

This repository is a **hackathon prototype** (WSTI Festi 2026), built first for **construction and contractors**. **All data is labelled dummy data**; see [docs/DATA.md](docs/DATA.md).

**Live app:** https://business-analyst-services.github.io/founder-intelligence/

## Try it

Switch roles from the top bar. Everything one role sends lands with the agents and, when needed, in the founder's queue; approvals land back in the sender's chat.

| Role | What to try |
|---|---|
| **Founder** | Review queue, Knowledge, Audit trail, Agents and policy. Approve, edit or reject; answer knowledge gaps; switch auto-answers on or off. |
| **Site crew** | A phone app. Ask about party-wall insulation (instant answer), studs at 600 (conflict flagged), markup (withheld), decking nails (knowledge gap). Send a photo. |
| **Homeowner** | Project portal with build stages, shared documents and a project assistant. Ask about the frame claim or request a wider kitchen opening (escalated). |
| **Office** | Bookkeeper and admin email. Code a docket (always to the founder) or send "FYI from now on…" (proposed as knowledge). |
| **Public** | Website chat that can only reach public knowledge, plus posts the founder has approved. |

**Play demo morning** replays the five 7:00 am inputs from the pitch. The **agent map** on the right animates every step.

## How the agents work

See **[docs/agents.md](docs/agents.md)**. In short: capture → router → curator → teamwork, commercial or content → sent or founder gate. The router locks each request to the sender's tiers and jobs; the curator searches knowledge *as the sender*; agents may only send answers that quote approved knowledge the person may see. Everything else waits for the founder. Founder answers and edits become rules the agents use next time.

**What is real and what is simulated.** Real: the agent chain, tier enforcement, conflict check, autonomy rule, review gate, learning loop and audit trail. Simulated: speech-to-text, vision (you pick what a photo shows) and each agent's reasoning, which is rule-based rather than a language model.

## Run it

```bash
npm start      # http://localhost:8080
npm test       # 27 tests: tiers, routing, escalation, autonomy, review gate, learning loop
```

No build step and no dependencies. Plain HTML, CSS and ES modules. App state is kept in the browser (localStorage); **Reset** clears it.

## Layout

| Path | What it is |
|---|---|
| `src/engine.js` | Each agent's rules: identify, bind job, tier-limited retrieval, classify, conflicts, drafting, review gate, learning |
| `src/agents.js` | Agent runtime: runs the chain, records steps and handoffs, applies the autonomy rule |
| `src/map.js` | The animated agent map |
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

All people, businesses, addresses and figures are fictional.
