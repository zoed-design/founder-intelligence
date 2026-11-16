# One-project prototype demo

Follow [the current walkthrough](../README.md#try-it) and [the source register](../sample-data/README.md). The single project Wiki loads automatically. Photo upload still creates three parallel role drafts. Manual WhatsApp text imports create unverified session Wiki entries, separate from reviewed schedule facts.

## Editing

Update sample-data/project.json and the matching public extracts together. Schedule milestones are mapped by source row in schedule.milestones; projected dates are not actual completion. Answer rules and source-based drafts are in src/sample-project.js. Text collection, tagging and duplicate detection are in src/session-wiki.js. Interface controls are in demo.js. Colours remain in demo.css. The original engine and generic adapters are retained for compatibility; the active UI uses this single project.

## Limits

No connected WhatsApp, Drive, Notion or external Wiki; no live AI, arbitrary screenshot OCR, image measurement or compliance certification. Full PDF packs are excluded pending further de-identification and are not generally searchable. New session clears imports and attachments. All published files are public; role tabs are a demonstration, not authentication. Digger reviews proposed changes and outgoing drafts.
