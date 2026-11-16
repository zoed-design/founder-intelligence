# Source-backed sample project demo

## Demonstrate it

Open the app, select New session, then Load sample project. This is a deliberate input; no case is loaded or messages generated on initial page load. The source files are available under Sample files once loaded.

Bower compares the reviewed records. The west elevation shows top of wall 48.10, roof FFL 47.30 and level 1 FFL 44.60. The checks calculate 3.50 m to wall top and 2.70 m to roof FFL: 800 mm between the two upper levels. The conversation requests 800 mm in the middle. The roof plan and chat both state a 5 degree fall. This is a flag for takeoff review, not permission to change construction or assume a uniform wall height.

The schedule’s roof-covering entry, original row 78, has no recorded start or finish date. Bower exposes that gap without inventing a date, booking or inspection sign-off. OC checklist items support the document-preparation task; they do not verify current compliance or that documents exist.

Three parallel drafts are prepared: Roo’s employee coaching and review task, Tally’s client update and Kooka’s Client Story. Ask Bower about the roof-height difference, inspection dates, OC documents or source references. Open Roo and ask about changing the roof structure; Digger receives the question for review. No structural change is authorised.

Review and approve locally, then download. The Markdown export includes source titles, locators and links. Nothing is sent or scheduled.

## What runs

The app fetches sample-data/project.json and loads the reviewed records into the session Wiki. src/sample-project.js validates the data, computes the level differences, checks the roof-covering dates and prepares rule-based, audience-specific drafts and answers. The checks change if the structured source values change. This is source-driven logic, not live AI reasoning or live PDF/XLSX ingestion.

Preparing and checking the extract pack was an offline step. To change the case, update the reviewed facts and matching source files together, then rerun tests. Uploading a different PDF does not automatically rebuild the Wiki. Photo attachments are not analysed.

The public address is 18 Maroubra Street, Maroubra. Coastal Duplex is the story alias. Professional identities are fictional. The public extracts omit original title blocks, contacts, private comments and full source packs. All downloads in this static app are public; persona filtering is a demonstration of audience handling, not production authorisation.

## Verification

Automated tests cover the 800 mm calculation, conflicting source values, missing and recorded dates, source links, malformed sample data, private-note isolation, public-copy checks and Digger review. Browser checks cover loading, citations, upload within the selected case, all role views, review, approval, export and session reset.
