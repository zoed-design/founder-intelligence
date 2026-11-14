# Founder Intelligence

A multi-agent knowledge platform for small businesses. It captures what the business learns every day, holds it in one knowledge base with three access tiers, and puts a front-door router in front of specialist agents for staff, customers and content. A founder review gate sits before anything leaves the building.

This repository is a **hackathon prototype** (WSTI Festi 2026). The first vertical is **construction and contractors**, based on the team's architecture brief. **All data is labelled dummy data**; see [docs/DATA.md](docs/DATA.md).

**Live demo:** https://business-analyst-services.github.io/founder-intelligence/ (deployed by `.github/workflows/pages.yml` after the tests pass)

## What the demo shows (3 minutes)

1. **7:00 am inbox.** Five inputs arrive: a framer's voice note, a bookkeeper's docket query, an admin's claim question, an unlabelled site photo and a homeowner's change request.
2. **Run morning triage.** The router identifies each sender, locks them to their access tier, binds the item to a job and hands it to an agent. The curator flags that the framer's "600mm like last job" conflicts with the approved 450mm schedule. The homeowner's structural change is escalated automatically.
3. **One photo, three value streams.** The ensuite waterproofing photo becomes a certifier pre-screed record, claim evidence and a draft post in the founder's voice.
4. **Founder review gate.** Approve, edit or reject each draft, or approve all routine drafts in one click; escalated items still wait. Every draft shows its sources.
5. **Feedback loop.** Edit a draft and add a sentence: it becomes a founder rule in the internal tier, and the next answer uses it.
6. **Ask as anyone.** The same question gets a different answer by role. A subcontractor asking about pricing is refused; the founder gets the answer.
7. **Behind the scenes.** Routing, withheld records, conflicts, escalations and approvals are all logged.

## Run it

```bash
npm start      # serves on http://localhost:8080 (python3 http.server)
npm test       # 15 tests: tiers, routing, escalation, review gate, feedback loop
```

No build step and no dependencies. Plain HTML, CSS and ES modules.

## How it is built

| Path | What it is |
|---|---|
| `src/engine.js` | Pure logic: identify, bind to job, retrieve with tier enforcement, classify, route, detect conflicts, draft, review gate, feedback loop, ask |
| `data/*.json` | Labelled dummy data: business and roles, knowledge base, inbox, role cards, illustrative assumptions |
| `index.html`, `app.js`, `styles.css` | The demo page |
| `tests/engine.test.js` | Node test runner, no dependencies |
| `docs/` | Five Ws, architecture, ADRs, glossary, data register, real-data guide |

### The governance rules the tests hold

- A person sees only the tiers their role allows, and project-scoped roles see only their own jobs.
- If the best match is a record the person may not see, the answer is withheld rather than taken from a weaker visible match.
- An output may only cite knowledge at its own tier or a more open one.
- Scope and structural changes always escalate; anything below 0.9 confidence escalates.
- Every draft starts pending; an edited approval keeps the original and creates an internal founder rule.

## What is real and what is simulated

Real: routing, tier enforcement, conflict check, review gate, feedback loop, audit trail.
Simulated: speech-to-text (transcripts are in the data), vision (the photo carries a `simulatedVision` block) and drafting (templates). [ADR 0002](docs/adr/0002-simulated-ai-steps.md) explains where a model plugs in.

## Swapping in real data

See [docs/real-data.md](docs/real-data.md). In short: replace the files in `data/` with the same shapes, keep the `_dummy` note honest, and log each source in `docs/DATA.md`.

## Docs

- [Five Ws: scope the problem](docs/five-ws.md)
- [Architecture](docs/architecture.md)
- [Data register](docs/DATA.md)
- [Glossary](docs/glossary.md)
- [ADRs](docs/adr/)

## Credits

Business Analyst Services, with the construction vertical brief by the team. Pattern follows [SFIA Agent Studio](https://business-analyst-services.github.io/SFIA-agent-Studio/): one front door, a roster of role agents, a visible trail of routing, checks and approvals.

All people, businesses, addresses and figures are fictional.
