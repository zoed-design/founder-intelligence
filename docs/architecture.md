# Architecture

One knowledge base, one front door, a crew of specialist agents.

```
Sources ──► Capture agent ──► Curator agent ──► Founder review gate ──► Knowledge base (3 tiers)
(SMS, voice,   (transcribe,      (bind to job,        (approve / edit /         internal
 email, photo,  extract)          check against        reject)                  customer-safe
 WhatsApp,                        documents, flag                               public-approved
 dockets)                         conflicts)                                          │
                                                                                      ▼
Person asking ──► Router (front door) ──► Teamwork agent   (trades, supervisors)  ──► Review gate ──► Sent
                  identify, tier lock,    Commercial agent (claims, variations, POs)
                  route, escalate         Content agent    (founder-voice posts)
                         │
                         └──► Founder (escalation: structural / contractual / < 0.9 confidence)

Feedback loop: founder edits ──► new internal rule ──► grounds the next answer
Under everything: data access controls · human review · audit trail · guided onboarding
```

## Access tiers

| Tier | Who can see it | Examples (dummy) |
|---|---|---|
| Internal | Founder, admin, bookkeeper | Buy-rates and markup, purchase orders, variation rule, founder rules |
| Customer-safe | Plus supervisors, trades, clients, certifier, on their own jobs | Drawing details, lender stages, claim register, QA standards |
| Public-approved | Everyone | What we build, founder voice guide |

Project-scoped roles (supervisor, subcontractor, client, certifier) only see customer-safe records for jobs they are on.

## Role card

Every agent is defined by the same five fields in `data/agents.json`: purpose, sources, tier, autonomy, handover. Adding an agent means adding a card.

## Escalation

The router never automates scope changes, structural deviations, contractual matters or disputes, and escalates anything under 0.9 confidence.

## Source

Adapted from the team's *Constructions & Contractors Multi-Agent Intelligence Architecture* brief and the Founder Intelligence one-pager. Differences from the brief are recorded in [DATA.md](DATA.md#changes-from-the-team-brief).
