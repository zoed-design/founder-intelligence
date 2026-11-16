# Data register

## Current sample-data presentation

The app includes selected de-identified extracts of founder-supplied project records in `sample-data/`. The project address and professional identities are fictional aliases; drawing values, task labels, planned dates and conversation wording are retained in the reviewed extracts. See [the public sample register](../sample-data/README.md) and [the source-backed demo guide](sample-data-demo.md) for provenance, exclusions and limits.

Choose **Load sample project** to run source-based arithmetic, schedule-gap checks and audience-specific drafts. Uploads stay in memory. No photo analysis, live document ingestion, dispatch, booking, compliance certification or connected account sync is performed. Full source packs and private preparation files are excluded from Git.

## Legacy engine fixtures

The register below describes only `data/*.json`, preserved for the original engine and its tests. It does not describe the active sample-data UI.

Hackathon rule: be clear about every source, what it is used for, and any dummy data. This register covers every file in `data/`.

## Status

**All files in `data/` are dummy fixtures.** No personal, medical, client or commercial data is used. People are identified by role only. Businesses, addresses, job codes, dockets and amounts are invented.

| File | Contents | Status | Used for | Swap for real data |
|---|---|---|---|---|
| `business.json` | Fictional builder, two jobs, people by role, role access rules | Dummy | Identifying senders, tier and project scope | Directory from the business's tools; roles set at onboarding |
| `knowledge.json` | 9 knowledge entries across three tiers | Dummy | Retrieval, citations, tier enforcement | Approved entries from the curator pipeline |
| `inbox.json` | Five scripted 7:00 am inputs | Dummy; transcripts and vision output simulated | Morning triage demo | Live feeds from SMS, email, WhatsApp, camera uploads |
| `agents.json` | Six role cards | Design, not data | Displaying and documenting agents | Unchanged, or extended per vertical |
| `photo-presets.json` | Three photo types (waterproofing, frame, unclear) with simulated vision output | **Simulated vision** | Site crew photo uploads: the person picks what the photo shows | A vision model returning the same fields |
| `assumptions.json` | Minutes per task, stand-down cost | **Illustrative, not measured** | Impact panel only | Founder interviews or time-and-motion data |

## Data entered in the app

The current UI holds typed text, attachments and drafts in memory only; **New session** or reloading clears them. The original legacy UI used local storage. Do not enter sensitive personal or client details. All bundled sample downloads are public.

## Method: from raw input to recommendation

1. **Capture.** Voice and photos become text. In the demo the transcript and `simulatedVision` block stand in for model output.
2. **Identify.** The sender's directory entry gives their role, tiers and jobs.
3. **Bind.** The job is found from names in the text, the photo hint, or a matching record (a docket via its purchase order).
4. **Retrieve.** Entries are scored by keyword overlap, then split into visible and withheld by tier and job.
5. **Check.** Numeric specs in the question are compared with approved documents (e.g. 600mm asked, 450mm approved).
6. **Decide.** Scope or structural changes, or confidence under 0.9, escalate to the founder.
7. **Draft.** Templates fill in retrieved knowledge; citations are limited to the draft's own tier or a more open one.
8. **Review.** The founder approves, edits or rejects. Edits become internal rules.

Confidence values are fixed numbers in the demo, not model scores.

## Standards and law referenced

Cited by name only, as context for the dummy QA standard. Clause-level claims must be checked by a subject matter expert before any real use.

- AS 3740, Waterproofing of domestic wet areas
- AS 1684, Residential timber-framed construction (named in the team brief)
- Home Building Act 1989 (NSW): written variations. The team brief cites "Section 14B"; **this section number has not been verified** and is not used in the demo.

## Changes from the team brief

The team's construction brief named real organisations and a person. For a public repository these were replaced:

| In the brief | In the demo | Why |
|---|---|---|
| A named site supervisor | "Site supervisor" (role only) | No personal data |
| A real street address and job code | `JOB-24-ELM`, 12 Elm Ridge Rd, Exampleville (fictional) | No real addresses |
| A named concrete supplier and docket | Harbour Readymix (fictional), docket HR-8821 | Avoid implying real transactions |
| A named bank | "the lender" | Avoid implying a real lender process |
| Photo bound to a Stage 3 draw on the same job as the framing question | Photo bound to a second job at Fixing stage | Waterproofing happens after frame; keeps the stage logic realistic |
| ROI figures ($600 stand-down, $95,000 draw, 1h 45m saved) | Counts from the run plus labelled illustrative assumptions | Figures were not measured |

## Supporting material (not used as data)

- *State of AI Readiness: Australian Small Business, 2026* (Tech Horizon Labs, April 2026). Context for the problem statement; figures should be cited from the report directly if used in the pitch.
- WSTI Festi 2026 hackathon session notes. Source of the data rules above.
